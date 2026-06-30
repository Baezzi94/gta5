import { useEffect, useState } from 'react'
import { searchCustomers, createCustomer, updateCustomer } from '../lib/customers'
import { isBanned } from '../lib/bans'
import { dailyAnonCode } from '../lib/anonCode'

export default function Customers() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const [anon, setAnon] = useState(false)
  const [form, setForm] = useState({ phone: '', nickname: '', memo: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null) // { id, nickname, memo }

  async function onSaveEdit() {
    setError('')
    try {
      await updateCustomer(editing.id, { nickname: editing.nickname, memo: editing.memo || null })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function load() {
    setError('')
    try {
      setRows(await searchCustomers(query))
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
    setNotice('')
    try {
      if (await isBanned(form.phone)) {
        setNotice('⚠️ 이 전화번호는 현재 밴 상태입니다. 등록은 되지만 주의하세요.')
      }
      await createCustomer({
        phone: form.phone,
        nickname: form.nickname,
        memo: form.memo || null,
      })
      setForm({ phone: '', nickname: '', memo: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const now = new Date()

  return (
    <div>
      <h1>손님 관리</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}
      {notice && <p style={{ color: '#ffb35e' }}>{notice}</p>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 20 }}>
        <input placeholder="전화번호(고정 ID)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input placeholder="닉네임" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required />
        <input placeholder="메모(선호/특이사항)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        <button type="submit">손님 등록</button>
      </form>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="전화/닉 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={load}>검색</button>
        <label style={{ color: '#9a93b8' }}>
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> 익명 표시
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>표시</th><th>전화</th><th>메모</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const ed = editing && editing.id === c.id
            return (
              <tr key={c.id} style={{ borderTop: '1px solid #2c2742' }}>
                <td>{anon ? `익명#${dailyAnonCode(c.phone, now)}` : (ed ? <input value={editing.nickname} onChange={(e) => setEditing({ ...editing, nickname: e.target.value })} style={{ width: 100 }} /> : c.nickname)}</td>
                <td>{anon ? '***' : c.phone}</td>
                <td>{ed ? <input value={editing.memo} onChange={(e) => setEditing({ ...editing, memo: e.target.value })} style={{ width: 160 }} /> : (c.memo ?? '-')}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {ed ? (
                    <>
                      <button onClick={onSaveEdit}>저장</button>
                      <button onClick={() => setEditing(null)}>취소</button>
                    </>
                  ) : (
                    <button onClick={() => setEditing({ id: c.id, nickname: c.nickname, memo: c.memo ?? '' })}>수정</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
