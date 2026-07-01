import { useEffect, useRef, useState } from 'react'
import { listByDate } from '../lib/schedule'
import { businessYmd } from '../lib/week'
import { minToHm } from '../lib/time'
import { toPng } from 'html-to-image'

export default function Flyer() {
  const [date, setDate] = useState(() => businessYmd(new Date()))
  const [avail, setAvail] = useState([])
  const [title, setTitle] = useState('공주님 클럽')
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
    if (a.member?.type !== 'princess') continue // 찌라시는 공주님만
    const id = a.member_id
    if (!map[id]) map[id] = { id, name: a.member?.name, photo: a.member?.profile_photo_url, checkedIn: false, windows: [] }
    map[id].windows.push({ start: a.start_min, end: a.end_min })
    if (a.checked_in_at && !a.checked_out_at) map[id].checkedIn = true
  }
  let people = Object.values(map)
  for (const p of people) p.windows.sort((x, y) => x.start - y.start)
  const hoursText = (p) => p.windows.map((w) => `${minToHm(w.start)}~${minToHm(w.end)}`).join(', ')
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
        <button onClick={() => setDate(businessYmd(new Date()))}>오늘</button>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
        <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="부제" />
        <label style={{ color: '#9a93b8' }}>
          <input type="checkbox" checked={onlyCheckedIn} onChange={(e) => setOnlyCheckedIn(e.target.checked)} /> 출근중만
        </label>
        <button type="submit" onClick={download}>이미지로 저장 (PNG)</button>
      </div>

      {/* 찌라시 캔버스 (포스터 톤) */}
      <div
        ref={ref}
        style={{
          width: 620,
          background: 'linear-gradient(180deg,#160b1c,#0b0710 60%,#120a17)',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid #35203f',
          color: '#fff',
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: '0 0 50px rgba(255,60,150,.15)',
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: '26px 28px 12px', textAlign: 'center' }}>
          <div style={{ color: '#ffcf5a', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>CLIMAX · 서버 유일 공식 양주 바</div>
          <div style={{ fontFamily: "'Hahmlet', serif", fontWeight: 700, fontSize: 46, letterSpacing: 1, lineHeight: 1.1, marginTop: 6, textShadow: '0 0 3px #ff9ecb, 0 0 14px #ff2e86, 0 0 30px rgba(255,46,134,.6)' }}>{title}</div>
          <div style={{ color: '#ffd6e8', fontSize: 15, fontWeight: 700, marginTop: 8 }}>{sub} · {date}</div>
        </div>

        {/* 배지 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '0 24px 14px' }}>
          {['🥃 공식 양주 판매', '🎷 재즈 라이브', '🛡️ 안전구역', '❤️ 호감도 부스트'].map((b) => (
            <span key={b} style={{ background: 'rgba(255,94,160,.12)', border: '1px solid #6a2a48', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700, color: '#ffd6e8' }}>{b}</span>
          ))}
        </div>

        {/* 공주 그리드 */}
        <div style={{ padding: '0 24px 6px' }}>
          {people.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9a8fb0', padding: 24 }}>해당 날짜 가용 공주님이 없습니다. (출근부에서 가용시간 등록 + 사진 등록)</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {people.map((p) => (
                <div key={p.id} style={{ background: '#140d1e', borderRadius: 14, padding: 10, textAlign: 'center', border: '1px solid #33253f' }}>
                  {p.photo ? (
                    <img src={p.photo} crossOrigin="anonymous" alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 10 }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 10, background: '#241a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a8fb0' }}>사진없음</div>
                  )}
                  <div style={{ marginTop: 8, fontFamily: "'Black Han Sans', sans-serif", fontSize: 18, background: 'linear-gradient(90deg,#ff77b4,#ffcf5a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{p.name}</div>
                  <div style={{ color: '#ffcf5a', fontSize: 12, fontWeight: 700, marginTop: 2 }}>🕐 {hoursText(p)}</div>
                  {p.checkedIn && <div style={{ color: '#5ee0a0', fontSize: 11, fontWeight: 700 }}>● 출근중</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ marginTop: 14, padding: '14px 24px 18px', borderTop: '1px solid #2c2440', textAlign: 'center' }}>
          <div style={{ color: '#ff9ec6', fontWeight: 800, fontSize: 15 }}>예약 없이 술 한잔 · 공주님은 예약제</div>
          <div style={{ color: '#ffd6e8', fontSize: 13, marginTop: 4 }}>📍 <b style={{ color: '#ffcf5a' }}>7219</b> 바하마 마마스 클럽 · 예약/문의 010-4499-3016</div>
        </div>
      </div>
    </div>
  )
}
