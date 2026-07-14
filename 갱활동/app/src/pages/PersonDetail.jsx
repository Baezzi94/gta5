import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerson, updatePerson, setPersonPhone, mergePersons } from '../lib/persons'
import { supabase } from '../lib/supabase'
import { CLEARANCE_LABELS } from '../lib/clearance'
import { STATUS_LABELS } from '../lib/tips'

export default function PersonDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [newName, setNewName] = useState('')
  const [phoneEdit, setPhoneEdit] = useState('')
  const [msg, setMsg] = useState('')

  async function refresh() {
    const data = await getPerson(id)
    setP(data)
    setPhoneEdit(data.phone ?? '')
  }
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

  async function savePhone() {
    setMsg('')
    const res = await setPersonPhone(p.id, phoneEdit)
    if (res.conflict) {
      const ok = window.confirm('이미 이 번호로 등록된 인물이 있습니다.\n그 인물로 병합할까요? (이름 이력·제보 연결이 이관되고, 이 카드는 삭제됩니다)')
      if (ok) {
        await mergePersons(p.id, res.conflict)
        nav(`/persons/${res.conflict}`, { replace: true })
      }
      return
    }
    setMsg('전화번호 저장됨')
    refresh()
  }

  return (
    <div className="container">
      <h2>{p.person_names[0]?.name ?? '(이름 미상)'}</h2>
      <div className="card">
        <label>전화번호 {p.phone ? '' : <span style={{ color: '#d9a13d' }}>(미상 — 확보 시 기록)</span>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input value={phoneEdit} onChange={e => setPhoneEdit(e.target.value)} placeholder="번호 입력" />
            <button className="btn" type="button" onClick={savePhone}>저장</button>
          </div>
        </label>
        {msg && <p style={{ color: '#e8c15a', fontSize: 13, marginTop: 4 }}>{msg}</p>}
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
