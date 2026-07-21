import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../app/AuthContext'
import { applyRace, listPublicEntries, listEntriesAdmin, setEntryConfirmed, deleteEntry } from '../lib/race'

// ⬇⬇ 형님이 정해주시면 이 두 줄만 바꾸면 사이트 전체 반영됩니다 (포스터·공지문도 같은 값으로) ⬇⬇
const EVENT_WHEN = '__월 __일 (_) __:__'   // 예: '7월 25일 (토) 22:00'
const HOST_CONTACT = '주최측'              // 예: '블랙아웃 OOO'  (문의 연락 담당)
const HOST_PHONE = '시진핑 010-4499-3016'  // 문의 연락처
// ⬆⬆ ------------------------------------------------------------------------ ⬆⬆

const GOLD = '#ffcf5a'
const RED = '#d0021b'
const wrap = { minHeight: '100vh', background: 'radial-gradient(900px 520px at 50% -10%, rgba(208,2,27,.16), transparent 60%), linear-gradient(180deg,#0a0708,#050405 60%,#08060a)', color: '#fff', fontFamily: "'Noto Sans KR',sans-serif" }
const inner = { maxWidth: 860, margin: '0 auto', padding: '40px 18px 80px' }
const card = { background: '#100d10', border: '1px solid #241d22', borderRadius: 16, padding: 22, marginBottom: 18 }
const h2 = { fontSize: 18, color: GOLD, letterSpacing: 2, margin: '0 0 14px', fontWeight: 800 }
const inp = { width: '100%', padding: 13, borderRadius: 10, border: '1px solid #3a2b30', background: '#0c0a0c', color: '#fff', boxSizing: 'border-box', fontSize: 15 }
const label = { display: 'block', fontSize: 13, color: '#a4969a', marginBottom: 6 }
const stripes = { height: 12, background: 'repeating-linear-gradient(45deg,#d0021b 0 14px,#0a0708 14px 28px)' }
const li = { display: 'flex', gap: 10, marginBottom: 8, lineHeight: 1.6 }
const num = { color: RED, fontWeight: 800, flexShrink: 0 }
const codeS = { background: '#1c1418', border: '1px solid #3a2b30', borderRadius: 5, padding: '1px 6px', color: '#fff' }

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
          <div style={{ color: RED, letterSpacing: 8, fontSize: 14, fontWeight: 800 }}>B L A C K &nbsp; O U T</div>
          <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: 54, margin: '12px 0 6px', lineHeight: 1.1, textShadow: '0 2px 30px rgba(208,2,27,.4)' }}>
            음주운전 <span style={{ color: RED }}>레이스</span>
          </h1>
          <div style={{ display: 'inline-block', marginTop: 6, padding: '6px 16px', border: `1px solid ${GOLD}66`, borderRadius: 999, color: GOLD, fontWeight: 700 }}>
            {EVENT_WHEN} · 코스는 추후 안내
          </div>
        </div>

        {/* 요약 · 상품 */}
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, textAlign: 'center' }}>
          <div><div style={{ color: '#a4969a', fontSize: 12 }}>참가비</div><div style={{ fontSize: 22, fontWeight: 800, color: '#5ee0a0' }}>무료</div><div style={{ color: '#7d6a70', fontSize: 11 }}>양주 제공</div></div>
          <div><div style={{ color: '#a4969a', fontSize: 12 }}>1등</div><div style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>파우치</div><div style={{ color: '#7d6a70', fontSize: 11 }}>약 1,800만 상당</div></div>
          <div><div style={{ color: '#a4969a', fontSize: 12 }}>2등</div><div style={{ fontSize: 20, fontWeight: 800 }}>상어 코스튬</div><div style={{ color: '#7d6a70', fontSize: 11 }}>레어 코스튬</div></div>
          <div><div style={{ color: '#a4969a', fontSize: 12 }}>3등</div><div style={{ fontSize: 20, fontWeight: 800 }}>격려</div><div style={{ color: '#7d6a70', fontSize: 11 }}>참가에 감사를</div></div>
        </div>

        {/* 경기 규칙 */}
        <div style={card}>
          <h2 style={h2}>경기 규칙</h2>
          <div style={li}><span style={num}>1.</span><span>출발 전, 제공된 <b>양주 1병을 전부 원샷</b>합니다. 스탭 입회 하에 전원 동시에 진행하며, <b>인증하지 않으면 실격</b>입니다.</span></div>
          <div style={li}><span style={num}>2.</span><span><b>정해진 코스를 먼저 완주</b>하면 우승입니다. 경로와 방법은 자유입니다. <b style={{ color: GOLD }}>코스는 추후 설명드리겠습니다.</b></span></div>
          <div style={li}><span style={num}>3.</span><span><b style={{ color: '#ff7b7b' }}>즉시 탈락</b> — 사망 후 부활 / EMS에 발견·이송 / 도착 시점에 취기가 풀려 있는 경우 / <b>대리운전</b>(반드시 본인이 직접 운전)</span></div>
          <div style={li}><span style={num}>4.</span><span>순위는 <b>도착 순서</b>대로. 1·2·3등에게 각각 상품을 드립니다.</span></div>
        </div>

        {/* 상품 안내 */}
        <div style={card}>
          <h2 style={h2}>상품 안내</h2>
          <div style={li}><span style={{ ...num, color: GOLD }}>1등</span><span><b style={{ color: GOLD }}>파우치</b> <span style={{ color: '#a4969a' }}>(약 1,800만원 상당)</span></span></div>
          <div style={li}><span style={{ ...num, color: '#d6d0c4' }}>2등</span><span><b>상어 코스튬</b></span></div>
          <div style={li}><span style={{ ...num, color: '#d6d0c4' }}>3등</span><span><b>격려</b> — 도전에 감사드립니다.</span></div>
        </div>

        {/* 참가 안내 */}
        <div style={card}>
          <h2 style={h2}>참가 안내</h2>
          <div style={li}><span style={num}>·</span><span><b style={{ color: '#5ee0a0' }}>참가비는 무료</b>입니다. 양주는 주최측(BLACK OUT)이 제공합니다.</span></div>
          <div style={li}><span style={num}>·</span><span>아래 폼에 <b>닉네임</b>과 <b>인게임 전화번호</b>를 남기면 접수됩니다.</span></div>
          <div style={li}><span style={num}>·</span><span>집결 장소·시간 등 세부 안내는 <b>{HOST_CONTACT}</b>이 개별적으로 연락드립니다.</span></div>
          <div style={li}><span style={num}>·</span><span>정원 상한은 없습니다. 많이 오실수록 판이 커집니다.</span></div>
        </div>

        {/* 신청 폼 */}
        <div style={{ ...card, border: `1px solid ${RED}55` }}>
          <h2 style={h2}>참가 신청</h2>
          {done && <p style={{ color: '#5ee0a0', marginTop: 0 }}>신청이 접수되었습니다. 세부 안내는 주최측이 개별 연락드립니다.</p>}
          {err && <p style={{ color: 'salmon', marginTop: 0 }}>{err}</p>}
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={label}>닉네임 *</label>
              <input style={inp} value={form.nickname} maxLength={30} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="게임 내 닉네임" />
            </div>
            <div>
              <label style={label}>📱 인게임 전화번호 * <span style={{ color: RED }}>(게임 속 휴대폰 번호!)</span></label>
              <input style={inp} value={form.phone} maxLength={30} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="게임 휴대폰에 뜨는 번호" />
              <span style={{ display: 'block', color: '#ff9a9a', fontSize: 12, marginTop: 6 }}>★ 실제 번호·디스코드 아닙니다. <b>게임 안에서 쓰는 전화번호</b>를 적어주세요. 안 그러면 연락이 안 갑니다.</span>
            </div>
            <div>
              <label style={label}>남길 말 (선택)</label>
              <input style={inp} value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="하고 싶은 말" />
            </div>
            <button disabled={busy} type="submit" style={{ padding: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 'none', background: `linear-gradient(90deg,${RED},#8a0512)`, color: '#fff', cursor: 'pointer' }}>
              {busy ? '접수 중…' : '참가 신청하기'}
            </button>
            <span style={{ color: '#7d6a70', fontSize: 12 }}>※ 전화번호는 공개되지 않으며, 이벤트 안내 목적으로만 사용됩니다.</span>
          </form>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #241d22', color: '#a4969a', fontSize: 13, lineHeight: 1.8 }}>
            <b style={{ color: GOLD, letterSpacing: 2, fontSize: 12 }}>접속 경로</b><br />
            <b style={{ color: '#fff' }}>PC</b> — 브라우저에서 <code style={codeS}>gta5-rho.vercel.app/race</code><br />
            <b style={{ color: '#fff' }}>인게임</b> — <code style={codeS}>P</code> 휴대폰 열기 → <code style={codeS}>Browser</code> → 위 주소 입력
          </div>
        </div>

        {/* 신청자 리스트 */}
        <div style={card}>
          <h2 style={h2}>참가 신청자</h2>
          <div style={{ display: 'flex', gap: 26, marginBottom: 16 }}>
            <div><span style={{ color: '#a4969a', fontSize: 12 }}>신청</span> <b style={{ fontSize: 24, color: GOLD }}>{rows.length}</b><span style={{ color: '#a4969a' }}>명</span></div>
            <div><span style={{ color: '#a4969a', fontSize: 12 }}>확정</span> <b style={{ fontSize: 24, color: '#5ee0a0' }}>{confirmedCount}</b><span style={{ color: '#a4969a' }}>명</span></div>
          </div>
          {rows.length === 0
            ? <p style={{ color: '#7d6a70', margin: 0 }}>아직 신청자가 없습니다. 첫 번째로 신청해보세요.</p>
            : rows.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: '#161215', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ color: '#5c4c52', width: 26, fontSize: 13 }}>{i + 1}</span>
                <b style={{ flex: 1 }}>{r.nickname}</b>
                {isHead && <span style={{ color: '#a4969a', fontSize: 13 }}>{r.phone ?? '-'}</span>}
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: r.confirmed ? '#14351f' : '#2a2024', color: r.confirmed ? '#5ee0a0' : '#a4969a' }}>
                  {r.confirmed ? '확정' : '대기'}
                </span>
                {isHead && (
                  <>
                    <button disabled={busy} onClick={() => toggle(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #3a2b30', background: r.confirmed ? '#2a2024' : '#14351f', color: '#ece9f5', cursor: 'pointer', fontSize: 13 }}>
                      {r.confirmed ? '확정취소' : '참가확정'}
                    </button>
                    <button disabled={busy} onClick={() => remove(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #4a2424', background: '#2a1818', color: '#ff9a9a', cursor: 'pointer', fontSize: 13 }}>삭제</button>
                  </>
                )}
              </div>
            ))}
          {isHead && <p style={{ color: '#7d6a70', fontSize: 12, marginBottom: 0 }}>※ 참가확정 = 최종 참가 확정. 이 버튼과 전화번호는 시진핑에게만 보입니다.</p>}
        </div>

        <div style={{ textAlign: 'center', color: '#8a7a80', fontSize: 13, marginTop: 26, lineHeight: 1.7 }}>
          <b style={{ color: RED, letterSpacing: 3 }}>BLACK OUT</b> · 음주운전 레이스<br />
          <span style={{ color: '#a4969a' }}>문의 · {HOST_PHONE}</span>
        </div>
      </div>
      <div style={stripes} />
    </div>
  )
}
