import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPersons, findOrCreatePerson } from '../lib/persons'
import { CLEARANCE_LABELS } from '../lib/clearance'

export default function Persons() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  async function refresh() { setRows(await listPersons(search)) }
  useEffect(() => { refresh() }, [search])

  async function add(e) {
    e.preventDefault()
    if (!name.trim() && !phone.trim()) return
    await findOrCreatePerson({ phone, name })
    setName(''); setPhone(''); refresh()
  }

  return (
    <div className="container">
      <h2>인물 DB</h2>
      <form onSubmit={add} className="card" style={{ display: 'flex', gap: 8 }}>
        <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="전화번호(미상 시 공란)" value={phone} onChange={e => setPhone(e.target.value)} />
        <button className="btn btn-primary" type="submit">등록</button>
      </form>
      <input placeholder="이름/번호 검색" value={search} onChange={e => setSearch(e.target.value)} style={{ margin: '8px 0' }} />
      {rows.map(p => (
        <Link key={p.id} to={`/persons/${p.id}`} style={{ textDecoration: 'none' }}>
          <div className="card">
            <strong>{p.person_names.map(n => n.name).join(' / ') || '(이름 미상)'}</strong>
            <span className="tag" style={{ float: 'right' }}>{CLEARANCE_LABELS[p.clearance]}</span>
            <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{p.phone ?? '번호 미상'} {p.affiliation ? `· ${p.affiliation}` : ''}</div>
          </div>
        </Link>
      ))}
      {rows.length === 0 && <p style={{ color: '#666' }}>등록된 인물이 없습니다.</p>}
    </div>
  )
}
