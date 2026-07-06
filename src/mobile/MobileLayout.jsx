import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'

const TABS = [
  { to: '/m/attendance', label: '출근', icon: '🕐', roles: ['owner', 'staff', 'promoter', 'princess'] },
  { to: '/m/sell', label: '판매', icon: '💵', roles: ['owner', 'staff'] },
  { to: '/m/reservations', label: '예약', icon: '📅', roles: ['owner', 'staff'] },
  { to: '/m/me', label: '내정산', icon: '📊', roles: ['owner', 'staff', 'promoter', 'princess'] },
]
const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function MobileLayout() {
  const { role, signOut } = useAuth()
  const tabs = TABS.filter((t) => t.roles.includes(role))
  return (
    <div style={{ minHeight: '100vh', background: '#0e0c16', color: '#ece9f5', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241a3d', position: 'sticky', top: 0, background: '#0e0c16', zIndex: 5 }}>
        <div style={{ fontWeight: 800, color: '#ff5ea0' }}>공주님 클럽 <span style={{ color: '#9a93b8', fontSize: 12, fontWeight: 400 }}>{ROLE_LABEL[role] ?? ''}</span></div>
        <a href="/" style={{ fontSize: 12, color: '#9a93b8', textDecoration: 'none', marginRight: 10 }}>PC버전 ↗</a>
        <button onClick={signOut} style={{ fontSize: 12, background: 'transparent', color: '#9a93b8', border: '1px solid #3a2440', borderRadius: 8, padding: '6px 10px' }}>로그아웃</button>
      </header>
      <main style={{ flex: 1, padding: '14px 14px 86px', overflowY: 'auto' }}><Outlet /></main>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: '#16131f', borderTop: '1px solid #241a3d' }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} style={({ isActive }) => ({ flex: 1, textAlign: 'center', padding: '9px 0', textDecoration: 'none', color: isActive ? '#ff5ea0' : '#9a93b8', fontSize: 11, fontWeight: 700 })}>
            <div style={{ fontSize: 21 }}>{t.icon}</div>{t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
