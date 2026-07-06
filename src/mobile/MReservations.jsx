import { useEffect, useState } from 'react'
import { listByDate as listReservations, createReservation, setStatus } from '../lib/reservations'
import { listByDate as listAvail } from '../lib/schedule'
import { createTcFromReservation, createTalkFromReservation } from '../lib/charges'
import { createCustomer } from '../lib/customers'
import { listMembers } from '../lib/members'
import { businessYmd } from '../lib/week'
import { minToHm, hmToMin } from '../lib/time'

const STATUS_LABEL = { booked: '예약', in_progress: '진행', done: '완료', no_show: '노쇼', cancelled: '취소' }
const inp = { padding: 11, borderRadius: 10, border: '1px solid #3a2440', background: '#16131f', color: '#fff', boxSizing: 'border-box' }
const goBtn = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5ee0a0', color: '#12101a', fontWeight: 800 }
const smBtn = { padding: '9px 12px', borderRadius: 8, border: '1px solid #3a2440', background: '#241a3d', color: '#ece9f5' }

export default function MReservations() {
  const date = businessYmd(new Date())
  const [rows, setRows] = useState([])
  const [members, setMembers] = useState([])
  const [avail, setAvail] = useState([])
  const [form, setForm] = useState({ princess_id: '', nickname: '', start: '', end: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function load() { try { setRows(await listReservations(date)); setAvail(await listAvail(date)) } catch (e) { setErr(e.message) } }
  useEffect(() => {
    listMembers().then(setMembers).catch(() => {})
    load(); const t = setInterval(load, 12000); return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const checkedIn = new Set(avail.filter((a) => a.checked_in_at && !a.checked_out_at && (a.member?.type === 'princess' || a.member?.dual_princess)).map((a) => a.member_id))
  const princesses = members.filter((m) => (m.type === 'princess' || m.dual_princess) && m.active)

  async function register(e) {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('')
    try {
      if (!form.princess_id) throw new Error('공주님을 선택하세요.')
      if (!form.nickname.trim()) throw new Error('손님 닉네임을 입력하세요.')
      const start_min = hmToMin(form.start), end_min = hmToMin(form.end)
      if (Number.isNaN(start_min) || Number.isNaN(end_min) || start_min >= end_min) throw new Error('시간을 올바르게 입력하세요 (예: 20:00 ~ 20:20).')
      const c = await createCustomer({ nickname: form.nickname.trim(), phone: null })
      await createReservation({ date, customer_id: c.id, princess_id: form.princess_id, start_min, end_min })
      setMsg('예약 등록 완료'); setForm({ princess_id: '', nickname: '', start: '', end: '' }); await load()
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function proceed(r) {
    setBusy(true); setErr(''); setMsg('')
    try { await setStatus(r.id, 'in_progress'); await createTcFromReservation(r); await createTalkFromReservation(r); setMsg('진행 완료 (TC+대화료 생성).'); await load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function mark(r, s) { setBusy(true); setErr(''); try { await setStatus(r.id, s); await load() } catch (e) { setErr(e.message) } setBusy(false) }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>예약 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>{date}</span></h2>
      {err && <p style={{ color: 'salmon', fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: '#5ee0a0', fontSize: 13 }}>{msg}</p>}

      <form onSubmit={register} style={{ background: '#16131f', borderRadius: 12, padding: 12, marginBottom: 14, display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 800 }}>예약 등록</div>
        <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })} style={inp}>
          <option value="">공주님 선택</option>
          {princesses.map((p) => <option key={p.id} value={p.id}>{p.name}{checkedIn.has(p.id) ? ' ● 출근중' : ' (미출근)'}</option>)}
        </select>
        <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="손님 닉네임" style={inp} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} placeholder="시작 20:00" style={{ ...inp, flex: 1 }} />
          <input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} placeholder="종료 20:20" style={{ ...inp, flex: 1 }} />
        </div>
        <button disabled={busy} type="submit" style={{ padding: 14, fontSize: 16, fontWeight: 800, borderRadius: 10, border: 'none', background: '#ff5ea0', color: '#12101a' }}>예약 등록</button>
        <span style={{ color: '#9a93b8', fontSize: 12 }}>※ 공주가 출근(체크인)한 시간대여야 등록됩니다. (24시 넘으면 25:00처럼 입력)</span>
      </form>

      {rows.length === 0
        ? <p style={{ color: '#9a93b8' }}>오늘 예약이 없습니다.</p>
        : rows.map((r) => (
          <div key={r.id} style={{ background: '#16131f', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{r.princess?.name ?? '-'}</b>
              <span style={{ color: '#ffcf5a' }}>{minToHm(r.start_min)}~{minToHm(r.end_min)}</span>
            </div>
            <div style={{ color: '#9a93b8', fontSize: 13, margin: '4px 0 8px' }}>{r.customer?.nickname ?? '-'} · {STATUS_LABEL[r.status] ?? r.status}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.status === 'booked' && <button disabled={busy} onClick={() => proceed(r)} style={goBtn}>진행</button>}
              {r.status !== 'cancelled' && r.status !== 'no_show' && <button disabled={busy} onClick={() => mark(r, 'no_show')} style={smBtn}>노쇼</button>}
            </div>
          </div>
        ))}
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 8 }}>※ 2차·예약삭제는 PC에서. "진행"하면 TC·대화료 자동 생성.</p>
    </div>
  )
}
