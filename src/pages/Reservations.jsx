import { useEffect, useState } from 'react'
import { listByDate as listAvail } from '../lib/schedule'
import { listByDate as listReservations, createReservation, setStatus } from '../lib/reservations'
import { findOrCreateByPhone } from '../lib/customers'
import { createTalkFromReservation } from '../lib/charges'
import { listMembers } from '../lib/members'
import { isBanned } from '../lib/bans'
import { hmToMin, minToHm } from '../lib/time'
import { ymd } from '../lib/week'
import DayTimetable from '../components/DayTimetable'

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
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ princess_id: '', phone: '', nickname: '', referred_by: '', start: '', end: '' })
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

  useEffect(() => {
    listMembers().then(setMembers).catch((e) => setError(e.message))
  }, [])

  // 그 날짜 가용 공주님별 (윈도우 + 예약) 묶기 → 타임테이블/드롭다운
  const byPrincess = {}
  for (const a of avail) {
    const id = a.member_id
    if (!byPrincess[id]) byPrincess[id] = { id, name: a.member?.name, windows: [], reservations: [] }
    byPrincess[id].windows.push({ start: a.start_min, end: a.end_min })
  }
  for (const r of rows) {
    if (r.status === 'cancelled') continue
    const id = r.princess_id
    if (!byPrincess[id]) continue
    byPrincess[id].reservations.push({ start: r.start_min, end: r.end_min, status: r.status, label: r.customer?.nickname })
  }
  const timetableRows = Object.values(byPrincess)

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
      const customer = await findOrCreateByPhone({ phone: form.phone, nickname: form.nickname, referred_by: form.referred_by || null })
      await createReservation({ date, customer_id: customer.id, princess_id: form.princess_id, start_min, end_min })
      setForm({ princess_id: '', phone: '', nickname: '', referred_by: '', start: '', end: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onStatus(r, status) {
    setError('')
    try {
      await setStatus(r.id, status)
      // 완료 처리 시 대화료 거래(수금 대상) 자동 생성
      if (status === 'done') await createTalkFromReservation(r)
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
        <span style={{ color: '#9a93b8' }}>가용 공주님 {timetableRows.length}명</span>
      </div>

      <DayTimetable rows={timetableRows} onPick={(id) => setForm({ ...form, princess_id: id })} />

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 520, marginBottom: 24, padding: 12, background: '#16131f', borderRadius: 10 }}>
        <strong>새 예약 ({date})</strong>
        <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })}>
          <option value="">공주님 선택 (타임테이블 클릭으로도 선택 가능)</option>
          {timetableRows.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (가능 {p.windows.map((w) => `${minToHm(w.start)}~${minToHm(w.end)}`).join(', ')})</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <input placeholder="손님 전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required style={{ flex: 1 }} />
          <input placeholder="닉네임" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} style={{ flex: 1 }} />
        </div>
        <select value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })}>
          <option value="">추천인(삐끼) 없음</option>
          {members.filter((m) => m.active).map((m) => (
            <option key={m.id} value={m.id}>{m.name} / {m.phone ?? '-'}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label>시간:</label>
          <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          ~
          <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </div>
        <button type="submit">예약 추가</button>
        <span style={{ color: '#9a93b8', fontSize: 12 }}>전화번호로 손님 자동 등록/조회. 추천인 지정 시 손님추천(3만) 근거로 기록. 가용시간 밖/중복이면 거부.</span>
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
                  <button key={v} onClick={() => onStatus(r, v)}>{l}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
