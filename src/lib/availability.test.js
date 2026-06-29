import { describe, it, expect } from 'vitest'
import { overlaps, isAvailable, canExtend, withinWindow } from './availability'

describe('overlaps()', () => {
  it('겹치면 true', () => {
    expect(overlaps({ start: 0, end: 20 }, { start: 10, end: 30 })).toBe(true)
  })
  it('맞닿기만 하면(끝=시작) false', () => {
    expect(overlaps({ start: 0, end: 20 }, { start: 20, end: 40 })).toBe(false)
  })
})

describe('isAvailable()', () => {
  const busy = [{ start: 0, end: 20 }, { start: 40, end: 100 }] // 40~100은 2차 블로킹 등
  it('빈 구간이면 가능', () => {
    expect(isAvailable(busy, { start: 20, end: 40 })).toBe(true)
  })
  it('겹치면 불가', () => {
    expect(isAvailable(busy, { start: 30, end: 50 })).toBe(false)
  })
})

describe('canExtend()', () => {
  it('다음 슬롯 비어있으면 연장 가능', () => {
    const busy = [{ start: 0, end: 20 }]
    expect(canExtend(busy, { start: 0, end: 20 }, 20)).toBe(true)
  })
  it('다음 슬롯에 예약 차 있으면 연장 불가', () => {
    const busy = [{ start: 0, end: 20 }, { start: 20, end: 40 }]
    expect(canExtend(busy, { start: 0, end: 20 }, 20)).toBe(false)
  })
})

describe('withinWindow()', () => {
  const win = { start: 1260, end: 1380 } // 21:00~23:00
  it('윈도우 안이면 true', () => {
    expect(withinWindow(win, { start: 1260, end: 1280 })).toBe(true)
    expect(withinWindow(win, { start: 1360, end: 1380 })).toBe(true)
  })
  it('윈도우 벗어나면 false', () => {
    expect(withinWindow(win, { start: 1240, end: 1280 })).toBe(false)
    expect(withinWindow(win, { start: 1370, end: 1400 })).toBe(false)
  })
  it('윈도우 없으면 false', () => {
    expect(withinWindow(null, { start: 0, end: 20 })).toBe(false)
  })
})
