import { useEffect, useState } from 'react'
import { useAuth } from '../app/AuthContext'
import { createTip, listMyTips, listCategories, STATUS_LABELS } from '../lib/tips'

export default function SubmitTip() {
  const { session } = useAuth()
  const [cats, setCats] = useState([])
  const [mine, setMine] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [files, setFiles] = useState([])
  const [mentions, setMentions] = useState([])
  const [msg, setMsg] = useState('')

  function setMention(i, key, val) {
    setMentions(ms => ms.map((m, idx) => idx === i ? { ...m, [key]: val } : m))
  }

  async function refresh() {
    setMine(await listMyTips(session.user.id))
  }
  useEffect(() => { listCategories().then(setCats); refresh() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return setMsg('제목과 내용을 입력하십시오.')
    try {
      await createTip({ title: title.trim(), body: body.trim(), categoryId, files, mentions, userId: session.user.id })
      setTitle(''); setBody(''); setFiles([]); setCategoryId(''); setMentions([])
      setMsg('제보가 접수되었습니다.')
      refresh()
    } catch (err) { setMsg('실패: ' + err.message) }
  }

  return (
    <div className="container">
      <h2>정보 제공</h2>
      <form onSubmit={submit} className="card">
        <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="내용 (누가/언제/어디서/무엇을)" rows={5} value={body}
          onChange={e => setBody(e.target.value)} style={{ marginTop: 8 }} />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ marginTop: 8 }}>
          <option value="">분류 선택(선택사항)</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="file" accept="image/*" multiple onChange={e => setFiles([...e.target.files])} style={{ marginTop: 8 }} />

        <div style={{ marginTop: 10 }}>
          <strong style={{ fontSize: 14 }}>연관 인물</strong>
          <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>사건에 얽힌 사람들. 전화번호를 알면 꼭 적어주십시오.</span>
          {mentions.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input placeholder="이름" value={m.name} onChange={e => setMention(i, 'name', e.target.value)} />
              <input placeholder="전화번호(모르면 공란)" value={m.phone} onChange={e => setMention(i, 'phone', e.target.value)} />
              <button className="btn" type="button" style={{ width: 'auto' }}
                onClick={() => setMentions(ms => ms.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button className="btn" type="button" style={{ marginTop: 6, width: 'auto' }}
            onClick={() => setMentions(ms => [...ms, { name: '', phone: '' }])}>+ 인물 추가</button>
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 10 }}>제보</button>
        {msg && <p style={{ marginTop: 8, color: '#e8c15a' }}>{msg}</p>}
      </form>

      <h3 style={{ margin: '16px 0 8px' }}>내 제보</h3>
      {mine.map(t => (
        <div className="card" key={t.id}>
          <strong>{t.title}</strong>
          <span className="tag" style={{ float: 'right' }}>{STATUS_LABELS[t.status]}</span>
        </div>
      ))}
      {mine.length === 0 && <p style={{ color: '#666' }}>제보 내역이 없습니다.</p>}
    </div>
  )
}
