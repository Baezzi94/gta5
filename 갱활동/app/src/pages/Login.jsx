import { Navigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'

export default function Login() {
  const { session, signInDiscord, loading } = useAuth()
  if (!loading && session) return <Navigate to="/" replace />
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '30vh' }}>
      <h1 style={{ letterSpacing: 8 }}>BLACK OUT</h1>
      <p style={{ margin: '16px 0', color: '#888' }}>승인된 인원만 입장할 수 있습니다.</p>
      <button className="btn btn-primary" onClick={signInDiscord}>Discord로 입장</button>
    </div>
  )
}
