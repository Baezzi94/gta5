import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPerson, updatePerson } from '../lib/persons'
import { supabase } from '../lib/supabase'
import { CLEARANCE_LABELS } from '../lib/clearance'
import { STATUS_LABELS } from '../lib/tips'

export default function PersonDetail() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [newName, setNewName] = useState('')

  async function refresh() { setP(await getPerson(id)) }
  useEffect(() => { refresh() }, [id])
  if (!p) return <div className="container">로딩...</div>

  async function addName(e) {
    e.preventDefault()
    if (!newName.trim()) return
    await supabase.from('person_names').upsert(
      { person_id: p.id, name: newName.trim() },
      { onConflict: 'person_id,name', ignoreDuplicates: true })
    setNewName(''); refresh()
  }

  return (
    <div className="container">
      <h2>{p.person_names[0]?.name ?? '(이름 미상)'}</h2>
      <div className="card">
        <p>전화번호: {p.phone ?? '미상'}</p>
        <label style={{ display: 'block', marginTop: 8 }}>소속
          <input defaultValue={p.affiliation ?? ''} onBlur={e => updatePerson(p.id, { affiliation: e.target.value || null })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>특이사항
          <textarea rows={3} defaultValue={p.notes ?? ''} onBlur={e => updatePerson(p.id, { notes: e.target.value || null })} /></label>
        <label style={{ display: 'block', marginTop: 8 }}>인물 보안등급
          <select defaultValue={p.clearance} onChange={e => updatePerson(p.id, { clearance: Number(e.target.value) })}>
            {[0, 1, 2, 3].map(l => <option key={l} value={l}>{CLEARANCE_LABELS[l]}</option>)}
          </select></label>
      </div>

      <h3>이름 이력 (개명 추적)</h3>
      <div className="card">
        {p.person_names.map(n => <div key={n.id}>{n.name} <span style={{ color: '#666', fontSize: 12 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span></div>)}
        <form onSubmit={addName} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="새 이름(별명) 추가" value={newName} onChange={e => setNewName(e.target.value)} />
          <button className="btn" type="submit">추가</button>
        </form>
      </div>

      <h3>연결된 제보</h3>
      {p.tip_persons.map(({ tips: t }) => (
        <div className="card" key={t.id}>{t.title} <span className="tag">{STATUS_LABELS[t.status]}</span></div>
      ))}
      {p.tip_persons.length === 0 && <p style={{ color: '#666' }}>연결된 제보가 없습니다.</p>}
    </div>
  )
}
