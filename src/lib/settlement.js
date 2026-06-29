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
