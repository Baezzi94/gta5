import { useEffect, useState } from 'react'
import { listByDate, createCharge, setCollected, deleteCharge, CHARGE_AMOUNT, CHARGE_LABEL } from '../lib/charges'
import { findOrCreateByPhone } from '../lib/customers'
import { listMembers } from '../lib/members'
import { ymd } from '../lib/week'
import { useAuth } from '../app/AuthContext'

const man = (won) => `${Math.round(won / 10000)}만`

export default function Collections() {
  const { role } = useAuth()
  const isOwner = role === 'owner'
  const canAdd = role === 'owner' || role === 'staff'
  const [date, setDate] = useState(() => ymd(new Date()))
  const [rows, setRows] = useState([])
  const [princesses, setPrincesses] = useState([])
  const [form, setForm] = useState({ type: 'tc', phone: '', nickname: '', princess_id: '' })
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(await listByDate(date))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])
  useEffect(() => {
    listMembers().then((m) => setPrincesses(m.filter((x) => x.type === 'princess'))).catch(() => {})
  }, [])

  async function onAdd(e) {
    e.preventDefault()
    setError('')
    try {
      let customer_id = null
      if (form.phone) {
        const c = await findOrCreateByPhone({ phone: form.phone, nickname: form.nickname })
        customer_id = c.id
      }
      await createCharge({
        date,
        type: form.type,
        amount: CHARGE_AMOUNT[form.type],
        customer_id,
        princess_id: form.type === 'tc' ? null : form.princess_id || null,
      })
      setForm({ type: 'tc', phone: '', nickname: '', princess_id: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function act(fn, ...args) {
    setError('')
    try {
      await fn(...args)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)
  const collected = rows.filter((r) => r.collected).reduce((s, r) => s + r.amount, 0)
  const outstanding = total - collected
  const uncollectedCount = rows.filter((r) => !r.collected).length

  return (
    <div>
      <h1>수금 / 정산</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={() => setDate(ymd(new Date()))}>오늘</button>
      </div>

      {/* 요약 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>총 청구</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{man(total)}</div>
        </div>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>수금 완료</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5ee0a0' }}>{man(collected)}</div>
        </div>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>미수금 ({uncollectedCount}건)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: outstanding > 0 ? '#ff5e5e' : '#9a93b8' }}>{man(outstanding)}</div>
        </div>
      </div>

      {/* 거래 추가 */}
      {canAdd && (
        <form onSubmit={onAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 10, background: '#16131f', borderRadius: 10 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="tc">TC(입장료) 5만</option>
            <option value="talk">대화료 25만</option>
            <option value="date2">2차 100만</option>
          </select>
          <input placeholder="손님 전화" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="닉" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          {form.type !== 'tc' && (
            <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })}>
              <option value="">공주님</option>
              {princesses.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button type="submit">거래 추가</button>
        </form>
      )}

      {/* 수금현황 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>유형</th><th>손님</th><th>공주님</th><th>금액</th><th>수금</th>{isOwner && <th>처리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #2c2742', background: r.collected ? 'transparent' : 'rgba(255,94,94,.07)' }}>
              <td>{CHARGE_LABEL[r.type]}</td>
              <td>{r.customer?.nickname ?? '-'}</td>
              <td>{r.princess?.name ?? '-'}</td>
              <td>{man(r.amount)}</td>
              <td style={{ color: r.collected ? '#5ee0a0' : '#ff5e5e', fontWeight: 700 }}>{r.collected ? '수금완료' : '미수금'}</td>
              {isOwner && (
                <td style={{ display: 'flex', gap: 4 }}>
                  {r.collected
                    ? <button onClick={() => act(setCollected, r.id, false)}>수금취소</button>
                    : <button onClick={() => act(setCollected, r.id, true)}>수금</button>}
                  <button onClick={() => act(deleteCharge, r.id)}>삭제</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
