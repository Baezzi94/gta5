import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { supabase } from '../lib/supabase'
import { normalizePhone, isValidPhone } from '../lib/phone'

export default function Onboarding() {
  const { session, reloadProfile } = useAuth()
  const nav = useNavigate()
  const [charName, setCharName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!charName.trim()) return setErr('캐릭터명을 입력하십시오.')
    if (!isValidPhone(phone)) return setErr('전화번호가 올바르지 않습니다.')
    const { error } = await supabase.from('profiles')
      .update({ char_name: charName.trim(), phone: normalizePhone(phone) })
      .eq('id', session.user.id)
    if (error) return setErr('저장 실패: ' + error.message)
    await reloadProfile()
    nav('/pending', { replace: true })
  }

  return (
    <div className="container">
      <h2>신원 등록</h2>
      <p style={{ color: '#888', margin: '8px 0 16px' }}>캐릭터명과 전화번호는 필수입니다.</p>
      <form onSubmit={submit}>
        <div className="card">
          <label>캐릭터명<input value={charName} onChange={e => setCharName(e.target.value)} /></label>
          <label style={{ display: 'block', marginTop: 10 }}>전화번호
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0123" /></label>
        </div>
        {err && <p style={{ color: '#e66' }}>{err}</p>}
        <button className="btn btn-primary" type="submit">등록</button>
      </form>
    </div>
  )
}
