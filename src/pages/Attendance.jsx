import { useEffect, useState } from 'react'
import { getOpenSession } from '../lib/sessions'
import { listMembers } from '../lib/members'
import { listBySession, addPlanned, checkIn, checkOut, setPlan, removePlanned } from '../lib/attendance'
import { hmToMin, minToHm } from '../lib/time'
import { useAuth } from '../app/AuthContext'

export default function Attendance() {
  const { role, memberId } = useAuth()
  const [session, setSession] = useState(null)
  const [rows, setRows] = useState([])
  const [princesses, setPrincesses] = useState([])
  const [addId, setAddId] = useState('')
  const [plans, setPlans] = useState({}) // { [attendanceId]: {start:'HH:MM', end:'HH:MM'} }
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const s = await getOpenSession()
      setSession(s)
      if (s) {
        const list = await listBySession(s.id)
        setRows(list)
        const p = {}
        for (const r of list) {
          p[r.id] = {
            start: r.plan_start_min != null ? minToHm(r.plan_start_min) : '',
            end: r.plan_end_min != null ? minToHm(r.plan_end_min) : '',
          }
        }
        setPlans(p)
      }
      const members = await listMembers()
      setPrincesses(members.filter((m) => m.type === 'princess' && m.active))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function act(fn, ...args) {
    setError('')
    try {
      await fn(...args)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function savePlan(id) {
    const p = plans[id]
    const start = hmToMin(p?.start)
    const end = hmToMin(p?.end)
    if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
      setError('가용시간을 올바르게 입력하세요 (시작 < 종료).')
      return
    }
    await act(setPlan, id, start, end)
  }

  if (!session) {
    return (
      <div>
        <h1>출근부</h1>
        <p style={{ color: '#9a93b8' }}>열린 영업 세션이 없습니다. (세션 메뉴에서 세션을 열어주세요)</p>
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
      </div>
    )
  }

  const addedIds = rows.map((r) => r.member_id)
  const addable = princesses.filter((p) => !addedIds.includes(p.id))
  const canManage = role === 'owner' || role === 'staff'

  return (
    <div>
      <h1>출근부 <span style={{ color: '#9a93b8', fontSize: 14 }}>({session.date})</span></h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      {canManage && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <select value={addId} onChange={(e) => setAddId(e.target.value)}>
            <option value="">+ 공주님 출근 예정 추가</option>
            {addable.map((p) => (
              <option key={p.id} value={p.id}>{p.name} / {p.phone}</option>
            ))}
          </select>
          <button disabled={!addId} onClick={() => act(addPlanned, session.id, addId).then(() => setAddId(''))}>추가</button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>공주님</th><th>가용시간(예정)</th><th>출근</th><th>액션</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const editable = canManage || (role === 'princess' && r.member_id === memberId)
            const p = plans[r.id] ?? { start: '', end: '' }
            return (
              <tr key={r.id} style={{ borderTop: '1px solid #2c2742' }}>
                <td>{r.member?.name}</td>
                <td>
                  {editable ? (
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input type="time" value={p.start} onChange={(e) => setPlans({ ...plans, [r.id]: { ...p, start: e.target.value } })} />
                      ~
                      <input type="time" value={p.end} onChange={(e) => setPlans({ ...plans, [r.id]: { ...p, end: e.target.value } })} />
                      <button onClick={() => savePlan(r.id)}>저장</button>
                    </span>
                  ) : r.plan_start_min != null ? (
                    `${minToHm(r.plan_start_min)} ~ ${minToHm(r.plan_end_min)}`
                  ) : (
                    '-'
                  )}
                </td>
                <td>{r.checked_in_at ? (r.checked_out_at ? '퇴근' : '출근중') : '예정'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {editable && !r.checked_in_at && <button onClick={() => act(checkIn, r.id)}>출근</button>}
                  {editable && r.checked_in_at && !r.checked_out_at && <button onClick={() => act(checkOut, r.id)}>퇴근</button>}
                  {canManage && <button onClick={() => act(removePlanned, r.id)}>삭제</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
