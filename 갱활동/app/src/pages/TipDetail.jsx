import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { getTip, updateTipReview, getTipPhotoUrls, listCategories } from '../lib/tips'
import { findOrCreatePerson, linkTipPerson } from '../lib/persons'
import { isAdmin, CLEARANCE_LABELS } from '../lib/clearance'

export default function TipDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { profile } = useAuth()
  const [tip, setTip] = useState(null)
  const [cats, setCats] = useState([])
  const [photos, setPhotos] = useState([])
  const [form, setForm] = useState({})
  const [linkName, setLinkName] = useState('')
  const [linkPhone, setLinkPhone] = useState('')
  const [linkMsg, setLinkMsg] = useState('')

  useEffect(() => {
    listCategories().then(setCats)
    getTip(id).then(async t => {
      setTip(t)
      setForm({ category_id: t.category_id ?? '', verdict: t.verdict, intel_memo: t.intel_memo ?? '', clearance: t.clearance ?? '' })
      setPhotos(await getTipPhotoUrls(t.tip_photos.map(p => p.path)))
    })
  }, [id])

  if (!tip) return <div className="container">로딩...</div>
  const admin = isAdmin(profile?.role)

  async function save(status) {
    const patch = {
      category_id: form.category_id || null,
      verdict: form.verdict,
      intel_memo: form.intel_memo,
    }
    if (status) patch.status = status
    if (admin && form.clearance !== '') patch.clearance = Number(form.clearance)
    await updateTipReview(id, patch)
    nav('/inbox')
  }

  async function linkPerson() {
    if (!linkName.trim() && !linkPhone.trim()) return
    const pid = await findOrCreatePerson({ phone: linkPhone, name: linkName })
    await linkTipPerson(id, pid)
    setLinkName(''); setLinkPhone(''); setLinkMsg('인물 연결 완료')
  }

  return (
    <div className="container">
      <h2>{tip.title}</h2>
      <p style={{ color: '#888', fontSize: 13 }}>제보자: {tip.profiles?.char_name ?? '?'} · {new Date(tip.created_at).toLocaleString('ko-KR')}</p>
      <div className="card" style={{ whiteSpace: 'pre-wrap' }}>{tip.body}</div>
      {photos.map(u => <img key={u} src={u} alt="첨부" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }} />)}

      <div className="card">
        <label>분류
          <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">미분류</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label style={{ display: 'block', marginTop: 8 }}>진위
          <select value={form.verdict} onChange={e => setForm(f => ({ ...f, verdict: e.target.value }))}>
            <option value="unverified">미확인</option>
            <option value="true">사실</option>
            <option value="false">허위</option>
            <option value="uncertain">불확실</option>
          </select></label>
        <label style={{ display: 'block', marginTop: 8 }}>내부 메모
          <textarea rows={3} value={form.intel_memo} onChange={e => setForm(f => ({ ...f, intel_memo: e.target.value }))} /></label>
        {admin && (
          <label style={{ display: 'block', marginTop: 8 }}>보안등급 (확정)
            <select value={form.clearance} onChange={e => setForm(f => ({ ...f, clearance: e.target.value }))}>
              <option value="">미정</option>
              {[0, 1, 2, 3].map(l => <option key={l} value={l}>{CLEARANCE_LABELS[l]}</option>)}
            </select></label>
        )}
      </div>

      <div className="card">
        <strong>인물 연결</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="이름" value={linkName} onChange={e => setLinkName(e.target.value)} />
          <input placeholder="전화번호(미상 공란)" value={linkPhone} onChange={e => setLinkPhone(e.target.value)} />
          <button className="btn" type="button" onClick={linkPerson}>연결</button>
        </div>
        {linkMsg && <p style={{ marginTop: 6, color: '#e8c15a', fontSize: 13 }}>{linkMsg}</p>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => save('reviewing')}>검토중으로 저장</button>
        {admin && <button className="btn btn-primary" onClick={() => save('adopted')} disabled={form.clearance === ''}>채택</button>}
        {admin && <button className="btn" onClick={() => save('rejected')}>기각</button>}
      </div>
    </div>
  )
}
