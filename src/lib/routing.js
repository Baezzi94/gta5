export function homePathForRole(role) {
  const map = { owner: '/owner', staff: '/staff', promoter: '/promoter', princess: '/princess' }
  return map[role] ?? '/login'
}
