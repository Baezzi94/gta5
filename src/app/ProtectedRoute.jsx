import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p style={{ padding: 24 }}>로딩 중…</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}
