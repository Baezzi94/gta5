import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'

const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

const MENU = [
  { to: '/dashboard', label: '대시보드', icon: '📊', roles: ['owner', 'staff', 'promoter', 'princess'] },
  { to: '/reservations', label: '예약판', icon: '📅', roles: ['owner', 'staff'] },
  { to: '/collections', label: '수금 · 정산', icon: '💰', roles: ['owner', 'staff', 'promoter', 'princess'] },
  { to: '/attendance', label: '출근부', icon: '🗓️', roles: ['owner', 'staff', 'princess'] },
  { to: '/customers', label: '손님', icon: '🙋', roles: ['owner', 'staff'] },
  { to: '/bans', label: '밴', icon: '⛔', roles: ['owner', 'staff'] },
  { to: '/flyer', label: '찌라시', icon: '📢', roles: ['owner', 'staff', 'promoter'] },
  { to: '/members', label: '멤버', icon: '👥', roles: ['owner'] },
  { to: '/sessions', label: '세션', icon: '🗂️', roles: ['owner'] },
  { to: '/profile', label: '내 프로필', icon: '🙍', roles: ['owner', 'staff', 'promoter', 'princess'] },
]

export default function Layout() {
  const { role, signOut } = useAuth()
  const items = MENU.filter((m) => m.roles.includes(role))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 180, flex: 'none', background: '#16131f', color: '#ece9f5', padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 4, color: '#ff5ea0' }}>공주님 클럽</div>
        <div style={{ fontSize: 12, color: '#9a93b8', marginBottom: 16 }}>{ROLE_LABEL[role] ?? '미지정'}</div>
        <nav style={{ display: 'grid', gap: 4 }}>
          {items.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              style={({ isActive }) => ({
                color: isActive ? '#ff5ea0' : '#cfc9e6',
                textDecoration: 'none',
                padding: '8px 10px',
                borderRadius: 8,
                background: isActive ? '#1d1930' : 'transparent',
              })}
            >
              <span style={{ marginRight: 8 }}>{m.icon}</span>{m.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} style={{ marginTop: 24, width: '100%' }}>로그아웃</button>
      </aside>
      <main style={{ flex: 1, padding: 24, background: '#0e0c16', color: '#ece9f5' }}>
        <Outlet />
      </main>
    </div>
  )
}
