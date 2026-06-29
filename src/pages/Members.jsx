import { useEffect, useState } from 'react'
import { listMembers, createMember, deleteMember } from '../lib/members'

const TYPES = [
  ['princess', '공주님'],
  ['staff', '운영스탭'],
  ['promoter', '삐끼'],
  ['owner', '사장'],
]
const TYPE_LABEL = Object.fromEntries(TYPES)

export default function Members() {
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', type: 'princess', memo: '', referred_by: '' })
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

  async function onDelete(id, name) {
    if (!window.confirm(`'${name}' 멤버를 삭제할까요? (되돌릴 수 없음)`)) return
    setError('')
    try {
      await deleteMember(id)
      load()
    } catch (e) {
      setError(e.message + ' (예약·추천 등 연결된 기록이 있으면 삭제 대신 비활성화하세요)')
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createMember({
        name: form.name,
        phone: form.phone,
        type: form.type,
        memo: form.memo || null,
        referred_by: form.type === 'princess' && form.referred_by ? form.referred_by : null,
      })
      setForm({ name: '', phone: '', type: 'princess', memo: '', referred_by: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>멤버 관리</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 24 }}>
        <input placeholder="이름(닉)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="전화번호 (필수)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {form.type === 'princess' && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ color: '#9a93b8', fontSize: 13 }}>추천인 (이 공주님을 데려온 멤버)</span>
            <select value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })}>
              <option value="">없음</option>
              {members
                .filter((m) => m.active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} / {m.phone ?? '-'} ({TYPE_LABEL[m.type]})
                  </option>
                ))}
            </select>
          </label>
        )}

        <input placeholder="메모(선택)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        <button type="submit">멤버 추가</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>이름</th><th>유형</th><th>전화</th><th>추천인</th><th>활성</th><th>삭제</th>
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
              <td><button onClick={() => onDelete(m.id, m.name)}>삭제</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
