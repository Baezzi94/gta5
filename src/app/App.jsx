import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import Home from '../pages/Home'

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
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
