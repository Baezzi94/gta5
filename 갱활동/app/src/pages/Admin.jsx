import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS } from '../lib/clearance'

export default function Admin() {
  const [rows, setRows] = useState([])
  async function refresh() {
    const { data } = await supabase.from('profiles')
      .select('id, char_name, phone, role, status, created_at')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => { refresh() }, [])

  async function setMember(id, patch) {
    await supabase.from('profiles').update(patch).eq('id', id)
    refresh()
  }

  const pending = rows.filter(r => r.status === 'pending' && r.char_name)
  const active = rows.filter(r => r.status === 'active')

  function RoleSelect({ value, onChange }) {
    return (
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}>
        <option value="" disabled>계급 선택</option>
        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    )
  }

  return (
    <div className="container">
      <h2>조직 관리</h2>
      <h3>승인 대기 ({pending.length})</h3>
      {pending.map(r => (
        <div className="card" key={r.id}>
          <strong>{r.char_name}</strong> <span style={{ color: '#888' }}>{r.phone}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <RoleSelect value={r.role} onChange={role => setMember(r.id, { role })} />
            <button className="btn btn-primary" disabled={!r.role}
              onClick={() => setMember(r.id, { status: 'active' })}>승인</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p style={{ color: '#666' }}>대기 인원이 없습니다.</p>}
      <h3 style={{ marginTop: 16 }}>조직원 ({active.length})</h3>
      {active.map(r => (
        <div className="card" key={r.id}>
          <strong>{r.char_name}</strong> <span style={{ color: '#888' }}>{r.phone}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <RoleSelect value={r.role} onChange={role => setMember(r.id, { role })} />
            <button className="btn" onClick={() => setMember(r.id, { status: 'expelled' })}>제명</button>
          </div>
        </div>
      ))}
    </div>
  )
}
