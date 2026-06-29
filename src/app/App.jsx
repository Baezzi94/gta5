import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Members from '../pages/Members'
import Sessions from '../pages/Sessions'
import Attendance from '../pages/Attendance'
import Customers from '../pages/Customers'
import Bans from '../pages/Bans'
import Reservations from '../pages/Reservations'

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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="members" element={<Members />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="customers" element={<Customers />} />
          <Route path="bans" element={<Bans />} />
          <Route path="reservations" element={<Reservations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
