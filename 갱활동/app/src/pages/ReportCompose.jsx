import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReport } from '../lib/reports'
import { listInbox } from '../lib/tips'
import { CLEARANCE_LABELS } from '../lib/clearance'

export default function ReportCompose() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [clearance, setClearance] = useState(0)
  const [tips, setTips] = useState([])
  const [checked, setChecked] = useState(new Set())
  const [err, setErr] = useState('')

  useEffect(() => {
    // 채택된 정보만 첨부 후보로
    listInbox().then(all => setTips(all.filter(t => t.status === 'adopted')))
  }, [])

  function toggle(id) {
    setChecked(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return setErr('제목과 내용을 입력하십시오.')
    try {
      await createReport({ title: title.trim(), body: body.trim(), clearance: Number(clearance), tipIds: [...checked] })
      nav('/reports')
    } catch (error) { setErr('발신 실패: ' + error.message) }
  }

  return (
    <div className="container">
      <h2>새 보고서</h2>
      <form onSubmit={submit}>
        <div className="card">
          <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea placeholder="보고 내용" rows={8} value={body} onChange={e => setBody(e.target.value)} style={{ marginTop: 8 }} />
          <label style={{ display: 'block', marginTop: 8 }}>보안등급 (누구까지 수신할지)
            <select value={clearance} onChange={e => setClearance(e.target.value)}>
              {[0, 1, 2, 3].map(l => <option key={l} value={l}>{CLEARANCE_LABELS[l]}</option>)}
            </select></label>
        </div>

        <div className="card">
          <strong>관련 정보 첨부</strong> <span style={{ color: '#888', fontSize: 12 }}>(채택된 정보만)</span>
          {tips.map(t => (
            <label key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={checked.has(t.id)} onChange={() => toggle(t.id)} />
              <span style={{ flex: 1 }}>{t.title}</span>
              <span className="tag">{CLEARANCE_LABELS[t.clearance]}</span>
            </label>
          ))}
          {tips.length === 0 && <p style={{ color: '#666', marginTop: 6 }}>채택된 정보가 없습니다.</p>}
        </div>

        {err && <p style={{ color: '#e66' }}>{err}</p>}
        <button className="btn btn-primary" type="submit">발신</button>
      </form>
    </div>
  )
}
