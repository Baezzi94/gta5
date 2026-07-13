import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { isIntel, isAdmin } from '../lib/clearance'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const tab = { padding: '10px 12px', textDecoration: 'none', fontSize: 13, color: '#aaa' }
  const active = { color: '#e8c15a' }
  return (
    <div style={{ paddingBottom: 60 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #232329' }}>
        <strong style={{ letterSpacing: 4 }}>BLACK OUT</strong>
        <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={signOut}>로그아웃</button>
      </header>
      <Outlet />
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', background: '#0e0e11', borderTop: '1px solid #232329' }}>
        <NavLink to="/" end style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 제공</NavLink>
        <NavLink to="/browse" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 열람</NavLink>
        {isIntel(profile?.role) && <NavLink to="/inbox" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>접수함</NavLink>}
        {isIntel(profile?.role) && <NavLink to="/persons" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>인물</NavLink>}
        {isAdmin(profile?.role) && <NavLink to="/admin" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>관리</NavLink>}
      </nav>
    </div>
  )
}
