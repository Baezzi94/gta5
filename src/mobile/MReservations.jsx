import { useEffect, useState } from 'react'
import { listByDate as listReservations, setStatus } from '../lib/reservations'
import { createTcFromReservation, createTalkFromReservation } from '../lib/charges'
import { businessYmd } from '../lib/week'
import { minToHm } from '../lib/time'

const STATUS_LABEL = { booked: '예약', in_progress: '진행', done: '완료', no_show: '노쇼', cancelled: '취소' }
const goBtn = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#5ee0a0', color: '#12101a', fontWeight: 800 }
const smBtn = { padding: '9px 12px', borderRadius: 8, border: '1px solid #3a2440', background: '#241a3d', color: '#ece9f5' }

export default function MReservations() {
  const date = businessYmd(new Date())
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function load() { try { setRows(await listReservations(date)) } catch (e) { setErr(e.message) } }
  useEffect(() => {
    load(); const t = setInterval(load, 12000); return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  async function proceed(r) {
    setBusy(true); setErr(''); setMsg('')
    try {
      await setStatus(r.id, 'in_progress')
      await createTcFromReservation(r)
      await createTalkFromReservation(r)
      setMsg('진행 완료 (TC+대화료 생성). 수금 탭/PC에서 수금 처리.'); await load()
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function mark(r, s) { setBusy(true); setErr(''); try { await setStatus(r.id, s); await load() } catch (e) { setErr(e.message) } setBusy(false) }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>예약 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>{date}</span></h2>
      {err && <p style={{ color: 'salmon', fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: '#5ee0a0', fontSize: 13 }}>{msg}</p>}
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
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 8 }}>※ "진행"하면 TC·대화료 자동 생성. 예약 생성/2차/삭제는 PC에서.</p>
    </div>
  )
}
