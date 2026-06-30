import { useEffect, useState } from 'react'
import { listMembers } from '../lib/members'
import { listRange, addAvailability, checkIn, checkOut, reCheckIn, removeAvailability } from '../lib/schedule'
import { hmToMin, minToHm } from '../lib/time'
import { startOfWeek, weekDates, addDays, ymd } from '../lib/week'
import { useAuth } from '../app/AuthContext'
import TimeField from '../components/TimeField'

const DOW = ['월', '화', '수', '목', '금', '토', '일']

export default function StaffAttendance() {
  const { role, memberId } = useAuth()
  const isOwner = role === 'owner'
  const canAdd = isOwner || role === 'staff' // 사장: 전체 / 스탭: 본인만
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [blocks, setBlocks] = useState([])
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState({ member_id: '', date: ymd(new Date()), start: '', end: '' })
  const [error, setError] = useState('')

  const days = weekDates(weekStart)

  async function load() {
    setError('')
    try {
      setBlocks(await listRange(days[0], days[6]))
      const members = await listMembers()
      setStaff(members.filter((m) => m.type === 'staff' && m.active))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  async function act(fn, ...args) {
    setError('')
    try {
      await fn(...args)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onAdd(e) {
    e.preventDefault()
    setError('')
    const mid = isOwner ? form.member_id : memberId
    if (!mid) return setError('스탭을 선택하세요.')
    const start = hmToMin(form.start)
    const end = hmToMin(form.end)
    if (Number.isNaN(start) || Number.isNaN(end) || start >= end) return setError('시간을 올바르게 입력하세요 (시작 < 종료).')
    await act(addAvailability, mid, form.date, start, end)
    setForm({ ...form, start: '', end: '' })
  }

  return (
    <div>
      <h1>스탭 출근부 (주간)</h1>
      <p style={{ color: '#9a93b8', fontSize: 13, marginTop: -8 }}>출근한 스탭만 그날 운영풀 지분을 받습니다. (전원 열람)</p>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>◀ 이전주</button>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))}>이번주</button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>다음주 ▶</button>
        <span style={{ color: '#9a93b8' }}>{days[0]} ~ {days[6]}</span>
      </div>

      {canAdd && (
        <form onSubmit={onAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 10, background: '#16131f', borderRadius: 10 }}>
          {isOwner && (
            <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
              <option value="">스탭</option>
              {staff.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>
            {days.map((d, i) => (
              <option key={d} value={d}>{d} ({DOW[i]})</option>
            ))}
          </select>
          <TimeField value={form.start} onChange={(v) => setForm({ ...form, start: v })} />
          ~
          <TimeField value={form.end} onChange={(v) => setForm({ ...form, end: v })} />
          <button type="submit">근무시간 추가</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d, i) => {
          const dayBlocks = blocks.filter((b) => b.date === d && b.member?.type === 'staff')
          return (
            <div key={d} style={{ background: '#16131f', borderRadius: 8, padding: 8, minHeight: 120 }}>
              <div style={{ fontWeight: 700, color: i >= 5 ? '#ff8fb0' : '#ffcf5a', fontSize: 13, marginBottom: 6 }}>
                {DOW[i]} <span style={{ color: '#9a93b8', fontWeight: 400 }}>{d.slice(5)}</span>
              </div>
              {dayBlocks.map((b) => (
                <div key={b.id} style={{ background: '#1c2340', borderRadius: 6, padding: '4px 6px', marginBottom: 4, fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{b.member?.name}</div>
                  <div>{minToHm(b.start_min)}~{minToHm(b.end_min)}</div>
                  <div style={{ color: b.checked_in_at ? '#5ee0a0' : '#9a93b8' }}>
                    {b.checked_in_at ? (b.checked_out_at ? '퇴근' : '출근중') : '예정'}
                  </div>
                  {(isOwner || b.member_id === memberId) && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {!b.checked_in_at && <button style={{ fontSize: 11 }} onClick={() => act(checkIn, b.id)}>출근</button>}
                      {b.checked_in_at && !b.checked_out_at && <button style={{ fontSize: 11 }} onClick={() => act(checkOut, b.id)}>퇴근</button>}
                      {b.checked_out_at && <button style={{ fontSize: 11 }} onClick={() => act(reCheckIn, b.id)}>재출근</button>}
                      <button style={{ fontSize: 11 }} onClick={() => act(removeAvailability, b.id)}>삭제</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
