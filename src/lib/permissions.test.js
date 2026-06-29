import { describe, it, expect } from 'vitest'
import { can } from './permissions'

describe('can()', () => {
  it('owner는 모든 모듈/액션 허용', () => {
    expect(can('owner', 'settlements', 'confirm')).toBe(true)
    expect(can('owner', 'members', 'delete')).toBe(true)
  })
  it('staff는 예약 생성·수정 허용, 정산 확정 불가', () => {
    expect(can('staff', 'reservations', 'create')).toBe(true)
    expect(can('staff', 'reservations', 'update')).toBe(true)
    expect(can('staff', 'settlements', 'confirm')).toBe(false)
  })
  it('promoter는 추천 등록만, 예약 불가', () => {
    expect(can('promoter', 'referrals', 'create')).toBe(true)
    expect(can('promoter', 'reservations', 'create')).toBe(false)
  })
  it('princess는 본인 출근 체크만, 손님 관리 불가', () => {
    expect(can('princess', 'attendance', 'checkin_self')).toBe(true)
    expect(can('princess', 'customers', 'create')).toBe(false)
  })
  it('알 수 없는 역할은 모두 거부', () => {
    expect(can('ghost', 'reservations', 'create')).toBe(false)
  })
})
