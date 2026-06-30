import { describe, it, expect } from 'vitest'
import { hmToMin, minToHm } from './time'

describe('hmToMin()', () => {
  it('정상 변환', () => {
    expect(hmToMin('00:00')).toBe(0)
    expect(hmToMin('09:30')).toBe(570)
    expect(hmToMin('23:59')).toBe(1439)
  })
  it('심야(24:00~29:59) 허용', () => {
    expect(hmToMin('24:00')).toBe(1440)
    expect(hmToMin('26:30')).toBe(1590)
  })
  it('잘못된 입력은 NaN', () => {
    expect(Number.isNaN(hmToMin('30:00'))).toBe(true)
    expect(Number.isNaN(hmToMin('abc'))).toBe(true)
    expect(Number.isNaN(hmToMin(''))).toBe(true)
  })
})

describe('minToHm()', () => {
  it('정상 변환', () => {
    expect(minToHm(0)).toBe('00:00')
    expect(minToHm(570)).toBe('09:30')
    expect(minToHm(1439)).toBe('23:59')
  })
  it('왕복 변환', () => {
    expect(minToHm(hmToMin('21:05'))).toBe('21:05')
  })
})
