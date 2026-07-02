// 정산 엔진 (순수) — 거래별 "시간귀속" 분배.
// 각 거래(charge)의 발생 시각(at = created_at)에 출근중이던 사람만 그 거래를 나눠 가진다.
//
// windows: [{ id, role, inAt, outAt }]  // 각 직원의 출근~퇴근 구간(ISO 문자열 또는 ms)
//   - inAt <= 거래시각 < outAt 이면 그 시각 "출근중". outAt=null이면 그날 계속 출근으로 간주.
//
// charges: [{ type:'tc'|'talk'|'date2', amount, at, princess_id, customer_id,
//             princess_referred_by, customer_referred_by }]
//
// 분배 규칙(항목은 그대로):
//  - tc: 전액 운영풀
//  - talk: 공주 15/25, 운영풀 10/25, (공주 영입자 있으면 운영풀에서 1만→영입자)
//  - date2: 공주 70/100, 운영풀 30/100
//  - 손님추천: referred_by 있는 손님 1명당 3만(운영풀에서 차감→추천자)
//  - 남은 운영풀: 그 거래 시각 출근자(사장·스탭) 지분율로 분배 (사장 1.2 / 그 외 1.0)

export const RECRUIT_PER_TALK = 10000 // 공주 영입 1만/타임
export const CUSTOMER_REFERRAL = 30000 // 손님 추천 3만/명

const ms = (v) => (v == null ? null : (typeof v === 'number' ? v : Date.parse(v)))

// windows 중 시각 at 에 출근중인 참여자 목록(중복 멤버 제거). weight(지분 가중치)도 전달.
export function participantsAt(windows, at) {
  const t = ms(at)
  if (t == null) return []
  const seen = new Set()
  const out = []
  for (const w of windows || []) {
    const i = ms(w.inAt)
    if (i == null || i > t) continue
    const o = ms(w.outAt)
    if (o != null && o <= t) continue
    if (seen.has(w.id)) continue
    seen.add(w.id)
    out.push({ id: w.id, role: w.role, weight: w.weight })
  }
  return out
}

// 운영풀 지분: 호출부가 weight를 주면 그걸 쓰고(시진핑 1.2 : 그 외 1.0), 없으면 role 폴백
const shareOf = (m) => (m.weight != null ? m.weight : (m.role === 'owner' ? 1.2 : 1.0))

export function settle(charges, windows) {
  const per = {}
  const ensure = (id) => {
    if (!per[id]) per[id] = { talk: 0, date2: 0, share: 0, referral: 0, recruit: 0 }
    return per[id]
  }
  const add = (id, key, amt) => {
    if (!id || !amt) return
    ensure(id)[key] += amt
  }

  let pool = 0
  let poolUnattributed = 0 // 그 시각 출근자가 없어 분배 못한 운영풀
  const countedCustomers = new Set()

  // 손님추천 3만은 "그날 공주 세션(대화료/2차)이 있는 손님"에 대해서만 지급
  // (삐끼가 공주 예약을 도운 방문만 인정 — 그냥 술만 마시고 가면 미지급)
  const princessSessionCustomers = new Set()
  for (const c of charges || []) {
    if ((c.type === 'talk' || c.type === 'date2') && c.customer_id) princessSessionCustomers.add(c.customer_id)
  }

  for (const c of charges || []) {
    const amt = c.amount || 0
    let cPool = 0
    if (c.type === 'tc') {
      cPool += amt
    } else if (c.type === 'talk') {
      add(c.princess_id, 'talk', Math.round((amt * 15) / 25))
      cPool += Math.round((amt * 10) / 25)
      if (c.princess_referred_by) {
        cPool -= RECRUIT_PER_TALK
        add(c.princess_referred_by, 'recruit', RECRUIT_PER_TALK)
      }
    } else if (c.type === 'date2') {
      add(c.princess_id, 'date2', Math.round((amt * 70) / 100))
      cPool += Math.round((amt * 30) / 100)
    }
    if (c.customer_id && c.customer_referred_by && !countedCustomers.has(c.customer_id) && princessSessionCustomers.has(c.customer_id)) {
      countedCustomers.add(c.customer_id)
      cPool -= CUSTOMER_REFERRAL
      add(c.customer_referred_by, 'referral', CUSTOMER_REFERRAL)
    }

    cPool = Math.max(0, cPool) // 지분참여자에게 마이너스 분배 금지
    pool += cPool

    // 이 거래 시각에 출근중인 사장·스탭에게만 분배
    const sm = participantsAt(windows, c.at).filter((m) => m.role === 'owner' || m.role === 'staff')
    const totalShares = sm.reduce((s, m) => s + shareOf(m), 0)
    if (totalShares > 0) {
      const unit = cPool / totalShares
      for (const m of sm) add(m.id, 'share', Math.round(shareOf(m) * unit))
    } else {
      poolUnattributed += cPool
    }
  }

  const perMember = Object.entries(per).map(([id, b]) => ({
    id,
    ...b,
    total: b.talk + b.date2 + b.share + b.referral + b.recruit,
  }))

  return { pool, poolUnattributed, perMember }
}

// 주류·메뉴 마진 정산(시간귀속).
//  - 각자 자기 돈으로 도매 사입 → 자기 매출에서 도매값은 자기가 챙김(앱이 원가 안 건드림).
//  - 마진(판매가−도매가)만 각 판매 시각 출근자 전원에게 균등(N빵) 분배. 역마진은 0.
// itemCharges: [{ amount, cost, at }]
export function settleAlcohol(itemCharges, windows) {
  const per = {} // 멤버별 마진 분배
  let margin = 0
  let marginUnattributed = 0

  for (const c of itemCharges || []) {
    const raw = (c.amount || 0) - (c.cost || 0)
    margin += raw
    const m = Math.max(0, raw) // 역마진(판매가<도매가)이면 분배 0 (마이너스 금지)
    const parts = participantsAt(windows, c.at)
    if (parts.length === 0) {
      marginUnattributed += m
      continue
    }
    const unit = m / parts.length // 전원 동일 N빵
    for (const p of parts) per[p.id] = (per[p.id] || 0) + Math.round(unit)
  }

  return { margin, marginUnattributed, per }
}
