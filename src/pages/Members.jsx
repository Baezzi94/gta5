import { useEffect, useState } from 'react'
import { listMembers, createMember, updateMember, deleteMember } from '../lib/members'
import { listCodes, regenerateCode } from '../lib/codes'
import { uploadAvatar } from '../lib/storage'

const TYPES = [
  ['princess', '공주님'],
  ['staff', '운영스탭'],
  ['promoter', '삐끼'],
  ['owner', '사장'],
]
const TYPE_LABEL = Object.fromEntries(TYPES)

export default function Members() {
  const [members, setMembers] = useState([])
  const [codes, setCodes] = useState([])
  const [copied, setCopied] = useState('')
  const [editing, setEditing] = useState(null) // { id, name, phone, memo }
  const [form, setForm] = useState({ name: '', phone: '', type: 'princess', memo: '', referred_by: '' })
  const [error, setError] = useState('')

  async function load() {
    try {
      setMembers(await listMembers())
    } catch (e) {
      setError(e.message)
    }
  }
  async function loadCodes() {
    try {
      setCodes(await listCodes())
    } catch (e) {
      /* 코드 조회 권한 없으면 무시 */
    }
  }
  useEffect(() => {
    load()
    loadCodes()
  }, [])

  async function onCopy(code, role) {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // 클립보드 차단 환경 폴백
      const t = document.createElement('textarea')
      t.value = code
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      document.body.removeChild(t)
    }
    setCopied(role)
    setTimeout(() => setCopied(''), 1200)
  }

  async function onRegen(role) {
    setError('')
    try {
      await regenerateCode(role)
      loadCodes()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onPhoto(id, file) {
    if (!file) return
    setError('')
    try {
      const url = await uploadAvatar(id, file)
      await updateMember(id, { profile_photo_url: url })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onSaveEdit() {
    setError('')
    try {
      await updateMember(editing.id, {
        name: editing.name,
        phone: editing.phone,
        memo: editing.memo || null,
        referred_by: editing.referred_by || null,
      })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onDelete(id, name) {
    if (!window.confirm(`'${name}' 멤버를 삭제할까요? (되돌릴 수 없음)`)) return
    setError('')
    try {
      await deleteMember(id)
      load()
    } catch (e) {
      setError('삭제 실패: ' + e.message)
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createMember({
        name: form.name,
        phone: form.phone,
        type: form.type,
        memo: form.memo || null,
        referred_by: form.type === 'princess' && form.referred_by ? form.referred_by : null,
      })
      setForm({ name: '', phone: '', type: 'princess', memo: '', referred_by: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>멤버 관리</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      {codes.length > 0 && (
        <div style={{ marginBottom: 20, padding: 12, background: '#16131f', borderRadius: 10 }}>
          <strong>가입 코드</strong>
          <p style={{ color: '#9a93b8', fontSize: 12, margin: '4px 0 8px' }}>역할별 코드를 해당 인원에게 전달 → 회원가입 시 입력하면 자동으로 그 역할로 가입됩니다.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {codes.map((c) => (
              <div key={c.role} style={{ background: '#241a3d', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: '#ffcf5a', fontSize: 12 }}>{TYPE_LABEL[c.role] ?? c.role}</div>
                <code style={{ fontSize: 16, letterSpacing: 1 }}>{c.code}</code>
                <button style={{ marginLeft: 8, fontSize: 11 }} onClick={() => onCopy(c.code, c.role)}>
                  {copied === c.role ? '복사됨!' : '복사'}
                </button>
                <button style={{ marginLeft: 4, fontSize: 11 }} onClick={() => onRegen(c.role)}>재발급</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 24 }}>
        <input placeholder="이름(닉)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="전화번호 (필수)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {form.type === 'princess' && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ color: '#9a93b8', fontSize: 13 }}>추천인 (이 공주님을 데려온 멤버)</span>
            <select value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })}>
              <option value="">없음</option>
              {members
                .filter((m) => m.active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} / {m.phone ?? '-'} ({TYPE_LABEL[m.type]})
                  </option>
                ))}
            </select>
          </label>
        )}

        <input placeholder="메모(선택)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        <button type="submit">멤버 추가</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>사진</th><th>이름</th><th>유형</th><th>전화</th><th>추천인</th><th>활성</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const ed = editing && editing.id === m.id
            return (
              <tr key={m.id} style={{ borderTop: '1px solid #2c2742' }}>
                <td>
                  <label style={{ cursor: 'pointer', display: 'inline-block' }} title="클릭해서 사진 변경">
                    {m.profile_photo_url ? (
                      <img src={m.profile_photo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 8, background: '#241a3d', alignItems: 'center', justifyContent: 'center', color: '#9a93b8' }}>＋</span>
                    )}
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && onPhoto(m.id, e.target.files[0])} />
                  </label>
                </td>
                <td>{ed ? <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={{ width: 80 }} /> : m.name}</td>
                <td>{TYPE_LABEL[m.type] ?? m.type}</td>
                <td>{ed ? <input value={editing.phone ?? ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} style={{ width: 110 }} /> : (m.phone ?? '-')}</td>
                <td>
                  {ed ? (
                    <select value={editing.referred_by ?? ''} onChange={(e) => setEditing({ ...editing, referred_by: e.target.value })}>
                      <option value="">추천인 없음</option>
                      {members.filter((x) => x.active && x.id !== m.id).map((x) => (
                        <option key={x.id} value={x.id}>{x.name} / {x.phone ?? '-'}</option>
                      ))}
                    </select>
                  ) : (
                    members.find((x) => x.id === m.referred_by)?.name ?? '-'
                  )}
                </td>
                <td>{m.active ? 'O' : 'X'}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {ed ? (
                    <>
                      <button onClick={onSaveEdit}>저장</button>
                      <button onClick={() => setEditing(null)}>취소</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing({ id: m.id, name: m.name, phone: m.phone ?? '', memo: m.memo ?? '', referred_by: m.referred_by ?? '' })}>수정</button>
                      <button onClick={() => onDelete(m.id, m.name)}>삭제</button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
