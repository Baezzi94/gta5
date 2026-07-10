import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Members from '../pages/Members'
import Attendance from '../pages/Attendance'
import StaffAttendance from '../pages/StaffAttendance'
import Customers from '../pages/Customers'
import Bans from '../pages/Bans'
import Reservations from '../pages/Reservations'
import Collections from '../pages/Collections'
import Flyer from '../pages/Flyer'
import Profile from '../pages/Profile'
import Dashboard from '../pages/Dashboard'
import Menu from '../pages/Menu'
import Race from '../pages/Race'
import MobileLayout from '../mobile/MobileLayout'
import MAttendance from '../mobile/MAttendance'
import MSell from '../mobile/MSell'
import MReservations from '../mobile/MReservations'
import MMe from '../mobile/MMe'

function Root() {
  const { session, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>로딩 중…</p>
  return session ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Root />} />
        {/* 공개 페이지: 로그인 없이 접근. 시진핑 로그인 상태면 확정/삭제 버튼이 보인다. */}
        <Route path="/race" element={<Race />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="menu" element={<Menu />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="staff-attendance" element={<StaffAttendance />} />
          <Route path="customers" element={<Customers />} />
          <Route path="bans" element={<Bans />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="collections" element={<Collections />} />
          <Route path="flyer" element={<Flyer />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route
          path="/m"
          element={
            <ProtectedRoute>
              <MobileLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/m/attendance" replace />} />
          <Route path="attendance" element={<MAttendance />} />
          <Route path="sell" element={<MSell />} />
          <Route path="reservations" element={<MReservations />} />
          <Route path="me" element={<MMe />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
