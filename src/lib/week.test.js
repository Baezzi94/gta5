import { describe, it, expect } from 'vitest'
import { ymd, addDays, startOfWeek, weekDates } from './week'

describe('ymd()', () => {
  it('YYYY-MM-DD 포맷', () => {
    expect(ymd(new Date(2026, 5, 29))).toBe('2026-06-29')
    expect(ymd(new Date(2026, 0, 3))).toBe('2026-01-03')
  })
})

describe('addDays()', () => {
  it('일수 더하기', () => {
    expect(ymd(addDays(new Date(2026, 5, 29), 3))).toBe('2026-07-02')
  })
})

describe('startOfWeek()', () => {
  it('항상 월요일 반환', () => {
    for (let i = 0; i < 7; i++) {
      const d = startOfWeek(new Date(2026, 5, 22 + i))
      expect(d.getDay()).toBe(1) // 월요일
    }
  })
})

describe('weekDates()', () => {
  it('7일치 연속 날짜', () => {
    const w = weekDates(new Date(2026, 5, 29))
    expect(w).toHaveLength(7)
    expect(w[0]).toBe('2026-06-29')
    expect(w[6]).toBe('2026-07-05')
  })
})
