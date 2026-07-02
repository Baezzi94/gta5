// 백테스트 2R — 예약 스케줄링(충돌·야간시간·연장·자리) 시뮬레이션.
import { describe, it, expect } from 'vitest'
import { overlaps, isAvailable, canExtend, withinWindow, withinAnyWindow } from './availability'
import { reservationsToBusy } from './reservationBusy'
import { hmToMin, minToHm } from './time'

const slot = (a, b) => ({ start: hmToMin(a), end: hmToMin(b) })

describe('시뮬레이션: 예약 충돌 판정', () => {
  it('연속(경계 접촉) 슬롯은 충돌 아님 — 21시 끝, 21시 시작', () => {
    const busy = [slot('20:00', '21:00')]
    expect(isAvailable(busy, slot('21:00', '22:00'))).toBe(true)
  })
  it('부분 겹침은 충돌', () => {
    const busy = [slot('20:00', '21:00')]
    expect(isAvailable(busy, slot('20:30', '21:30'))).toBe(false)
  })
  it('완전 포함(작은 슬롯이 큰 busy 안)도 충돌', () => {
    const busy = [slot('20:00', '23:00')]
    expect(isAvailable(busy, slot('21:00', '22:00'))).toBe(false)
  })
  it('busy를 감싸는 큰 슬롯도 충돌', () => {
    const busy = [slot('21:00', '22:00')]
    expect(isAvailable(busy, slot('20:00', '23:00'))).toBe(false)
  })
})

describe('시뮬레이션: 연장(canExtend)', () => {
  it('바로 뒤에 다른 예약 있으면 연장 불가', () => {
    const busy = [slot('20:00', '21:00'), slot('21:00', '21:40')]
    // 20~21 타임을 20분 연장하려면 21:00~21:20 필요 → 뒤 예약과 겹침
    expect(canExtend(busy, slot('20:00', '21:00'), 20)).toBe(false)
  })
  it('뒤가 비어있으면 연장 가능', () => {
    const busy = [slot('20:00', '21:00')]
    expect(canExtend(busy, slot('20:00', '21:00'), 20)).toBe(true)
  })
})

describe('시뮬레이션: 야간(자정 넘김) 시간 처리', () => {
  it('24:00~29:59 표기 왕복 변환', () => {
    expect(hmToMin('25:00')).toBe(1500)
    expect(minToHm(1500)).toBe('25:00')
    expect(hmToMin('29:59')).toBe(1799)
    expect(hmToMin('30:00')).toBeNaN()
  })
  it('공주 야간 윈도우(22:00~26:00) 안에 24:00~25:00 슬롯 포함', () => {
    const w = slot('22:00', '26:00') // 1320~1560
    expect(withinWindow(w, slot('24:00', '25:00'))).toBe(true) // 1440~1500
  })
  it('윈도우를 벗어나는 새벽 슬롯은 불가', () => {
    const w = slot('22:00', '26:00')
    expect(withinWindow(w, slot('25:30', '26:30'))).toBe(false) // 26:30=1590 > 1560
  })
  it('여러 블록 중 하나라도 포함하면 OK', () => {
    const ws = [slot('20:00', '22:00'), slot('24:00', '27:00')]
    expect(withinAnyWindow(ws, slot('25:00', '26:00'))).toBe(true)
    expect(withinAnyWindow(ws, slot('22:30', '23:30'))).toBe(false) // 블록 사이 갭
  })
})

describe('시뮬레이션: 취소/노쇼는 자리 안 차지', () => {
  it('cancelled·no_show 예약은 busy에서 제외', () => {
    const reservations = [
      { start_min: hmToMin('20:00'), end_min: hmToMin('21:00'), status: 'booked' },
      { start_min: hmToMin('21:00'), end_min: hmToMin('22:00'), status: 'cancelled' },
      { start_min: hmToMin('22:00'), end_min: hmToMin('23:00'), status: 'no_show' },
      { start_min: hmToMin('23:00'), end_min: hmToMin('24:00'), status: 'in_progress' },
    ]
    const busy = reservationsToBusy(reservations)
    expect(busy).toHaveLength(2) // booked + in_progress만
    // 취소된 21~22 자리는 비어 새 예약 가능
    expect(isAvailable(busy, slot('21:00', '22:00'))).toBe(true)
  })
})
