import { useEffect, useState } from 'react'
import { listByDate as listAvail } from '../lib/schedule'
import { listByDate as listReservations, createReservation, updateReservation, setStatus, startDate2, deleteReservation } from '../lib/reservations'
import { useAuth } from '../app/AuthContext'
import { findOrCreateByPhone } from '../lib/customers'
import { createTalkFromReservation, createTcFromReservation, createDate2FromReservation } from '../lib/charges'
import { listMembers } from '../lib/members'
import { isBanned } from '../lib/bans'
import { hmToMin, minToHm } from '../lib/time'
import { ymd } from '../lib/week'
import DayTimetable from '../components/DayTimetable'
import TimeField from '../components/TimeField'

const STATUS = [
  ['in_progress', '진행'],
  ['done', '완료'],
  ['no_show', '노쇼'],
  ['cancelled', '취소'],
]
const STATUS_LABEL = { booked: '예약', in_progress: '진행', done: '완료', no_show: '노쇼', cancelled: '취소' }

export default function Reservations() {
  const { role } = useAuth()
  const [date, setDate] = useState(() => ymd(new Date()))
  const [avail, setAvail] = useState([])
  const [rows, setRows] = useState([])
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ princess_id: '', phone: '', nickname: '', referred_by: '', start: '', end: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { id, princess_id, start, end }
  const [date2For, setDate2For] = useState(null) // { id, minutes }

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
    if (a.member?.type !== 'princess') continue // 스탭 등 공주 아닌 출근은 예약판에서 제외
    const id = a.member_id
    if (!byPrincess[id]) byPrincess[id] = { id, name: a.member?.name, windows: [], reservations: [], checkedIn: false }
    byPrincess[id].windows.push({ start: a.start_min, end: a.end_min })
    if (a.checked_in_at && !a.checked_out_at) byPrincess[id].checkedIn = true
  }
  for (const r of rows) {
    if (r.status === 'cancelled') continue
    const id = r.princess_id
    if (!byPrincess[id]) continue
    byPrincess[id].reservations.push({ start: r.start_min, end: r.end_min, status: r.status, label: r.customer?.nickname, is_date2: r.is_date2 })
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
      if (await isBanned(form.phone)) {
        setError(`🚫 밴된 번호(${form.phone})입니다. 예약 불가 — 밴 관리에서 해제하면 가능합니다.`)
        return
      }
      const customer = await findOrCreateByPhone({ phone: form.phone, nickname: form.nickname, referred_by: form.referred_by || null })
      await createReservation({ date, customer_id: customer.id, princess_id: form.princess_id, start_min, end_min })
      setForm({ princess_id: '', phone: '', nickname: '', referred_by: '', start: '', end: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onSaveEdit() {
    setError('')
    const start_min = hmToMin(editing.start)
    const end_min = hmToMin(editing.end)
    if (!editing.princess_id) return setError('공주님을 선택하세요.')
    if (Number.isNaN(start_min) || Number.isNaN(end_min) || start_min >= end_min) return setError('시간을 올바르게 입력하세요.')
    try {
      await updateReservation(editing.id, { date, princess_id: editing.princess_id, start_min, end_min })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onConfirmDate2(r) {
    setError('')
    setNotice('')
    const dur = Number(date2For?.minutes)
    if (!dur || dur <= 0) return setError('2차 시간을 분으로 입력하세요.')
    try {
      const conflictIds = await startDate2(r, dur)
      await createDate2FromReservation(r)
      const names = conflictIds.map((id) => {
        const c = rows.find((x) => x.id === id)
        return c ? `${c.customer?.nickname}(${minToHm(c.start_min)}~${minToHm(c.end_min)})` : id
      })
      setDate2For(null)
      await load()
      setNotice(
        names.length
          ? `⚠️ 2차로 ${dur}분 자리가 빕니다. 밀어야 할 예약: ${names.join(', ')} — 수정/취소로 조정하세요. (2차 100만 미수금 생성)`
          : `2차 등록 완료 (겹치는 예약 없음). 2차 100만 미수금 생성됨.`
      )
    } catch (e) {
      setError(e.message)
    }
  }

  async function onDelete(r) {
    if (!window.confirm(`${r.customer?.nickname ?? '이'} 예약을 삭제할까요? (되돌릴 수 없음)`)) return
    setError('')
    try {
      await deleteReservation(r.id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onStatus(r, status) {
    setError('')
    try {
      await setStatus(r.id, status)
      // 선불: "진행" 시작 시 예약(타임) 단위로 TC + 대화료 거래 자동 생성
      if (status === 'in_progress') {
        await createTcFromReservation(r)
        await createTalkFromReservation(r)
      }
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
            <option key={p.id} value={p.id}>{p.checkedIn ? '🟢출근 ' : ''}{p.name} (가능 {p.windows.map((w) => `${minToHm(w.start)}~${minToHm(w.end)}`).join(', ')})</option>
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
          <TimeField
            value={form.start}
            onChange={(v) => {
              const m = hmToMin(v)
              setForm((f) => ({ ...f, start: v, end: Number.isNaN(m) ? f.end : minToHm(m + 20) }))
            }}
          />
          ~
          <TimeField value={form.end} onChange={(v) => setForm({ ...form, end: v })} />
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
          {rows.map((r) => {
            const ed = editing && editing.id === r.id
            return (
              <tr key={r.id} style={{ borderTop: '1px solid #2c2742' }}>
                <td>
                  {ed ? (
                    <select value={editing.princess_id} onChange={(e) => setEditing({ ...editing, princess_id: e.target.value })}>
                      {timetableRows.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    r.princess?.name
                  )}
                </td>
                <td>{r.customer?.nickname} <span style={{ color: '#9a93b8' }}>{r.customer?.phone}</span></td>
                <td>
                  {ed ? (
                    <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TimeField value={editing.start} onChange={(v) => setEditing({ ...editing, start: v })} />~
                      <TimeField value={editing.end} onChange={(v) => setEditing({ ...editing, end: v })} />
                    </span>
                  ) : (
                    `${minToHm(r.start_min)} ~ ${minToHm(r.end_min)}`
                  )}
                </td>
                <td>{r.is_date2 ? <span style={{ color: '#c08bff', fontWeight: 700 }}>2차(외부)</span> : STATUS_LABEL[r.status]}</td>
                <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  {ed ? (
                    <>
                      <button onClick={onSaveEdit}>저장</button>
                      <button onClick={() => setEditing(null)}>취소</button>
                    </>
                  ) : date2For && date2For.id === r.id ? (
                    <>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={date2For.minutes}
                        onChange={(e) => setDate2For({ ...date2For, minutes: e.target.value.replace(/\D/g, '') })}
                        placeholder="분"
                        style={{ width: 56 }}
                      />
                      <button onClick={() => onConfirmDate2(r)}>2차확정</button>
                      <button onClick={() => setDate2For(null)}>취소</button>
                    </>
                  ) : (
                    <>
                      {STATUS.map(([v, l]) => (
                        <button key={v} onClick={() => onStatus(r, v)}>{l}</button>
                      ))}
                      <button onClick={() => setEditing({ id: r.id, princess_id: r.princess_id, start: minToHm(r.start_min), end: minToHm(r.end_min) })}>수정</button>
                      {!r.is_date2 && <button onClick={() => setDate2For({ id: r.id, minutes: '60' })}>2차</button>}
                      {role === 'owner' && <button onClick={() => onDelete(r)} style={{ color: '#ff6b6b' }}>삭제</button>}
                    </>
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
