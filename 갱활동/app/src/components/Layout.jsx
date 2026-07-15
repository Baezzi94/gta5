import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { isIntel, isAdmin } from '../lib/clearance'
import { countUnreadReports } from '../lib/reports'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const loc = useLocation()
  const [unread, setUnread] = useState(0)
  const boss = profile?.role === 'boss'

  useEffect(() => {
    if (boss) countUnreadReports().then(setUnread)
  }, [boss, loc.pathname])

  const tab = { padding: '10px 12px', textDecoration: 'none', fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }
  const active = { color: '#e8c15a', borderBottom: '2px solid #e8c15a' }
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #232329' }}>
        <strong style={{ letterSpacing: 4 }}>BLACK OUT</strong>
        <button className="btn" style={{ padding: '4px 10px', fontSize: 12, width: 'auto' }} onClick={signOut}>로그아웃</button>
      </header>
      <nav style={{ display: 'flex', overflowX: 'auto', background: '#0e0e11', borderBottom: '1px solid #232329', position: 'sticky', top: 0, zIndex: 10 }}>
        <NavLink to="/" end style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보부 RP</NavLink>
        <NavLink to="/submit" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 제공</NavLink>
        <NavLink to="/browse" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 열람</NavLink>
        {isAdmin(profile?.role) && (
          <NavLink to="/reports" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>
            보고{boss && unread > 0 && <span style={{ background: '#c0392b', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11, marginLeft: 5 }}>{unread}</span>}
          </NavLink>
        )}
        {isIntel(profile?.role) && <NavLink to="/inbox" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>접수함</NavLink>}
        {isIntel(profile?.role) && <NavLink to="/persons" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>인물</NavLink>}
        {isAdmin(profile?.role) && <NavLink to="/admin" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>관리</NavLink>}
      </nav>
      <Outlet />
    </div>
  )
}
