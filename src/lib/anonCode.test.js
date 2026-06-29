import { describe, it, expect } from 'vitest'
import { dailyAnonCode, toDayKey } from './anonCode'

describe('dailyAnonCode()', () => {
  const d1 = new Date('2026-06-29T10:00:00Z')
  const d1b = new Date('2026-06-29T14:00:00Z') // 같은 KST 날짜 (KST 19:00, 23:00)
  const d2 = new Date('2026-06-30T10:00:00Z') // 다음 날 (KST)

  it('항상 6자리 숫자', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).toMatch(/^\d{6}$/)
  })
  it('같은 전화·같은 날이면 동일 코드', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).toBe(dailyAnonCode('010-1234-5678', d1b))
  })
  it('날이 바뀌면 코드가 바뀐다', () => {
    expect(dailyAnonCode('010-1234-5678', d1)).not.toBe(dailyAnonCode('010-1234-5678', d2))
  })
  it('다른 전화면 (같은 날) 보통 다른 코드', () => {
    expect(dailyAnonCode('010-1111-1111', d1)).not.toBe(dailyAnonCode('010-2222-2222', d1))
  })
})

describe('toDayKey()', () => {
  it('KST 기준 날짜로 환산 (UTC 16:00 = KST 익일 01:00)', () => {
    expect(toDayKey(new Date('2026-06-29T16:00:00Z'))).toBe('2026-06-30')
  })
})
