import { describe, it, expect } from 'vitest'
import { overlaps, isAvailable, canExtend } from './availability'

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
