import { useEffect, useState } from 'react'
import { getOpenSession } from '../lib/sessions'
import { listBySession as listAttendance } from '../lib/attendance'
import { listBySession as listReservations, createReservation, setStatus } from '../lib/reservations'
import { searchCustomers } from '../lib/customers'

const STATUS = [
  ['in_progress', '진행'],
  ['done', '완료'],
  ['no_show', '노쇼'],
  ['cancelled', '취소'],
]
const STATUS_LABEL = { booked: '예약', in_progress: '진행', done: '완료', no_show: '노쇼', cancelled: '취소' }

function fmt(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0')
  const m = String(min % 60).padStart(2, '0')
  return `+${h}:${m}`
}

export default function Reservations() {
  const [session, setSession] = useState(null)
  const [princesses, setPrincesses] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ princess_id: '', customer_id: null, start_min: 0, duration: 20 })
  const [custQuery, setCustQuery] = useState('')
  const [custResults, setCustResults] = useState([])
  const [custName, setCustName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const s = await getOpenSession()
      setSession(s)
      if (s) {
        const att = await listAttendance(s.id)
        setPrincesses(att.filter((a) => a.checked_in_at && !a.checked_out_at))
        setRows(await listReservations(s.id))
      }
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function onSearchCust() {
    try {
      setCustResults(await searchCustomers(custQuery))
    } catch (e) {
      setError(e.message)
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    if (!form.princess_id || !form.customer_id) {
      setError('공주님과 손님을 선택하세요.')
      return
    }
    try {
      await createReservation({
        session_id: session.id,
        customer_id: form.customer_id,
        princess_id: form.princess_id,
        start_min: Number(form.start_min),
        end_min: Number(form.start_min) + Number(form.duration),
      })
      setForm({ princess_id: '', customer_id: null, start_min: 0, duration: 20 })
      setCustName('')
      setCustQuery('')
      setCustResults([])
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onStatus(id, status) {
    setError('')
    try {
      await setStatus(id, status)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!session) {
    return (
      <div>
        <h1>예약판</h1>
        <p style={{ color: '#9a93b8' }}>열린 영업 세션이 없습니다.</p>
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <h1>예약판 <span style={{ color: '#9a93b8', fontSize: 14 }}>({session.date})</span></h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 460, marginBottom: 24, padding: 12, background: '#16131f', borderRadius: 10 }}>
        <strong>새 예약</strong>
        <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })}>
          <option value="">공주님 선택 (출근중)</option>
          {princesses.map((a) => (
            <option key={a.member_id} value={a.member_id}>{a.member?.name} (슬롯 {a.available_slots})</option>
          ))}
        </select>

        <div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="손님 전화/닉 검색" value={custName || custQuery} onChange={(e) => { setCustQuery(e.target.value); setForm({ ...form, customer_id: null }); setCustName('') }} />
            <button type="button" onClick={onSearchCust}>검색</button>
          </div>
          {custResults.length > 0 && !custName && (
            <div style={{ background: '#1d1930', borderRadius: 8, marginTop: 2 }}>
              {custResults.map((c) => (
                <div key={c.id} onClick={() => { setForm({ ...form, customer_id: c.id }); setCustName(`${c.nickname} (${c.phone})`); setCustResults([]) }} style={{ padding: '6px 10px', cursor: 'pointer' }}>
                  {c.nickname} <span style={{ color: '#9a93b8' }}>{c.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label>시작(분):</label>
          <input type="number" min="0" step="20" value={form.start_min} onChange={(e) => setForm({ ...form, start_min: e.target.value })} style={{ width: 80 }} />
          <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
            <option value={20}>20분</option>
            <option value={40}>40분(연장)</option>
            <option value={60}>60분</option>
          </select>
        </div>
        <button type="submit">예약 추가</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>공주님</th><th>손님</th><th>시간</th><th>상태</th><th>변경</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #2c2742' }}>
              <td>{r.princess?.name}</td>
              <td>{r.customer?.nickname}</td>
              <td>{fmt(r.start_min)} ~ {fmt(r.end_min)}</td>
              <td>{STATUS_LABEL[r.status]}</td>
              <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {STATUS.map(([v, l]) => (
                  <button key={v} onClick={() => onStatus(r.id, v)}>{l}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
