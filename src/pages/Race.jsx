import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../app/AuthContext'
import { applyRace, listPublicEntries, listEntriesAdmin, setEntryConfirmed, deleteEntry } from '../lib/race'

const GOLD = '#ffcf5a'
const wrap = { minHeight: '100vh', background: 'radial-gradient(900px 500px at 50% -10%, rgba(255,190,70,.10), transparent 60%), linear-gradient(180deg,#0b0b0d,#050506 60%,#0a0a0c)', color: '#fff', fontFamily: "'Noto Sans KR',sans-serif" }
const inner = { maxWidth: 860, margin: '0 auto', padding: '40px 18px 80px' }
const card = { background: '#111014', border: '1px solid #2a2418', borderRadius: 16, padding: 22, marginBottom: 18 }
const h2 = { fontSize: 18, color: GOLD, letterSpacing: 2, margin: '0 0 14px', fontWeight: 800 }
const inp = { width: '100%', padding: 13, borderRadius: 10, border: '1px solid #3a3324', background: '#0d0c10', color: '#fff', boxSizing: 'border-box', fontSize: 15 }
const label = { display: 'block', fontSize: 13, color: '#a49a86', marginBottom: 6 }
const stripes = { height: 12, background: 'repeating-linear-gradient(45deg,#ffcf5a 0 14px,#0b0b0d 14px 28px)' }
const li = { display: 'flex', gap: 10, marginBottom: 8, lineHeight: 1.6 }
const num = { color: GOLD, fontWeight: 800, flexShrink: 0 }

export default function Race() {
  const { memberId } = useAuth()
  const [isHead, setIsHead] = useState(false)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ nickname: '', phone: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!memberId) { setIsHead(false); return }
    supabase.from('members').select('wholesale_owner').eq('id', memberId).maybeSingle()
      .then(({ data }) => setIsHead(!!data?.wholesale_owner))
      .catch(() => setIsHead(false))
  }, [memberId])

  const load = useCallback(async () => {
    try { setRows(isHead ? await listEntriesAdmin() : await listPublicEntries()) } catch (e) { setErr(e.message) }
  }, [isHead])
  useEffect(() => { load() }, [load])

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await applyRace(form)
      setDone(true); setForm({ nickname: '', phone: '', note: '' }); await load()
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function toggle(r) {
    setBusy(true); setErr('')
    try { await setEntryConfirmed(r.id, !r.confirmed); await load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function remove(r) {
    if (!confirm(`${r.nickname} 신청을 삭제할까요?`)) return
    setBusy(true); setErr('')
    try { await deleteEntry(r.id); await load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const confirmedCount = rows.filter((r) => r.confirmed).length

  return (
    <div style={wrap}>
      <div style={stripes} />
      <div style={inner}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', padding: '30px 0 34px' }}>
          <div style={{ color: GOLD, letterSpacing: 6, fontSize: 13, fontWeight: 700 }}>공주님 클럽 PRESENTS</div>
          <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: 54, margin: '10px 0 6px', lineHeight: 1.1, textShadow: '0 2px 30px rgba(255,190,70,.3)' }}>
            음주운전 <span style={{ color: GOLD }}>레이스</span>
          </h1>
          <div style={{ color: '#b9b2a3' }}>2026. 07. 11 (토) 저녁~밤 · 코스는 추후 안내</div>
        </div>

        {/* 요약 */}
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, textAlign: 'center' }}>
          <div><div style={{ color: '#a49a86', fontSize: 12 }}>참가비</div><div style={{ fontSize: 22, fontWeight: 800 }}>50만원</div><div style={{ color: '#7d7466', fontSize: 11 }}>양주 포함</div></div>
          <div><div style={{ color: '#a49a86', fontSize: 12 }}>제공</div><div style={{ fontSize: 22, fontWeight: 800 }}>양주 1병</div><div style={{ color: '#7d7466', fontSize: 11 }}>50만원 상당</div></div>
          <div><div style={{ color: '#a49a86', fontSize: 12 }}>1등 상금</div><div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>???만원</div><div style={{ color: '#7d7466', fontSize: 11 }}>참가 인원에 따라 상승</div></div>
          <div><div style={{ color: '#a49a86', fontSize: 12 }}>차량</div><div style={{ fontSize: 22, fontWeight: 800 }}>택시만</div><div style={{ color: '#7d7466', fontSize: 11 }}>차종 제한</div></div>
        </div>

        {/* 공지 */}
        <div style={card}>
          <h2 style={h2}>경기 규칙</h2>
          <div style={li}><span style={num}>1.</span><span>출발 전, 제공된 <b>양주 1병을 전부 원샷</b>합니다. 스탭 입회 하에 전원 동시에 진행하며, <b>인증하지 않으면 실격</b>입니다.</span></div>
          <div style={li}><span style={num}>2.</span><span><b>정해진 코스를 먼저 완주</b>하면 우승입니다. 경로와 방법은 자유입니다. <b style={{ color: GOLD }}>코스는 추후 설명드리겠습니다.</b></span></div>
          <div style={li}><span style={num}>3.</span><span>차량은 <b>택시만</b> 사용할 수 있습니다.</span></div>
          <div style={li}><span style={num}>4.</span><span><b style={{ color: '#ff7b7b' }}>즉시 탈락</b> — 사망 후 부활 / EMS에 발견·이송 / 도착 시점에 취기가 풀려 있는 경우 / <b>대리운전</b>(반드시 본인이 직접 운전)</span></div>
          <div style={li}><span style={num}>5.</span><span><b>1등 한 명에게만</b> 상금을 지급합니다.</span></div>
        </div>

        <div style={card}>
          <h2 style={h2}>상금 안내</h2>
          <p style={{ lineHeight: 1.7, margin: 0, color: '#d6d0c4' }}>
            1등 상금은 <b style={{ color: GOLD }}>참가 인원에 따라 변동</b>됩니다.
            <b> 참가자가 많을수록 상금이 올라갑니다.</b> 최종 상금은 접수 마감 후 공지합니다.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>참가비 · 입금</h2>
          <div style={li}><span style={num}>·</span><span>신청 후 <b>시진핑(010-4499-3016)</b>이 개별적으로 연락드립니다.</span></div>
          <div style={li}><span style={num}>·</span><span><b style={{ color: '#ff7b7b' }}>대회 시작 2시간 전까지 참가비가 입금되지 않으면 자동 탈락</b>됩니다.</span></div>
          <div style={li}><span style={num}>·</span><span>참가비 50만원에는 <b>50만원 상당의 양주 1병</b>이 포함되어 있습니다.</span></div>
          <div style={li}><span style={num}>·</span><span>참가 인원이 10명 미만일 경우 일정이 조정될 수 있습니다. 정원 상한은 없습니다.</span></div>
        </div>

        <div style={{ ...card, borderColor: '#4a3a1a' }}>
          <h2 style={h2}>경찰 관련 안내</h2>
          <p style={{ lineHeight: 1.7, margin: 0, color: '#d6d0c4' }}>
            본 이벤트는 <b>치안총감님과 사전 협의</b>를 마쳤습니다. 음주운전 행위 자체는 문제 삼지 않기로 합의되었습니다.<br />
            다만 이를 빙자하여 <b>무고한 시민에게 피해를 주거나 신고가 접수될 경우, 경찰은 정상적으로 대응</b>합니다.
          </p>
        </div>

        {/* 신청 폼 */}
        <div style={{ ...card, border: `1px solid ${GOLD}55` }}>
          <h2 style={h2}>참가 신청</h2>
          {done && <p style={{ color: '#5ee0a0', marginTop: 0 }}>신청이 접수되었습니다. 참가비 안내를 위해 시진핑이 연락드립니다.</p>}
          {err && <p style={{ color: 'salmon', marginTop: 0 }}>{err}</p>}
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={label}>닉네임 *</label>
              <input style={inp} value={form.nickname} maxLength={30} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="게임 내 닉네임" />
            </div>
            <div>
              <label style={label}>게임 전화번호 *</label>
              <input style={inp} value={form.phone} maxLength={30} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
            </div>
            <div>
              <label style={label}>남길 말 (선택)</label>
              <input style={inp} value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="하고 싶은 말" />
            </div>
            <button disabled={busy} type="submit" style={{ padding: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 'none', background: `linear-gradient(90deg,${GOLD},#e8a62f)`, color: '#141007', cursor: 'pointer' }}>
              {busy ? '접수 중…' : '참가 신청하기'}
            </button>
            <span style={{ color: '#7d7466', fontSize: 12 }}>※ 전화번호는 공개되지 않으며, 참가비 안내 목적으로만 사용됩니다.</span>
          </form>
        </div>

        {/* 신청자 리스트 */}
        <div style={card}>
          <h2 style={h2}>참가 신청자</h2>
          <div style={{ display: 'flex', gap: 26, marginBottom: 16 }}>
            <div><span style={{ color: '#a49a86', fontSize: 12 }}>신청</span> <b style={{ fontSize: 24, color: GOLD }}>{rows.length}</b><span style={{ color: '#a49a86' }}>명</span></div>
            <div><span style={{ color: '#a49a86', fontSize: 12 }}>확정</span> <b style={{ fontSize: 24, color: '#5ee0a0' }}>{confirmedCount}</b><span style={{ color: '#a49a86' }}>명</span></div>
          </div>
          {rows.length === 0
            ? <p style={{ color: '#7d7466', margin: 0 }}>아직 신청자가 없습니다. 첫 번째로 신청해보세요.</p>
            : rows.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: '#171519', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ color: '#5c5648', width: 26, fontSize: 13 }}>{i + 1}</span>
                <b style={{ flex: 1 }}>{r.nickname}</b>
                {isHead && <span style={{ color: '#a49a86', fontSize: 13 }}>{r.phone ?? '-'}</span>}
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: r.confirmed ? '#14351f' : '#2a2418', color: r.confirmed ? '#5ee0a0' : '#a49a86' }}>
                  {r.confirmed ? '확정' : '대기'}
                </span>
                {isHead && (
                  <>
                    <button disabled={busy} onClick={() => toggle(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #3a3324', background: r.confirmed ? '#2a2418' : '#14351f', color: '#ece9f5', cursor: 'pointer', fontSize: 13 }}>
                      {r.confirmed ? '확정취소' : '참가확정'}
                    </button>
                    <button disabled={busy} onClick={() => remove(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #4a2424', background: '#2a1818', color: '#ff9a9a', cursor: 'pointer', fontSize: 13 }}>삭제</button>
                  </>
                )}
              </div>
            ))}
          {isHead && <p style={{ color: '#7d7466', fontSize: 12, marginBottom: 0 }}>※ 참가확정 = 참가비 수금 완료. 이 버튼과 전화번호는 시진핑에게만 보입니다.</p>}
        </div>

        <div style={{ textAlign: 'center', color: '#5c5648', fontSize: 12, marginTop: 26 }}>
          공주님 클럽 · 문의 010-4499-3016
        </div>
      </div>
      <div style={stripes} />
    </div>
  )
}
