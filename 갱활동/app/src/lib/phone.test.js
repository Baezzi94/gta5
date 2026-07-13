import { describe, it, expect } from 'vitest'
import { normalizePhone, isValidPhone } from './phone'

describe('normalizePhone', () => {
  it('숫자만 남긴다', () => {
    expect(normalizePhone('010-1234-5678')).toBe('01012345678')
    expect(normalizePhone(' 555 0123 ')).toBe('5550123')
  })
  it('null/undefined는 빈 문자열', () => {
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })
})

describe('isValidPhone', () => {
  it('숫자 3~15자리만 유효', () => {
    expect(isValidPhone('555-0123')).toBe(true)
    expect(isValidPhone('12')).toBe(false)
    expect(isValidPhone('abc')).toBe(false)
  })
})
