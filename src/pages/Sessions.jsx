import { useEffect, useState } from 'react'
import { listSessions, createSession, openSession, closeSession } from '../lib/sessions'

const STATUS_LABEL = { prep: '준비', open: '영업중', closed: '마감' }

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  async function load() {
    try {
      setSessions(await listSessions())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createSession(date)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function act(fn, id) {
    setError('')
    try {
      await fn(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>영업 세션</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="submit">세션 생성</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>날짜</th><th>상태</th><th>액션</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid #2c2742' }}>
              <td>{s.date}</td>
              <td>{STATUS_LABEL[s.status] ?? s.status}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                {s.status === 'prep' && <button onClick={() => act(openSession, s.id)}>열기</button>}
                {s.status === 'open' && <button onClick={() => act(closeSession, s.id)}>마감</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
