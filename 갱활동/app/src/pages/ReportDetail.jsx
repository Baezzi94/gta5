import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { getReport, markReportRead } from '../lib/reports'
import { CLEARANCE_LABELS, isIntel } from '../lib/clearance'
import { MiniMarkdown } from '../lib/miniMarkdown'

export default function ReportDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [r, setR] = useState(null)

  useEffect(() => {
    getReport(id).then(async data => {
      setR(data)
      if (profile?.role === 'boss' && !data.read_at) {
        await markReportRead(id)   // 보스가 열면 수신 확인
        setR({ ...data, read_at: new Date().toISOString() })
      }
    })
  }, [id, profile?.role])

  if (!r) return <div className="container">로딩...</div>
  const attached = r.report_tips.map(x => x.tips).filter(Boolean)
  const chief = profile?.role === 'intel_chief'

  return (
    <div className="container">
      <h2>{r.title}</h2>
      <p style={{ color: '#888', fontSize: 13 }}>
        {new Date(r.created_at).toLocaleString('ko-KR')} ·
        <span className="tag" style={{ marginLeft: 6 }}>{CLEARANCE_LABELS[r.clearance]}</span>
        {chief && (r.read_at ? ' 대표님 열람함' : ' 미열람')}
      </p>
      <div className="card"><MiniMarkdown text={r.body} /></div>

      {attached.length > 0 && (
        <>
          <h3 style={{ margin: '14px 0 6px' }}>관련 정보</h3>
          {attached.map(t => (
            isIntel(profile?.role)
              ? <Link key={t.id} to={`/inbox/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card">{t.title} <span className="tag" style={{ float: 'right' }}>{CLEARANCE_LABELS[t.clearance]}</span></div>
                </Link>
              : <div className="card" key={t.id}>{t.title} <span className="tag" style={{ float: 'right' }}>{CLEARANCE_LABELS[t.clearance]}</span></div>
          ))}
        </>
      )}

      <p style={{ textAlign: 'right', color: '#e8c15a', marginTop: 16, letterSpacing: 2 }}>— 정보부장 —</p>
    </div>
  )
}
