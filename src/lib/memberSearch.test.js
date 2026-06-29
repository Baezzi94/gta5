import { describe, it, expect } from 'vitest'
import { normalizePhone, searchMembers } from './memberSearch'

const members = [
  { id: '1', name: '미나', phone: '010-1234-5678', type: 'princess' },
  { id: '2', name: '수지', phone: '010-9999-0000', type: 'princess' },
  { id: '3', name: '철가드', phone: '010-1234-1111', type: 'staff' },
]

describe('normalizePhone()', () => {
  it('숫자만 남긴다', () => {
    expect(normalizePhone('010-1234-5678')).toBe('01012345678')
    expect(normalizePhone('010 9999 0000')).toBe('01099990000')
  })
})

describe('searchMembers()', () => {
  it('빈 query면 전체', () => {
    expect(searchMembers(members, '')).toHaveLength(3)
  })
  it('닉 부분일치', () => {
    expect(searchMembers(members, '미나').map((m) => m.id)).toEqual(['1'])
  })
  it('전화 부분일치(대시 무시)', () => {
    expect(searchMembers(members, '1234').map((m) => m.id)).toEqual(['1', '3'])
  })
  it('일치 없음', () => {
    expect(searchMembers(members, '없는닉')).toHaveLength(0)
  })
})
