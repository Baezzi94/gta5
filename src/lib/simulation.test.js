// 백테스트 시뮬레이션 — 실제 영업 하루를 여러 시나리오로 돌려 정산/시간귀속 검증.
// 목적: 회귀 방지 + 이슈 발견. ⚠️ 주석은 "발견된 문제(현재 동작)"를 표기한 것.
import { describe, it, expect } from 'vitest'
import { settle, settleAlcohol, participantsAt } from './settlement'

const D = '2026-07-02'
const N = '2026-07-03'
const t = (h, m = 0) => `${D}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
const tn = (h, m = 0) => `${N}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
const win = (id, role, inAt, outAt = null) => ({ id, role, inAt, outAt })
const sumShares = (r) => r.perMember.reduce((s, m) => s + m.share, 0)

describe('시뮬레이션: 정상 영업 한 판', () => {
  // 사장 O(20시~), 스탭 S1(20시~), 공주 P1(20시~) 전원 개점부터 출근
  const w = [win('O', 'owner', t(20)), win('S1', 'staff', t(20)), win('P1', 'princess', t(20))]
  const charges = [
    { type: 'tc', amount: 50000, at: t(21) },
    { type: 'tc', amount: 50000, at: t(21, 30) },
    { type: 'tc', amount: 50000, at: t(22) },
    { type: 'talk', amount: 250000, princess_id: 'P1', at: t(21) },
    { type: 'date2', amount: 1000000, princess_id: 'P1', at: t(23) },
  ]
  const r = settle(charges, w)

  it('공주 개인몫: 대화료 15만 + 2차 70만', () => {
    const p1 = r.perMember.find((m) => m.id === 'P1')
    expect(p1.talk).toBe(150000)
    expect(p1.date2).toBe(700000)
  })
  it('운영풀 = tc15만 + talk풀10만 + date2풀30만 = 55만, 미분배 0', () => {
    expect(r.pool).toBe(550000)
    expect(r.poolUnattributed).toBe(0)
  })
  it('운영풀 분배 합계 ≈ 운영풀(반올림 오차 미미)', () => {
    expect(Math.abs(sumShares(r) - 550000)).toBeLessThanOrEqual(2)
  })
  it('주류: 양주 30만(도매12만) 2병 → 마진36만, 도매24만, 사장 원가회수', () => {
    const items = [
      { amount: 300000, cost: 120000, at: t(21) },
      { amount: 300000, cost: 120000, at: t(22) },
    ]
    const a = settleAlcohol(items, w) // 2병, 마진 각 18만 → 총 36만
    expect(a.margin).toBe(360000)
    // 출근 3명(O·S1·P1) N빵 → 각 판매 6만씩 x2병 = 12만
    expect(a.per['O']).toBe(120000)
    expect(a.per['S1']).toBe(120000)
    expect(a.per['P1']).toBe(120000)
    expect(a.marginUnattributed).toBe(0)
  })
})

describe('시뮬레이션: 출근 타이밍 엣지', () => {
  it('지각 출근: 출근 전 판매는 못 받음', () => {
    const w = [win('O', 'owner', t(20)), win('S1', 'staff', t(22))]
    const r = settle([{ type: 'tc', amount: 50000, at: t(21) }], w) // S1 출근 전
    expect(r.perMember.find((m) => m.id === 'S1')).toBeUndefined()
    expect(r.perMember.find((m) => m.id === 'O').share).toBe(50000)
  })
  it('조퇴: 퇴근 후 판매는 못 받음', () => {
    const w = [win('O', 'owner', t(20)), win('S1', 'staff', t(20), t(22))]
    const r = settle([{ type: 'tc', amount: 50000, at: t(23) }], w) // S1 퇴근 후
    expect(r.perMember.find((m) => m.id === 'S1')).toBeUndefined()
    expect(r.perMember.find((m) => m.id === 'O').share).toBe(50000)
  })
  it('자정 넘겨 영업 + 퇴근 안 누름: 다음날 새벽 판매도 귀속', () => {
    const w = [win('O', 'owner', t(20))] // outAt null
    const r = settle([{ type: 'tc', amount: 50000, at: tn(4) }], w) // 새벽 4시
    expect(r.perMember.find((m) => m.id === 'O').share).toBe(50000)
  })
})

describe('시뮬레이션: 미출근 / 미분배', () => {
  it('사장 미출근이어도 공주 개인몫은 지급, 운영풀은 스탭이 가져감', () => {
    const w = [win('S1', 'staff', t(20))] // 사장 없음
    const r = settle([
      { type: 'talk', amount: 250000, princess_id: 'P1', at: t(21) },
    ], w)
    expect(r.perMember.find((m) => m.id === 'P1').talk).toBe(150000)
    expect(r.perMember.find((m) => m.id === 'S1').share).toBe(100000) // talk풀 10만 전부
    expect(r.poolUnattributed).toBe(0)
  })
  it('아무도 출근 안 한 시각의 운영풀은 미분배로 집계(공주몫은 지급)', () => {
    const r = settle([
      { type: 'tc', amount: 50000, at: t(21) },
      { type: 'talk', amount: 250000, princess_id: 'P1', at: t(21) },
    ], [])
    expect(r.poolUnattributed).toBe(150000) // tc5 + talk풀10
    expect(r.perMember.find((m) => m.id === 'P1').talk).toBe(150000)
  })
  it('⚠️ 주류가 아무도 출근 안 한 시각에 팔리면 마진 미분배(현재 UI 경고 없음 → 개선 제안)', () => {
    const a = settleAlcohol([{ amount: 300000, cost: 120000, at: t(21) }], [])
    expect(a.marginUnattributed).toBe(180000)
    expect(Object.keys(a.per).length).toBe(0)
  })
})

describe('시뮬레이션: 다중 출근 블록(중간 이탈)', () => {
  it('두 블록 사이(갭) 판매는 못 받음', () => {
    // 20~22 근무, 이탈, 24~26 재근무 (availability 2행)
    const w = [win('S1', 'staff', t(20), t(22)), win('S1', 'staff', tn(0), tn(2))]
    const at21 = participantsAt(w, t(21)).map((m) => m.id)
    const at23 = participantsAt(w, t(23)).map((m) => m.id)
    const at1 = participantsAt(w, tn(1)).map((m) => m.id)
    expect(at21).toEqual(['S1'])
    expect(at23).toEqual([]) // 갭
    expect(at1).toEqual(['S1'])
  })
})

describe('시뮬레이션: 반올림 드리프트(소액 다건)', () => {
  it('TC 5만 x30건, 사장1.2:스탭1.0 → 분배합계가 운영풀과 거의 일치', () => {
    const w = [win('O', 'owner', t(20)), win('S1', 'staff', t(20))]
    const charges = Array.from({ length: 30 }, (_, i) => ({ type: 'tc', amount: 50000, at: t(20, i) }))
    const r = settle(charges, w)
    expect(r.pool).toBe(1500000)
    // 거래별 반올림이라 드리프트가 있을 수 있음 — 건수 이내여야 함
    expect(Math.abs(sumShares(r) - 1500000)).toBeLessThanOrEqual(30)
  })
})

describe('시뮬레이션: 주류 역마진(메뉴 오설정 방어)', () => {
  it('판매가<도매가면 직원 분배 0(마이너스 없음), 사장은 원가만 회수', () => {
    const w = [win('O', 'owner', t(20)), win('S1', 'staff', t(20))]
    const a = settleAlcohol([{ amount: 100000, cost: 120000, at: t(21) }], w) // 역마진 -2만
    expect(a.margin).toBe(-20000) // 실제 마진은 음수로 집계(참고용)
    expect(a.per['O']).toBe(0) // 분배 0 (마이너스 금지)
    expect(a.per['S1']).toBe(0)
  })
})

describe('시뮬레이션: 주류 마진 N빵(도매값은 각자 사입)', () => {
  it('500만 판매(도매200만) · 스탭3명 출근 → 마진 300만 N빵 100만씩(도매원가 회수 없음)', () => {
    const w = [win('A', 'staff', t(20)), win('B', 'staff', t(20)), win('C', 'staff', t(20))]
    const a = settleAlcohol([{ amount: 5000000, cost: 2000000, at: t(21) }], w)
    expect(a.margin).toBe(3000000)
    expect(a.per['A']).toBe(1000000)
    expect(a.per['B']).toBe(1000000)
    expect(a.per['C']).toBe(1000000)
    // 도매 200만은 각자 자기 매출에서 챙김 → 앱 분배엔 없음
    const total = Object.values(a.per).reduce((s, v) => s + v, 0)
    expect(total).toBe(3000000)
  })
})

describe('⚠️ 발견 이슈(현재 동작 기록)', () => {
  it('재출근 후에도 원래 출근시각 보존 → 퇴근 전 판매 정상 귀속(reCheckIn 수정됨)', () => {
    // 수정: reCheckIn은 checked_out_at만 해제, checked_in_at(20시) 유지.
    // 20시 출근→22시 퇴근→23시 재출근 후 window는 {in:20시, out:null} → 21시 판매 정상 귀속.
    const wAfterReCheckin = [win('ria', 'staff', t(20))]
    const a = settleAlcohol([{ amount: 300000, cost: 120000, at: t(21) }], wAfterReCheckin)
    expect(a.per['ria']).toBe(180000)
    expect(a.marginUnattributed).toBe(0)
  })
  it('손님추천 3만이 공주 예약 방문일마다 재지급(정책: 방문마다, 공주세션 조건)', () => {
    // 공주 세션(talk) 포함된 방문이라 지급. 다른 날 또 오면 또 3만(정책상 정상).
    const mk = () => settle([
      { type: 'tc', amount: 50000, customer_id: 'C1', customer_referred_by: 'R1', at: t(21) },
      { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C1', at: t(21) },
    ], [win('S1', 'staff', t(20))])
    expect(mk().perMember.find((m) => m.id === 'R1').referral).toBe(30000)
    expect(mk().perMember.find((m) => m.id === 'R1').referral).toBe(30000)
  })
})

describe('시뮬레이션: 손님추천 게이팅(공주 예약 도움 시에만)', () => {
  const w = [win('S1', 'staff', t(20))]
  it('공주 세션 있는 방문 → 삐끼 3만 지급', () => {
    const r = settle([
      { type: 'tc', amount: 50000, customer_id: 'C1', customer_referred_by: 'BK', at: t(21) },
      { type: 'talk', amount: 250000, princess_id: 'P1', customer_id: 'C1', at: t(21) },
    ], w)
    expect(r.perMember.find((m) => m.id === 'BK').referral).toBe(30000)
  })
  it('술만 마신 방문(공주 세션 없음) → 삐끼 미지급', () => {
    const r = settle([
      { type: 'tc', amount: 50000, customer_id: 'C1', customer_referred_by: 'BK', at: t(21) },
    ], w)
    expect(r.perMember.find((m) => m.id === 'BK')).toBeUndefined()
  })
})
