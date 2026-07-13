import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isIntel, isAdmin } from '../lib/clearance'

// need: 'active'(승인 조직원) | 'intel' | 'admin'
export default function ProtectedRoute({ need = 'active', children }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="container">확인 중...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile?.char_name || !profile?.phone) return <Navigate to="/onboarding" replace />
  if (profile.status !== 'active') return <Navigate to="/pending" replace />
  if (need === 'intel' && !isIntel(profile.role)) return <Navigate to="/" replace />
  if (need === 'admin' && !isAdmin(profile.role)) return <Navigate to="/" replace />
  return children
}
