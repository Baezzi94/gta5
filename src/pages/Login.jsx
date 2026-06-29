import { useState } from 'react'
import { useAuth } from '../app/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({ code: '', name: '', phone: '', referrer: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function onLogin(e) {
    e.preventDefault()
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
  }

  async function onSignup(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const { data, error } = await signUp(email, password, {
      code: form.code.trim().toUpperCase(),
      name: form.name,
      phone: form.phone,
      referrer: form.referrer,
    })
    if (error) return setError(error.message)
    if (data.session) {
      setInfo('가입 완료! 잠시 후 자동 로그인됩니다.')
    } else {
      setInfo('가입 요청됨. 이메일 인증이 켜져 있으면 메일 확인 후 로그인하세요.')
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '60px auto', display: 'grid', gap: 12, fontFamily: 'system-ui' }}>
      <h1>공주님 클럽 운영앱</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setMode('login'); setError(''); setInfo('') }} disabled={mode === 'login'}>로그인</button>
        <button onClick={() => { setMode('signup'); setError(''); setInfo('') }} disabled={mode === 'signup'}>회원가입</button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={onLogin} style={{ display: 'grid', gap: 10 }}>
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">로그인</button>
        </form>
      ) : (
        <form onSubmit={onSignup} style={{ display: 'grid', gap: 10 }}>
          <input placeholder="가입 코드 (역할별 8자리)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input placeholder="이름(닉)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input placeholder="추천인 전화/닉 (공주님만, 선택)" value={form.referrer} onChange={(e) => setForm({ ...form, referrer: e.target.value })} />
          <button type="submit">가입</button>
          <span style={{ color: '#9a93b8', fontSize: 12 }}>코드에 따라 역할(사장/스탭/삐끼/공주)이 자동 부여됩니다.</span>
        </form>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
    </div>
  )
}
