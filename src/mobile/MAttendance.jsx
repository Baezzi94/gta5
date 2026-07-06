import { useEffect, useState } from 'react'
import { useAuth } from '../app/AuthContext'
import { listByDate, addAvailability, checkIn, checkOut, reCheckIn } from '../lib/schedule'
import { businessYmd } from '../lib/week'
import { minToHm } from '../lib/time'

// 인게임 현재시각 → 영업일 분(새벽은 24:00+로)
function nowBusinessMin() {
  const d = new Date()
  let h = d.getHours()
  if (h < 6) h += 24
  return h * 60 + d.getMinutes()
}

const bigBtn = (c) => ({ width: '100%', padding: '20px', fontSize: 20, fontWeight: 800, borderRadius: 14, border: 'none', background: c, color: '#12101a' })
const card = { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', background: '#16131f', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }
const smBtn = { fontSize: 13, padding: '6px 12px', borderRadius: 8, border: '1px solid #3a2440', background: '#241a3d', color: '#ece9f5' }

export default function MAttendance() {
  const { memberId } = useAuth()
  const date = businessYmd(new Date())
  const [blocks, setBlocks] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    try { const all = await listByDate(date); setBlocks(all.filter((a) => a.member_id === memberId)) } catch (e) { setMsg(e.message) }
  }
  useEffect(() => {
    load(); const t = setInterval(load, 12000); return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, memberId])

  const active = blocks.find((b) => b.checked_in_at && !b.checked_out_at)
  async function act(fn, ...a) { setBusy(true); setMsg(''); try { await fn(...a); await load() } catch (e) { setMsg(e.message) } setBusy(false) }
  async function goIn() {
    setBusy(true); setMsg('')
    try {
      const start = nowBusinessMin(); const end = Math.min(1799, start + 360)
      const b = await addAvailability(memberId, date, start, end)
      await checkIn(b.id); await load()
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  if (!memberId) return <p style={{ color: '#9a93b8' }}>연결된 멤버가 없습니다. 사장에게 문의하세요.</p>
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>출근 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>{date}</span></h2>
      {msg && <p style={{ color: 'salmon', fontSize: 13 }}>{msg}</p>}
      {active
        ? <button disabled={busy} onClick={() => act(checkOut, active.id)} style={bigBtn('#ff5e5e')}>● 출근중 — 퇴근하기</button>
        : <button disabled={busy} onClick={goIn} style={bigBtn('#5ee0a0')}>지금 출근</button>}
      <div style={{ marginTop: 16 }}>
        {blocks.length === 0
          ? <p style={{ color: '#9a93b8' }}>오늘 근무 기록이 없습니다. "지금 출근"을 누르세요.</p>
          : blocks.map((b) => (
            <div key={b.id} style={card}>
              <div>{minToHm(b.start_min)}~{minToHm(b.end_min)}</div>
              <div style={{ color: b.checked_in_at ? (b.checked_out_at ? '#9a93b8' : '#5ee0a0') : '#9a93b8', fontWeight: 700 }}>
                {b.checked_in_at ? (b.checked_out_at ? '퇴근' : '출근중') : '예정'}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {!b.checked_in_at && <button disabled={busy} onClick={() => act(checkIn, b.id)} style={smBtn}>출근</button>}
                {b.checked_in_at && !b.checked_out_at && <button disabled={busy} onClick={() => act(checkOut, b.id)} style={smBtn}>퇴근</button>}
                {b.checked_out_at && <button disabled={busy} onClick={() => act(reCheckIn, b.id)} style={smBtn}>재출근</button>}
              </div>
            </div>
          ))}
      </div>
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 12 }}>※ 출근(체크인)해야 정산에 참여합니다. 끝나면 꼭 퇴근.</p>
    </div>
  )
}
