import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { listReports } from '../lib/reports'
import { CLEARANCE_LABELS } from '../lib/clearance'

export default function Reports() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  useEffect(() => { listReports().then(setRows) }, [])
  const chief = profile?.role === 'intel_chief'
  return (
    <div className="container">
      <h2>보고</h2>
      {chief && <Link to="/reports/new"><button className="btn btn-primary" style={{ margin: '8px 0' }}>새 보고서 작성</button></Link>}
      {rows.map(r => (
        <Link key={r.id} to={`/reports/${r.id}`} style={{ textDecoration: 'none' }}>
          <div className="card" style={{ borderColor: r.read_at ? undefined : '#7a5f1d' }}>
            <strong>{r.read_at ? '' : '🔴 '}{r.title}</strong>
            <span className="tag" style={{ float: 'right' }}>{CLEARANCE_LABELS[r.clearance]}</span>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              {new Date(r.created_at).toLocaleString('ko-KR')} · {r.read_at ? '수신 확인됨' : '미확인'}
            </div>
          </div>
        </Link>
      ))}
      {rows.length === 0 && <p style={{ color: '#666' }}>보고서가 없습니다.</p>}
    </div>
  )
}
