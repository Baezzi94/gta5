import { describe, it, expect } from 'vitest'
import { settle, settleAlcohol } from './settlement'

describe('settle()', () => {
  const charges = [
    { type: 'tc', amount: 50000, customer_id: 'C1' },
    { type: 'talk', amount: 250000, princess_id: 'P1', princess_referred_by: 'R1', customer_id: 'C1' },
    { type: 'date2', amount: 1000000, princess_id: 'P2', customer_id: 'C2', customer_referred_by: 'R2' },
  ]
  const shareMembers = [
    { id: 'O', role: 'owner' },
    { id: 'S1', role: 'staff' },
  ]
  const r = settle(charges, shareMembers)

  it('운영풀 = tc5 + talk풀10 - 영입1 + date2풀30 - 손님추천3 = 41만', () => {
    expect(r.pool).toBe(410000)
  })
  it('공주 개인: 대화료 15만, 2차 70만', () => {
    const p1 = r.perMember.find((m) => m.id === 'P1')
    const p2 = r.perMember.find((m) => m.id === 'P2')
    expect(p1.talk).toBe(150000)
    expect(p2.date2).toBe(700000)
  })
  it('영입자 R1 +1만, 손님추천자 R2 +3만', () => {
    expect(r.perMember.find((m) => m.id === 'R1').recruit).toBe(10000)
    expect(r.perMember.find((m) => m.id === 'R2').referral).toBe(30000)
  })
  it('사장 지분 > 스탭 지분 (1.2 : 1.0)', () => {
    const o = r.perMember.find((m) => m.id === 'O').share
    const s = r.perMember.find((m) => m.id === 'S1').share
    expect(o).toBeGreaterThan(s)
    expect(o + s).toBeLessThanOrEqual(410000 + 1) // 반올림 오차 허용
  })
  it('주류: 마진 N빵(사장1.5) + 도매원가 사장 회수, 공주 포함', () => {
    // 판매 30만(도매12만) 1병 → 마진 18만, 도매 12만
    const items = [{ amount: 300000, cost: 120000 }]
    const parts = [
      { id: 'O', role: 'owner' },
      { id: 'P1', role: 'princess' },
      { id: 'S1', role: 'staff' },
    ]
    const a = settleAlcohol(items, parts)
    expect(a.margin).toBe(180000)
    expect(a.cost).toBe(120000)
    // 총지분 1.5+1+1=3.5, unit=180000/3.5≈51428.57
    // 공주 = round(51428.57)=51429
    expect(a.per['P1']).toBe(51429)
    expect(a.per['S1']).toBe(51429)
    // 사장 = round(1.5*unit)+도매12만 = round(77142.86)+120000 = 77143+120000
    expect(a.per['O']).toBe(77143 + 120000)
  })

  it('운영풀은 마이너스로 안 감(추천 차감이 유입보다 커도 0으로 clamp)', () => {
    // tc/talk 유입 없이 손님추천 3만만 차감 → 풀 -3만 → 0으로
    const neg = settle(
      [{ type: 'talk', amount: 0, princess_id: 'P1', customer_id: 'C1', customer_referred_by: 'R1' }],
      [{ id: 'O', role: 'owner' }]
    )
    expect(neg.pool).toBe(0)
    expect(neg.perMember.find((m) => m.id === 'O')?.share ?? 0).toBe(0)
  })
  it('주류: 사장 2명 출근 시 도매원가 중복회수 안 함(사장 수로 분배)', () => {
    const items = [{ amount: 300000, cost: 120000 }] // 마진18만, 도매12만
    const a = settleAlcohol(items, [
      { id: 'O1', role: 'owner' },
      { id: 'O2', role: 'owner' },
    ])
    // 도매 12만을 두 사장이 6만씩만 회수 (합계 12만, 중복회수 없음)
    const recovered = (a.per['O1'] - Math.round(1.5 * a.margin / a.totalShares)) +
                      (a.per['O2'] - Math.round(1.5 * a.margin / a.totalShares))
    expect(recovered).toBe(120000)
  })

  it('손님추천은 동일 손님 1회만', () => {
    const dup = settle(
      [
        { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C9', customer_referred_by: 'R9' },
        { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C9', customer_referred_by: 'R9' },
      ],
      []
    )
    expect(dup.perMember.find((m) => m.id === 'R9').referral).toBe(30000)
  })
})
