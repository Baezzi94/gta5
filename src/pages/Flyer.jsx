import { useEffect, useRef, useState } from 'react'
import { listByDate } from '../lib/schedule'
import { ymd } from '../lib/week'
import { toPng } from 'html-to-image'

export default function Flyer() {
  const [date, setDate] = useState(() => ymd(new Date()))
  const [avail, setAvail] = useState([])
  const [title, setTitle] = useState('공주님 클럽 OPEN')
  const [sub, setSub] = useState('오늘의 공주님')
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)

  async function load() {
    setError('')
    try {
      setAvail(await listByDate(date))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const map = {}
  for (const a of avail) {
    const id = a.member_id
    if (!map[id]) map[id] = { id, name: a.member?.name, photo: a.member?.profile_photo_url, checkedIn: false }
    if (a.checked_in_at && !a.checked_out_at) map[id].checkedIn = true
  }
  let people = Object.values(map)
  if (onlyCheckedIn) people = people.filter((p) => p.checkedIn)

  async function download() {
    if (!ref.current) return
    setError('')
    try {
      const url = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = url
      a.download = `찌라시_${date}.png`
      a.click()
    } catch (e) {
      setError('이미지 생성 실패(사진 CORS 문제일 수 있음): ' + e.message)
    }
  }

  return (
    <div>
      <h1>찌라시 생성</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={() => setDate(ymd(new Date()))}>오늘</button>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
        <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="부제" />
        <label style={{ color: '#9a93b8' }}>
          <input type="checkbox" checked={onlyCheckedIn} onChange={(e) => setOnlyCheckedIn(e.target.checked)} /> 출근중만
        </label>
        <button type="submit" onClick={download}>이미지로 저장 (PNG)</button>
      </div>

      {/* 찌라시 캔버스 */}
      <div
        ref={ref}
        style={{
          width: 600,
          padding: 28,
          background: 'radial-gradient(600px 320px at 50% 0%, #2a1c3c 0%, #0e0c16 70%)',
          borderRadius: 16,
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, background: 'linear-gradient(90deg,#ff5ea0,#ffcf5a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          {title}
        </div>
        <div style={{ textAlign: 'center', color: '#cfc9e6', marginBottom: 18 }}>{sub} · {date}</div>

        {people.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9a93b8', padding: 24 }}>해당 날짜 가용 공주님이 없습니다. (출근부에서 가용시간 등록 + 사진 등록)</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {people.map((p) => (
              <div key={p.id} style={{ background: '#16131f', borderRadius: 14, padding: 10, textAlign: 'center', border: '1px solid #2c2742' }}>
                {p.photo ? (
                  <img src={p.photo} crossOrigin="anonymous" alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 10 }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 10, background: '#241a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a93b8' }}>사진없음</div>
                )}
                <div style={{ marginTop: 8, fontWeight: 800 }}>{p.name}</div>
                {p.checkedIn && <div style={{ color: '#5ee0a0', fontSize: 12, fontWeight: 700 }}>● 출근중</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, color: '#ff8fb0', fontWeight: 700 }}>예약 문의 환영 · CLIMAX</div>
      </div>
    </div>
  )
}
