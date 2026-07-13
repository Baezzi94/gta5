import { describe, it, expect } from 'vitest'
import { minClearance, canView, isIntel, isAdmin } from './clearance'

describe('minClearance', () => {
  it('boss/정보부장은 P0까지', () => {
    expect(minClearance('boss')).toBe(0)
    expect(minClearance('intel_chief')).toBe(0)
  })
  it('부대표는 P1까지', () => expect(minClearance('vice')).toBe(1))
  it('지부장/부장/정보부원은 P2까지', () => {
    expect(minClearance('branch_head')).toBe(2)
    expect(minClearance('manager')).toBe(2)
    expect(minClearance('intel_agent')).toBe(2)
  })
  it('팀장/조직원은 P3만', () => {
    expect(minClearance('team_lead')).toBe(3)
    expect(minClearance('member')).toBe(3)
  })
  it('미지정/null은 아무것도 못 봄', () => {
    expect(minClearance(null)).toBe(99)
    expect(minClearance('ghost')).toBe(99)
  })
})

describe('canView', () => {
  it('P2 정보를 부대표는 보고 조직원은 못 봄', () => {
    expect(canView('vice', 2)).toBe(true)
    expect(canView('member', 2)).toBe(false)
  })
  it('P3는 전원, P0는 boss/정보부장만', () => {
    expect(canView('member', 3)).toBe(true)
    expect(canView('intel_agent', 0)).toBe(false)
    expect(canView('boss', 0)).toBe(true)
  })
})

describe('isIntel / isAdmin', () => {
  it('정보부(+boss) 구분', () => {
    expect(isIntel('intel_agent')).toBe(true)
    expect(isIntel('boss')).toBe(true)
    expect(isIntel('vice')).toBe(false)
  })
  it('관리자는 정보부장+boss만', () => {
    expect(isAdmin('intel_chief')).toBe(true)
    expect(isAdmin('intel_agent')).toBe(false)
  })
})
