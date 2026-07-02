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

// windows 중 시각 at 에 출근중인 참여자 목록(중복 멤버 제거)
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
    out.push({ id: w.id, role: w.role })
  }
  return out
}

const shareOf = (m) => (m.role === 'owner' ? 1.2 : 1.0)

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

// 주류·메뉴 정산(시간귀속).
//  - 마진(판매가−도매가): 각 판매 시각 출근 전원(사장1.5·스탭·공주 1.0) N빵
//  - 도매원가: 사장이 재고를 대므로 출근 여부와 무관하게 항상 사장(ownerIds)에게 회수(균등)
// itemCharges: [{ amount, cost, at }]  ·  costOwnerIds: 도매(재고) 대는 사장 멤버 id 배열(보통 시진핑 1명)
export function settleAlcohol(itemCharges, windows, costOwnerIds = []) {
  const per = {}          // 멤버별 총 주류 정산(마진분배 + 원가회수)
  const costRecovery = {} // 사장별 도매원가 회수(장부)
  let margin = 0
  let cost = 0
  let marginUnattributed = 0
  let costUnrecovered = 0
  const aShare = (m) => (m.role === 'owner' ? 1.5 : 1.0)

  // 1) 마진 분배 (시간귀속, 역마진은 0으로 clamp)
  for (const c of itemCharges || []) {
    const m = (c.amount || 0) - (c.cost || 0)
    const dist = Math.max(0, m)
    margin += m
    cost += c.cost || 0
    const parts = participantsAt(windows, c.at)
    const totalShares = parts.reduce((s, p) => s + aShare(p), 0)
    if (totalShares <= 0) {
      marginUnattributed += dist
      continue
    }
    const unit = dist / totalShares
    for (const p of parts) per[p.id] = (per[p.id] || 0) + Math.round(aShare(p) * unit)
  }

  // 2) 도매원가 회수 — 출근 무관, 도매 담당 사장에게 (보통 시진핑 1명; 여럿이면 균등)
  const owners = costOwnerIds || []
  if (cost > 0 && owners.length > 0) {
    const base = Math.floor(cost / owners.length)
    let rem = cost - base * owners.length
    for (const oid of owners) {
      const amt = base + (rem > 0 ? 1 : 0)
      if (rem > 0) rem--
      costRecovery[oid] = (costRecovery[oid] || 0) + amt
      per[oid] = (per[oid] || 0) + amt
    }
  } else if (cost > 0) {
    costUnrecovered = cost // 사장이 아예 없을 때(방어)
  }

  return { margin, cost, marginUnattributed, costUnrecovered, per, costRecovery }
}
