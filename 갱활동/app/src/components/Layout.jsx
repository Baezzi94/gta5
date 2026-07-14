import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { isIntel, isAdmin } from '../lib/clearance'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const tab = { padding: '10px 12px', textDecoration: 'none', fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }
  const active = { color: '#e8c15a', borderBottom: '2px solid #e8c15a' }
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #232329' }}>
        <strong style={{ letterSpacing: 4 }}>BLACK OUT</strong>
        <button className="btn" style={{ padding: '4px 10px', fontSize: 12, width: 'auto' }} onClick={signOut}>로그아웃</button>
      </header>
      <nav style={{ display: 'flex', overflowX: 'auto', background: '#0e0e11', borderBottom: '1px solid #232329', position: 'sticky', top: 0, zIndex: 10 }}>
        <NavLink to="/" end style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 제공</NavLink>
        <NavLink to="/browse" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보 열람</NavLink>
        <NavLink to="/rp" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>정보부 RP</NavLink>
        {isIntel(profile?.role) && <NavLink to="/inbox" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>접수함</NavLink>}
        {isIntel(profile?.role) && <NavLink to="/persons" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>인물</NavLink>}
        {isAdmin(profile?.role) && <NavLink to="/admin" style={({ isActive }) => ({ ...tab, ...(isActive ? active : {}) })}>관리</NavLink>}
      </nav>
      <Outlet />
    </div>
  )
}
