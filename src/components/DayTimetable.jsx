import { minToHm } from '../lib/time'

const STATUS_COLOR = {
  booked: '#4de1ff',
  in_progress: '#ffd24d',
  done: '#4dff9e',
  no_show: '#6b647f',
  cancelled: '#6b647f',
}

// rows: [{ id, name, windows:[{start,end}], reservations:[{start,end,status,label}] }]
export default function DayTimetable({ rows, onPick }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: '#9a93b8' }}>이 날짜에 가용시간을 등록한 공주님이 없습니다. (출근부에서 등록)</p>
  }

  let min = Infinity
  let max = -Infinity
  for (const r of rows) {
    for (const w of r.windows) {
      min = Math.min(min, w.start)
      max = Math.max(max, w.end)
    }
    for (const b of r.reservations) {
      min = Math.min(min, b.start)
      max = Math.max(max, b.end)
    }
  }
  if (!isFinite(min)) return <p style={{ color: '#9a93b8' }}>가용시간 정보가 없습니다.</p>
  min = Math.floor(min / 60) * 60
  max = Math.ceil(max / 60) * 60
  const total = Math.max(60, max - min)
  const pct = (x) => ((x - min) / total) * 100
  const hours = []
  for (let h = min; h <= max; h += 60) hours.push(h)

  return (
    <div style={{ marginBottom: 16, padding: 12, background: '#16131f', borderRadius: 10 }}>
      <div style={{ display: 'flex', marginBottom: 4 }}>
        <div style={{ width: 80, flex: 'none' }} />
        <div style={{ position: 'relative', flex: 1, height: 16, color: '#9a93b8', fontSize: 11 }}>
          {hours.map((h) => (
            <span key={h} style={{ position: 'absolute', left: `${pct(h)}%`, transform: 'translateX(-50%)' }}>{minToHm(h)}</span>
          ))}
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', height: 30, marginBottom: 4 }}>
          <div
            onClick={() => onPick && onPick(r.id)}
            style={{ width: 80, flex: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#ece9f5' }}
            title="클릭해서 예약 대상 선택"
          >
            {r.checkedIn && <span title="출근중" style={{ marginRight: 4 }}>🟢</span>}{r.name}
          </div>
          <div style={{ position: 'relative', flex: 1, height: 24, background: '#0a0810', borderRadius: 6, overflow: 'hidden' }}>
            {r.windows.map((w, i) => (
              <div
                key={'w' + i}
                title={`가능 ${minToHm(w.start)}~${minToHm(w.end)}`}
                style={{ position: 'absolute', left: `${pct(w.start)}%`, width: `${pct(w.end) - pct(w.start)}%`, top: 0, bottom: 0, background: 'rgba(94,224,160,.15)', border: '1px solid rgba(94,224,160,.4)' }}
              />
            ))}
            {r.reservations.map((b, i) => (
              <div
                key={'b' + i}
                title={`${b.is_date2 ? '[2차] ' : ''}${b.label || ''} ${minToHm(b.start)}~${minToHm(b.end)}`}
                style={{ position: 'absolute', left: `${pct(b.start)}%`, width: `${pct(b.end) - pct(b.start)}%`, top: 2, bottom: 2, background: b.is_date2 ? '#c08bff' : (STATUS_COLOR[b.status] || '#4de1ff'), borderRadius: 4, fontSize: 10, color: '#1a1020', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 3px', lineHeight: '20px' }}
              >
                {b.is_date2 ? `2차 ${b.label || ''}` : (b.label || '')}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 6, fontSize: 11, color: '#9a93b8' }}>
        <span style={{ color: '#5ee0a0' }}>■</span> 가능시간 &nbsp;
        <span style={{ color: '#4de1ff' }}>■</span> 예약 &nbsp;
        <span style={{ color: '#ffd24d' }}>■</span> 진행 &nbsp;
        <span style={{ color: '#4dff9e' }}>■</span> 완료 &nbsp;
        <span style={{ color: '#c08bff' }}>■</span> 2차
      </div>
    </div>
  )
}
