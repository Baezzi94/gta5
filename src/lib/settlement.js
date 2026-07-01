// 정산 엔진 (순수). 입력은 "수금 완료된" 거래만 넣는다.
//
// charges: [{ type:'tc'|'talk'|'date2', amount, princess_id, customer_id,
//             princess_referred_by, customer_referred_by }]
// shareMembers: [{ id, role }]  // 운영풀 지분 참여자 (owner 1.2 / 그 외 1.0)
//
// 분배 규칙:
//  - tc: 전액 운영풀
//  - talk: 공주 15/25, 운영풀 10/25, (공주 영입자 있으면 운영풀에서 1만→영입자)
//  - date2: 공주 70/100, 운영풀 30/100
//  - 손님추천: referred_by 있는 손님 1명당 3만 (운영풀에서 차감 → 추천자)
//  - 남은 운영풀: 지분율로 분배

export const RECRUIT_PER_TALK = 10000 // 공주 영입 1만/타임
export const CUSTOMER_REFERRAL = 30000 // 손님 추천 3만/명

// 주류·메뉴 마진 분배 (출근 전원 N빵, 사장 1.5배 + 도매원가 회수)
// itemCharges: [{ amount, cost }]  (수금완료·무효 제외된 item 거래)
// participants: [{ id, role }]  (사장 + 그날 출근 공주·스탭)
export function settleAlcohol(itemCharges, participants) {
  let margin = 0
  let cost = 0
  for (const c of itemCharges || []) {
    margin += (c.amount || 0) - (c.cost || 0)
    cost += c.cost || 0
  }
  const shareOf = (m) => (m.role === 'owner' ? 1.5 : 1.0)
  const totalShares = (participants || []).reduce((s, m) => s + shareOf(m), 0)
  const unit = totalShares > 0 ? margin / totalShares : 0
  // 도매원가 회수는 사장 몫. 사장이 2명 이상 출근했으면 중복회수 방지 위해 나눠서 회수
  const ownerCount = (participants || []).filter((m) => m.role === 'owner').length
  const per = {}
  for (const m of participants || []) {
    per[m.id] = Math.round(shareOf(m) * unit) + (m.role === 'owner' ? Math.round(cost / ownerCount) : 0)
  }
  return { margin, cost, totalShares, per }
}

export function settle(charges, shareMembers) {
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
  const countedCustomers = new Set()

  for (const c of charges || []) {
    const amt = c.amount || 0
    if (c.type === 'tc') {
      pool += amt
    } else if (c.type === 'talk') {
      add(c.princess_id, 'talk', Math.round((amt * 15) / 25))
      pool += Math.round((amt * 10) / 25)
      if (c.princess_referred_by) {
        pool -= RECRUIT_PER_TALK
        add(c.princess_referred_by, 'recruit', RECRUIT_PER_TALK)
      }
    } else if (c.type === 'date2') {
      add(c.princess_id, 'date2', Math.round((amt * 70) / 100))
      pool += Math.round((amt * 30) / 100)
    }
    // 손님추천: 추천자 있는 손님 1명당 1회 3만
    if (c.customer_id && c.customer_referred_by && !countedCustomers.has(c.customer_id)) {
      countedCustomers.add(c.customer_id)
      pool -= CUSTOMER_REFERRAL
      add(c.customer_referred_by, 'referral', CUSTOMER_REFERRAL)
    }
  }

  // 추천/영입 차감이 풀 유입보다 커도 지분참여자에게 마이너스 분배는 금지
  pool = Math.max(0, pool)

  const shareOf = (m) => (m.role === 'owner' ? 1.2 : 1.0)
  const totalShares = (shareMembers || []).reduce((s, m) => s + shareOf(m), 0)
  const unit = totalShares > 0 ? pool / totalShares : 0
  for (const m of shareMembers || []) {
    add(m.id, 'share', Math.round(shareOf(m) * unit))
  }

  const perMember = Object.entries(per).map(([id, b]) => ({
    id,
    ...b,
    total: b.talk + b.date2 + b.share + b.referral + b.recruit,
  }))

  return { pool, totalShares, unit, perMember }
}
