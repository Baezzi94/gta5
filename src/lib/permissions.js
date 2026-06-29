// 역할별 권한 맵. owner는 '*' = 전체 허용.
export const PERMISSIONS = {
  owner: '*',
  staff: {
    sessions: ['read'],
    attendance: ['create', 'update', 'assign'],
    customers: ['create', 'read', 'update'],
    bans: ['create', 'read'],
    reservations: ['create', 'update', 'read'],
    transactions: ['create', 'read'],
    referrals: ['create'],
    settlements: ['read'],
    flyer: ['create'],
    notes: ['create'],
  },
  promoter: {
    referrals: ['create', 'read_own'],
    settlements: ['read_own'],
    flyer: ['create'],
  },
  princess: {
    sessions: ['read'],
    attendance: ['checkin_self'],
    reservations: ['read_own'],
    settlements: ['read_own'],
  },
}

export function can(role, module, action) {
  const perms = PERMISSIONS[role]
  if (!perms) return false
  if (perms === '*') return true
  const allowed = perms[module]
  return Array.isArray(allowed) && allowed.includes(action)
}
