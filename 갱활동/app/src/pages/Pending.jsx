import { Navigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'

export default function Pending() {
  const { profile, signOut } = useAuth()
  if (profile?.status === 'active') return <Navigate to="/" replace />
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '30vh' }}>
      <h2>승인 대기 중</h2>
      <p style={{ color: '#888', margin: 16 }}>윗선의 승인이 있을 때까지 대기하십시오.</p>
      <button className="btn" onClick={signOut}>나가기</button>
    </div>
  )
}
