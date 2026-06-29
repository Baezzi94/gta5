import { describe, it, expect } from 'vitest'
import { homePathForRole } from './routing'

describe('homePathForRole()', () => {
  it('역할별 홈 경로', () => {
    expect(homePathForRole('owner')).toBe('/owner')
    expect(homePathForRole('staff')).toBe('/staff')
    expect(homePathForRole('promoter')).toBe('/promoter')
    expect(homePathForRole('princess')).toBe('/princess')
  })
  it('알 수 없는 역할은 /login', () => {
    expect(homePathForRole(null)).toBe('/login')
  })
})
