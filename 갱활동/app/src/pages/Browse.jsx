import { useEffect, useState } from 'react'
import { listBrowse, listBrowsePhotos } from '../lib/tips'
import { CLEARANCE_LABELS } from '../lib/clearance'

export default function Browse() {
  const [tips, setTips] = useState([])
  const [open, setOpen] = useState(null)   // 펼친 tip id
  const [photos, setPhotos] = useState({})
  useEffect(() => { listBrowse().then(setTips) }, [])

  async function toggle(t) {
    if (open === t.id) return setOpen(null)
    setOpen(t.id)
    if (!photos[t.id]) {
      const urls = await listBrowsePhotos(t.id)
      setPhotos(p => ({ ...p, [t.id]: urls }))
    }
  }

  return (
    <div className="container">
      <h2>정보 열람</h2>
      {tips.map(t => (
        <div className="card" key={t.id} onClick={() => toggle(t)}>
          <strong>{t.title}</strong>
          <span className="tag" style={{ float: 'right' }}>{CLEARANCE_LABELS[t.clearance]}</span>
          {open === t.id && (
            <div style={{ marginTop: 8 }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{t.body}</p>
              {(photos[t.id] ?? []).map(u => <img key={u} src={u} alt="첨부" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />)}
            </div>
          )}
        </div>
      ))}
      {tips.length === 0 && <p style={{ color: '#666' }}>열람 가능한 정보가 없습니다.</p>}
    </div>
  )
}
