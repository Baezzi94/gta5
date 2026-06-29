import { useEffect, useState } from 'react'
import { listMembers, createMember } from '../lib/members'
import { searchMembers } from '../lib/memberSearch'

const TYPES = [
  ['princess', '공주님'],
  ['staff', '운영스탭'],
  ['promoter', '삐끼'],
  ['owner', '사장'],
]
const TYPE_LABEL = Object.fromEntries(TYPES)

export default function Members() {
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', type: 'princess', memo: '', referred_by: null })
  const [refQuery, setRefQuery] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      setMembers(await listMembers())
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
      await createMember({
        name: form.name,
        phone: form.phone || null,
        type: form.type,
        memo: form.memo || null,
        referred_by: form.referred_by,
      })
      setForm({ name: '', phone: '', type: 'princess', memo: '', referred_by: null })
      setRefQuery('')
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const refCandidates = refQuery ? searchMembers(members, refQuery).slice(0, 5) : []
  const refName = form.referred_by ? members.find((m) => m.id === form.referred_by)?.name : null

  return (
    <div>
      <h1>멤버 관리</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 24 }}>
        <input placeholder="이름(닉)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="전화번호(선택)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div>
          <input
            placeholder="추천인 검색(전화/닉)"
            value={refName ?? refQuery}
            onChange={(e) => {
              setRefQuery(e.target.value)
              setForm({ ...form, referred_by: null })
            }}
          />
          {refCandidates.length > 0 && (
            <div style={{ background: '#1d1930', borderRadius: 8, marginTop: 2 }}>
              {refCandidates.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setForm({ ...form, referred_by: m.id })
                    setRefQuery('')
                  }}
                  style={{ padding: '6px 10px', cursor: 'pointer' }}
                >
                  {m.name} <span style={{ color: '#9a93b8' }}>{m.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <input placeholder="메모(선택)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        <button type="submit">멤버 추가</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>이름</th><th>유형</th><th>전화</th><th>추천인</th><th>활성</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderTop: '1px solid #2c2742' }}>
              <td>{m.name}</td>
              <td>{TYPE_LABEL[m.type] ?? m.type}</td>
              <td>{m.phone ?? '-'}</td>
              <td>{members.find((x) => x.id === m.referred_by)?.name ?? '-'}</td>
              <td>{m.active ? 'O' : 'X'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
