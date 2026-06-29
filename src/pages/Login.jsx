import { useState } from 'react'
import { useAuth } from '../app/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320, margin: '80px auto', display: 'grid', gap: 12 }}>
      <h1>공주님 클럽 운영앱</h1>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">로그인</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  )
}
