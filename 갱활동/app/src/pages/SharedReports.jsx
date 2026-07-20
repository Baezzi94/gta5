import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSharedReports } from '../lib/reports'

export default function SharedReports() {
  const [rows, setRows] = useState([])
  useEffect(() => { listSharedReports().then(setRows) }, [])
  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <h2>공유 보고</h2>
      <p style={{ color: '#888', fontSize: 13, margin: '4px 0 10px' }}>정보부가 전 조직원에게 공개한 자료입니다.</p>
      {rows.map(r => (
        <Link key={r.id} to={`/reports/${r.id}`} style={{ textDecoration: 'none' }}>
          <div className="card">
            <strong>{r.title}</strong>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{new Date(r.created_at).toLocaleString('ko-KR')}</div>
          </div>
        </Link>
      ))}
      {rows.length === 0 && <p style={{ color: '#666' }}>공유된 자료가 없습니다.</p>}
    </div>
  )
}
