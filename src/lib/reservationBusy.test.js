import { describe, it, expect } from 'vitest'
import { reservationsToBusy } from './reservationBusy'

describe('reservationsToBusy()', () => {
  it('start/end 구간으로 변환', () => {
    const r = [{ start_min: 0, end_min: 20, status: 'booked' }]
    expect(reservationsToBusy(r)).toEqual([{ start: 0, end: 20 }])
  })
  it('취소·노쇼는 제외', () => {
    const r = [
      { start_min: 0, end_min: 20, status: 'booked' },
      { start_min: 20, end_min: 40, status: 'cancelled' },
      { start_min: 40, end_min: 60, status: 'no_show' },
      { start_min: 60, end_min: 80, status: 'done' },
    ]
    expect(reservationsToBusy(r)).toEqual([
      { start: 0, end: 20 },
      { start: 60, end: 80 },
    ])
  })
  it('빈 입력', () => {
    expect(reservationsToBusy([])).toEqual([])
    expect(reservationsToBusy(undefined)).toEqual([])
  })
})
