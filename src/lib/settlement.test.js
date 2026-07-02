import { describe, it, expect } from 'vitest'
import { settle, settleAlcohol, participantsAt } from './settlement'

// 모든 거래가 같은 시각(T)에 발생 + 두 지분참여자(O,S1)가 그 시각 출근중 → 기존 분배와 동일
const T = '2026-07-02T12:00:00Z'
const IN = '2026-07-02T10:00:00Z'
const allInWindows = [
  { id: 'O', role: 'owner', inAt: IN, outAt: null },
  { id: 'S1', role: 'staff', inAt: IN, outAt: null },
]

describe('settle() — 항목 분배', () => {
  const charges = [
    { type: 'tc', amount: 50000, customer_id: 'C1', at: T },
    { type: 'talk', amount: 250000, princess_id: 'P1', princess_referred_by: 'R1', customer_id: 'C1', at: T },
    { type: 'date2', amount: 1000000, princess_id: 'P2', customer_id: 'C2', customer_referred_by: 'R2', at: T },
  ]
  const r = settle(charges, allInWindows)

  it('운영풀 = tc5 + talk풀10 - 영입1 + date2풀30 - 손님추천3 = 41만', () => {
    expect(r.pool).toBe(410000)
  })
  it('공주 개인: 대화료 15만, 2차 70만', () => {
    expect(r.perMember.find((m) => m.id === 'P1').talk).toBe(150000)
    expect(r.perMember.find((m) => m.id === 'P2').date2).toBe(700000)
  })
  it('영입자 R1 +1만, 손님추천자 R2 +3만', () => {
    expect(r.perMember.find((m) => m.id === 'R1').recruit).toBe(10000)
    expect(r.perMember.find((m) => m.id === 'R2').referral).toBe(30000)
  })
  it('사장 지분 > 스탭 지분, 합계 ≈ 운영풀', () => {
    const o = r.perMember.find((m) => m.id === 'O').share
    const s = r.perMember.find((m) => m.id === 'S1').share
    expect(o).toBeGreaterThan(s)
    expect(o + s).toBeLessThanOrEqual(410000 + 1)
    expect(o + s).toBeGreaterThanOrEqual(410000 - 1)
  })
  it('손님추천은 동일 손님 1회만', () => {
    const dup = settle(
      [
        { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C9', customer_referred_by: 'R9', at: T },
        { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C9', customer_referred_by: 'R9', at: T },
      ],
      allInWindows
    )
    expect(dup.perMember.find((m) => m.id === 'R9').referral).toBe(30000)
  })
})

describe('settle() — 시간귀속', () => {
  it('판매 시각에 출근중이던 사람만 그 운영풀을 나눔 (퇴근자 제외)', () => {
    const w = [
      { id: 'A', role: 'staff', inAt: '2026-07-02T20:00:00Z', outAt: '2026-07-02T22:30:00Z' },
      { id: 'B', role: 'staff', inAt: '2026-07-02T22:00:00Z', outAt: null },
    ]
    const r = settle(
      [
        { type: 'tc', amount: 50000, at: '2026-07-02T21:00:00Z' }, // A만 출근중
        { type: 'tc', amount: 50000, at: '2026-07-02T23:00:00Z' }, // A 퇴근 후 → B만
      ],
      w
    )
    expect(r.perMember.find((m) => m.id === 'A').share).toBe(50000)
    expect(r.perMember.find((m) => m.id === 'B').share).toBe(50000)
  })

  it('그 시각 출근자가 없으면 운영풀은 미분배로 집계', () => {
    const r = settle([{ type: 'tc', amount: 50000, at: T }], [])
    expect(r.poolUnattributed).toBe(50000)
    expect(r.perMember.length).toBe(0)
  })
})

describe('settleAlcohol() — 시간귀속', () => {
  it('주류 마진 전원 동일(N빵), 도매원가 회수 없음 (사장·공주·스탭 동일)', () => {
    const w = [
      { id: 'O', role: 'owner', inAt: IN, outAt: null },
      { id: 'P1', role: 'princess', inAt: IN, outAt: null },
      { id: 'S1', role: 'staff', inAt: IN, outAt: null },
    ]
    const a = settleAlcohol([{ amount: 300000, cost: 120000, at: T }], w) // 마진18만, 3명 N빵
    expect(a.margin).toBe(180000)
    expect(a.per['O']).toBe(60000)
    expect(a.per['P1']).toBe(60000)
    expect(a.per['S1']).toBe(60000)
  })

  it('예시: 21시 판매는 리아시만, 23시 판매는 리아시+박두팔 → 27만/9만', () => {
    const w = [
      { id: 'ria', role: 'staff', inAt: '2026-07-02T20:00:00Z', outAt: '2026-07-03T00:00:00Z' },
      { id: 'bak', role: 'staff', inAt: '2026-07-02T22:00:00Z', outAt: null },
    ]
    const items = [
      { amount: 300000, cost: 120000, at: '2026-07-02T21:00:00Z' }, // 마진18만, 리아시만
      { amount: 300000, cost: 120000, at: '2026-07-02T23:00:00Z' }, // 마진18만, 둘이 반반
    ]
    const a = settleAlcohol(items, w)
    expect(a.per['ria']).toBe(270000) // 180000 + 90000
    expect(a.per['bak']).toBe(90000)
  })

})

describe('participantsAt()', () => {
  it('inAt<=t<outAt 인 사람만, 중복 멤버 1회', () => {
    const w = [
      { id: 'A', role: 'staff', inAt: '2026-07-02T20:00:00Z', outAt: '2026-07-02T22:00:00Z' },
      { id: 'A', role: 'staff', inAt: '2026-07-02T23:00:00Z', outAt: null }, // 두번째 블록
      { id: 'B', role: 'staff', inAt: '2026-07-02T21:00:00Z', outAt: null },
    ]
    const at2130 = participantsAt(w, '2026-07-02T21:30:00Z').map((m) => m.id).sort()
    expect(at2130).toEqual(['A', 'B'])
    const at2230 = participantsAt(w, '2026-07-02T22:30:00Z').map((m) => m.id).sort()
    expect(at2230).toEqual(['B']) // A는 첫 블록 퇴근, 둘째 블록 전
  })
})
