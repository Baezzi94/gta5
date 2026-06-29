import { useEffect, useState } from 'react'
import { listByDate as listAvail } from '../lib/schedule'
import { listByDate as listReservations, createReservation, setStatus } from '../lib/reservations'
import { findOrCreateByPhone } from '../lib/customers'
import { isBanned } from '../lib/bans'
import { hmToMin, minToHm } from '../lib/time'
import { ymd } from '../lib/week'

const STATUS = [
  ['in_progress', '진행'],
  ['done', '완료'],
  ['no_show', '노쇼'],
  ['cancelled', '취소'],
]
const STATUS_LABEL = { booked: '예약', in_progress: '진행', done: '완료', no_show: '노쇼', cancelled: '취소' }

export default function Reservations() {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [avail, setAvail] = useState([])
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ princess_id: '', phone: '', nickname: '', start: '', end: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setAvail(await listAvail(date))
      setRows(await listReservations(date))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // 그 날짜 가용 공주님별 윈도우 묶기
  const byPrincess = {}
  for (const a of avail) {
    const id = a.member_id
    if (!byPrincess[id]) byPrincess[id] = { id, name: a.member?.name, windows: [] }
    byPrincess[id].windows.push(`${minToHm(a.start_min)}~${minToHm(a.end_min)}`)
  }
  const princessOptions = Object.values(byPrincess)

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    const start_min = hmToMin(form.start)
    const end_min = hmToMin(form.end)
    if (!form.princess_id) return setError('공주님을 선택하세요.')
    if (!form.phone) return setError('손님 전화번호를 입력하세요.')
    if (Number.isNaN(start_min) || Number.isNaN(end_min) || start_min >= end_min) return setError('시간을 올바르게 입력하세요 (시작 < 종료).')
    try {
      if (await isBanned(form.phone)) setNotice('⚠️ 밴된 번호입니다. 그래도 예약은 진행됩니다.')
      const customer = await findOrCreateByPhone({ phone: form.phone, nickname: form.nickname })
      await createReservation({ date, customer_id: customer.id, princess_id: form.princess_id, start_min, end_min })
      setForm({ princess_id: '', phone: '', nickname: '', start: '', end: '' })
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

  return (
    <div>
      <h1>예약판</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}
      {notice && <p style={{ color: '#ffb35e' }}>{notice}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={() => setDate(ymd(new Date()))}>오늘</button>
        <span style={{ color: '#9a93b8' }}>가용 공주님 {princessOptions.length}명</span>
      </div>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 480, marginBottom: 24, padding: 12, background: '#16131f', borderRadius: 10 }}>
        <strong>새 예약 ({date})</strong>
        <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })}>
          <option value="">공주님 선택 (가용시간 등록된 사람만)</option>
          {princessOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (가능 {p.windows.join(', ')})</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input placeholder="손님 전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required style={{ flex: 1 }} />
          <input placeholder="닉네임" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label>시간:</label>
          <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          ~
          <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </div>
        <button type="submit">예약 추가</button>
        <span style={{ color: '#9a93b8', fontSize: 12 }}>전화번호로 손님 자동 등록/조회. 가용시간 밖/중복이면 거부됩니다.</span>
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
              <td>{r.customer?.nickname} <span style={{ color: '#9a93b8' }}>{r.customer?.phone}</span></td>
              <td>{minToHm(r.start_min)} ~ {minToHm(r.end_min)}</td>
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
