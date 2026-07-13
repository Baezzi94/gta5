// 보안등급: P0(가장 기밀)~P3(전체). 숫자 작을수록 기밀.
const MIN = {
  boss: 0, intel_chief: 0,
  vice: 1,
  branch_head: 2, manager: 2, intel_agent: 2,
  team_lead: 3, member: 3,
}

export function minClearance(role) {
  return MIN[role] ?? 99
}

export function canView(role, level) {
  return level >= minClearance(role)
}

export function isIntel(role) {
  return role === 'intel_chief' || role === 'intel_agent' || role === 'boss'
}

export function isAdmin(role) {
  return role === 'intel_chief' || role === 'boss'
}

export const CLEARANCE_LABELS = { 0: 'P0 · 최고기밀', 1: 'P1 · 부대표', 2: 'P2 · 간부', 3: 'P3 · 전체' }

export const ROLE_LABELS = {
  boss: '대표', vice: '부대표', branch_head: '지부장', manager: '부장',
  team_lead: '팀장', member: '조직원', intel_chief: '정보부장', intel_agent: '정보부원',
}
