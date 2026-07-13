import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listInbox, STATUS_LABELS } from '../lib/tips'
import { CLEARANCE_LABELS } from '../lib/clearance'

export default function Inbox() {
  const [tips, setTips] = useState([])
  const [filter, setFilter] = useState('all')
  useEffect(() => { listInbox().then(setTips) }, [])
  const shown = tips.filter(t => filter === 'all' || t.status === filter)
  return (
    <div className="container">
      <h2>접수함</h2>
      <select value={filter} onChange={e => setFilter(e.target.value)} style={{ margin: '8px 0' }}>
        <option value="all">전체</option>
        <option value="received">접수</option>
        <option value="reviewing">검토중</option>
        <option value="adopted">채택</option>
        <option value="rejected">기각</option>
      </select>
      {shown.map(t => (
        <Link key={t.id} to={`/inbox/${t.id}`} style={{ textDecoration: 'none' }}>
          <div className="card">
            <strong>{t.title}</strong>
            <div style={{ marginTop: 6 }}>
              <span className="tag">{STATUS_LABELS[t.status]}</span>
              {t.categories?.name && <span className="tag">{t.categories.name}</span>}
              {t.clearance !== null && <span className="tag">{CLEARANCE_LABELS[t.clearance]}</span>}
            </div>
          </div>
        </Link>
      ))}
      {shown.length === 0 && <p style={{ color: '#666' }}>해당 상태의 제보가 없습니다.</p>}
    </div>
  )
}
