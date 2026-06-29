import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../app/AuthContext'
import { getMember, updateMember } from '../lib/members'
import { uploadAvatar } from '../lib/storage'

const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Profile() {
  const { memberId, role } = useAuth()
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  async function load() {
    if (!memberId) return
    try {
      setMe(await getMember(memberId))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  async function onPhoto(file) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const url = await uploadAvatar(memberId, file)
      await updateMember(memberId, { profile_photo_url: url })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!memberId) {
    return (
      <div>
        <h1>내 프로필</h1>
        <p style={{ color: '#9a93b8' }}>연결된 멤버 정보가 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>내 프로필</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}
      <div className="card" style={{ maxWidth: 360, display: 'grid', gap: 12, justifyItems: 'center' }}>
        {me?.profile_photo_url ? (
          <img src={me.profile_photo_url} alt="" style={{ width: 150, height: 150, borderRadius: 18, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 150, height: 150, borderRadius: 18, background: '#241a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a93b8' }}>사진 없음</div>
        )}
        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{me?.name}</div>
        <div style={{ color: '#9a93b8' }}>{ROLE_LABEL[role] ?? role} · {me?.phone ?? '-'}</div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files[0])} />
        <button type="submit" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? '업로드 중…' : (me?.profile_photo_url ? '사진 변경' : '사진 등록')}
        </button>
        {role === 'princess' && <p style={{ color: '#9a93b8', fontSize: 12 }}>등록한 사진은 찌라시(홍보물)에 사용됩니다.</p>}
      </div>
    </div>
  )
}
