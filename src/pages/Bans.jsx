import { useEffect, useState } from 'react'
import { listBans, createBan, liftBan } from '../lib/bans'

const REASONS = ['성희롱', '진상/난동', '폭력', '분란 조장', '무전취식', '노쇼', '시간초과 불응', '기타']

export default function Bans() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ phone: '', reason: REASONS[0], detail: '' })
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(await listBans())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    try {
      const reason = form.detail ? `${form.reason} - ${form.detail}` : form.reason
      await createBan({ phone: form.phone, reason })
      setForm({ phone: '', reason: REASONS[0], detail: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onLift(id) {
    setError('')
    try {
      await liftBan(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>밴 관리</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 20 }}>
        <input placeholder="전화번호 (필수)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input placeholder="상세(선택)" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        <button type="submit">밴 등록</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>전화</th><th>사유</th><th>상태</th><th>액션</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} style={{ borderTop: '1px solid #2c2742' }}>
              <td>{b.phone ?? b.customer?.phone ?? '-'}</td>
              <td>{b.reason}</td>
              <td>{b.lifted ? '해제됨' : '밴'}</td>
              <td>{!b.lifted && <button onClick={() => onLift(b.id)}>해제</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
