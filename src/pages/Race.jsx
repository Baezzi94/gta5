import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../app/AuthContext'
import { applyRace, listPublicEntries, listEntriesAdmin, setEntryConfirmed, deleteEntry } from '../lib/race'

const EVENT_WHEN = '7월 24일 (금) 오후 10시'   // 확정
const HOST_CONTACT = '공주님 클럽'             // 문의 연락 담당
const HOST_PHONE = '시진핑 010-4499-3016'      // 문의 연락처

const GOLD = '#ffcf5a'
const PINK = '#ff5ea0'
const wrap = { minHeight: '100vh', background: 'radial-gradient(900px 520px at 50% -10%, rgba(255,94,160,.18), transparent 60%), linear-gradient(180deg,#180b1f,#0b0710 60%,#120a17)', color: '#fff', fontFamily: "'Noto Sans KR',sans-serif" }
const inner = { maxWidth: 860, margin: '0 auto', padding: '40px 18px 80px' }
const card = { background: '#140d1e', border: '1px solid #33253f', borderRadius: 16, padding: 22, marginBottom: 18 }
const h2 = { fontSize: 18, color: GOLD, letterSpacing: 2, margin: '0 0 14px', fontWeight: 800 }
const inp = { width: '100%', padding: 13, borderRadius: 10, border: '1px solid #3a2440', background: '#0d0a12', color: '#fff', boxSizing: 'border-box', fontSize: 15 }
const label = { display: 'block', fontSize: 13, color: '#a99bb8', marginBottom: 6 }
const stripes = { height: 12, background: 'repeating-linear-gradient(45deg,#ff5ea0 0 14px,#0b0710 14px 28px)' }
const li = { display: 'flex', gap: 10, marginBottom: 8, lineHeight: 1.6 }
const num = { color: PINK, fontWeight: 800, flexShrink: 0 }
const codeS = { background: '#231732', border: '1px solid #46305a', borderRadius: 5, padding: '1px 6px', color: '#fff' }

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
          <div style={{ color: GOLD, letterSpacing: 6, fontSize: 14, fontWeight: 800 }}>공주님 클럽 배</div>
          <h1 style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: 54, margin: '12px 0 6px', lineHeight: 1.1, textShadow: '0 0 3px #ff9ecb, 0 0 20px #ff2e86, 0 0 44px rgba(255,46,134,.5)' }}>
            음주운전 <span style={{ color: PINK }}>레이스</span>
          </h1>
          <div style={{ display: 'inline-block', marginTop: 6, padding: '6px 16px', border: `1px solid ${GOLD}66`, borderRadius: 999, color: GOLD, fontWeight: 700 }}>
            {EVENT_WHEN} · 코스 1012 → 8206 (서부 고속도로)
          </div>
          <div style={{ color: '#ffd6e8', fontSize: 13, marginTop: 12, fontWeight: 700 }}>🏁 조직·소속 관계없이 <b style={{ color: GOLD }}>누구나 참가 가능</b>합니다</div>
        </div>

        {/* 요약 */}
        <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, textAlign: 'center' }}>
          <div><div style={{ color: '#a99bb8', fontSize: 12 }}>참가비</div><div style={{ fontSize: 22, fontWeight: 800 }}>50만원</div><div style={{ color: '#7d6f8a', fontSize: 11 }}>양주 포함</div></div>
          <div><div style={{ color: '#a99bb8', fontSize: 12 }}>제공</div><div style={{ fontSize: 22, fontWeight: 800, color: '#5ee0a0' }}>양주 1병</div><div style={{ color: '#7d6f8a', fontSize: 11 }}>30만원 상당</div></div>
          <div><div style={{ color: '#a99bb8', fontSize: 12 }}>1등 상금</div><div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>300만원</div><div style={{ color: '#7d6f8a', fontSize: 11 }}>1등 단독 몰아주기</div></div>
          <div><div style={{ color: '#a99bb8', fontSize: 12 }}>시상</div><div style={{ fontSize: 22, fontWeight: 800 }}>1등만</div><div style={{ color: '#7d6f8a', fontSize: 11 }}>2·3등 없음</div></div>
        </div>

        {/* 경기 규칙 */}
        <div style={card}>
          <h2 style={h2}>경기 규칙</h2>
          <div style={li}><span style={num}>1.</span><span>출발 전, 제공된 <b>양주 1병을 전부 원샷</b>합니다. 스탭 입회 하에 전원 동시에 진행하며, <b>인증하지 않으면 실격</b>입니다.</span></div>
          <div style={li}><span style={num}>2.</span><span>코스는 <b style={{ color: GOLD }}>1012 → 8206 (서부 고속도로)</b>입니다. <b>반드시 지정된 코스로만 주행</b>해야 하며, 먼저 도착하는 분이 우승입니다.</span></div>
          <div style={li}><span style={num}>3.</span><span><b style={{ color: '#ff7b7b' }}>즉시 탈락</b> — 사망 후 부활 / EMS에 발견·이송 / 도착 시점에 취기가 풀려 있는 경우 / <b>대리운전</b>(반드시 본인이 직접 운전)</span></div>
          <div style={li}><span style={num}>4.</span><span><b>가장 먼저 도착한 1등 한 명에게만</b> 상금 <b style={{ color: GOLD }}>300만원</b>을 드립니다. (2·3등 시상 없음)</span></div>
        </div>

        {/* 코스 · 경찰 협조 안내 */}
        <div style={{ ...card, borderColor: '#5a4a1e' }}>
          <h2 style={h2}>코스 · 경찰 협조 안내</h2>
          <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>
            <div style={{ color: '#a99bb8', fontSize: 12, letterSpacing: 3 }}>C O U R S E</div>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: 34, color: GOLD, lineHeight: 1.3 }}>1012 → 8206</div>
            <div style={{ color: '#d6cbe0', fontSize: 14, fontWeight: 700 }}>서부 고속도로</div>
          </div>
          <div style={li}><span style={num}>·</span><span>본 코스 구간은 <b>행정처리비용 납부가 완료</b>되어, <b style={{ color: '#5ee0a0' }}>경찰 지원 하에 안전하게 진행</b>됩니다.</span></div>
          <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,123,123,.08)', border: '1px solid #6a2a2a', borderRadius: 10, lineHeight: 1.7 }}>
            <b style={{ color: '#ff7b7b' }}>⚠ 지정 코스를 이탈할 경우</b>, 해당 구간에서의 <b>음주운전은 범법행위</b>입니다.<br />
            <span style={{ color: '#d6cbe0' }}>이 경우 주최측은 <b style={{ color: '#ff9a9a' }}>법적인 책임을 지원해드릴 수 없습니다.</b> 반드시 지정 코스로만 주행해주세요.</span>
          </div>
        </div>

        {/* 상금 안내 */}
        <div style={card}>
          <h2 style={h2}>상금 안내</h2>
          <div style={{ textAlign: 'center', padding: '6px 0 10px' }}>
            <div style={{ color: '#a99bb8', fontSize: 13, letterSpacing: 2 }}>1 S T &nbsp; P R I Z E</div>
            <div style={{ fontFamily: "'Black Han Sans',sans-serif", fontSize: 46, color: GOLD, lineHeight: 1.2, textShadow: '0 0 24px rgba(255,207,90,.35)' }}>300만원</div>
            <div style={{ color: '#d6cbe0', fontSize: 13 }}>단독 우승자 몰아주기</div>
          </div>
          <div style={li}><span style={num}>·</span><span>상금은 <b>1등 한 명에게 전액</b> 지급됩니다. 2·3등 시상은 없습니다.</span></div>
        </div>

        {/* 참가 안내 */}
        <div style={card}>
          <h2 style={h2}>참가 안내</h2>
          <div style={li}><span style={num}>·</span><span><b style={{ color: GOLD }}>조직·소속 관계없이 누구나</b> 참가하실 수 있습니다.</span></div>
          <div style={li}><span style={num}>·</span><span>참가비는 <b>50만원</b>입니다. 참가비에는 <b style={{ color: '#5ee0a0' }}>30만원 상당의 양주 1병</b>이 포함되어 있습니다.</span></div>
          <div style={li}><span style={num}>·</span><span>아래 폼에 <b>닉네임</b>과 <b>인게임 전화번호</b>를 남기면 접수됩니다.</span></div>
          <div style={li}><span style={num}>·</span><span>신청 후 <b>{HOST_CONTACT}</b>에서 참가비 입금 안내와 집결 장소·시간을 개별적으로 연락드립니다.</span></div>
          <div style={li}><span style={num}>·</span><span><b style={{ color: '#ff7b7b' }}>대회 시작 전까지 참가비가 입금되지 않으면 참가가 취소</b>됩니다.</span></div>
          <div style={li}><span style={num}>·</span><span>정원 상한은 없습니다. 많이 오실수록 판이 커집니다.</span></div>
          <div style={li}><span style={num}>·</span><span><b style={{ color: GOLD }}>참가 인원에 따라 일정(시작 시간·날짜)이 조정될 수 있습니다.</b> 확정 시 개별 안내드립니다.</span></div>
        </div>

        {/* 신청 폼 */}
        <div style={{ ...card, border: `1px solid ${PINK}55` }}>
          <h2 style={h2}>참가 신청</h2>
          {done && <p style={{ color: '#5ee0a0', marginTop: 0 }}>신청이 접수되었습니다. 세부 안내는 주최측이 개별 연락드립니다.</p>}
          {err && <p style={{ color: 'salmon', marginTop: 0 }}>{err}</p>}
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={label}>닉네임 *</label>
              <input style={inp} value={form.nickname} maxLength={30} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="게임 내 닉네임" />
            </div>
            <div>
              <label style={label}>📱 인게임 전화번호 * <span style={{ color: PINK }}>(게임 속 휴대폰 번호!)</span></label>
              <input style={inp} value={form.phone} maxLength={30} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="게임 휴대폰에 뜨는 번호" />
              <span style={{ display: 'block', color: '#ff9a9a', fontSize: 12, marginTop: 6 }}>★ 실제 번호·디스코드 아닙니다. <b>게임 안에서 쓰는 전화번호</b>를 적어주세요. 안 그러면 연락이 안 갑니다.</span>
            </div>
            <div>
              <label style={label}>남길 말 (선택)</label>
              <input style={inp} value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="하고 싶은 말" />
            </div>
            <button disabled={busy} type="submit" style={{ padding: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 'none', background: `linear-gradient(90deg,${PINK},${GOLD})`, color: '#12101a', cursor: 'pointer' }}>
              {busy ? '접수 중…' : '참가 신청하기'}
            </button>
            <span style={{ color: '#7d6f8a', fontSize: 12 }}>※ 전화번호는 공개되지 않으며, 이벤트 안내 목적으로만 사용됩니다.</span>
          </form>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #33253f', color: '#a99bb8', fontSize: 13, lineHeight: 1.8 }}>
            <b style={{ color: GOLD, letterSpacing: 2, fontSize: 12 }}>접속 경로</b><br />
            <b style={{ color: '#fff' }}>PC</b> — 브라우저에서 <code style={codeS}>gta5-rho.vercel.app/race</code><br />
            <b style={{ color: '#fff' }}>인게임</b> — <code style={codeS}>P</code> 휴대폰 열기 → <code style={codeS}>Browser</code> → 위 주소 입력
          </div>
        </div>

        {/* 신청자 리스트 */}
        <div style={card}>
          <h2 style={h2}>참가 신청자</h2>
          <div style={{ display: 'flex', gap: 26, marginBottom: 16 }}>
            <div><span style={{ color: '#a99bb8', fontSize: 12 }}>신청</span> <b style={{ fontSize: 24, color: GOLD }}>{rows.length}</b><span style={{ color: '#a99bb8' }}>명</span></div>
            <div><span style={{ color: '#a99bb8', fontSize: 12 }}>확정</span> <b style={{ fontSize: 24, color: '#5ee0a0' }}>{confirmedCount}</b><span style={{ color: '#a99bb8' }}>명</span></div>
          </div>
          {rows.length === 0
            ? <p style={{ color: '#7d6f8a', margin: 0 }}>아직 신청자가 없습니다. 첫 번째로 신청해보세요.</p>
            : rows.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: '#1b1229', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ color: '#5c4c68', width: 26, fontSize: 13 }}>{i + 1}</span>
                <b style={{ flex: 1 }}>{r.nickname}</b>
                {isHead && <span style={{ color: '#a99bb8', fontSize: 13 }}>{r.phone ?? '-'}</span>}
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: r.confirmed ? '#14351f' : '#2a2038', color: r.confirmed ? '#5ee0a0' : '#a99bb8' }}>
                  {r.confirmed ? '확정' : '대기'}
                </span>
                {isHead && (
                  <>
                    <button disabled={busy} onClick={() => toggle(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #3a2440', background: r.confirmed ? '#2a2038' : '#14351f', color: '#ece9f5', cursor: 'pointer', fontSize: 13 }}>
                      {r.confirmed ? '확정취소' : '참가확정'}
                    </button>
                    <button disabled={busy} onClick={() => remove(r)} style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid #4a2424', background: '#2a1818', color: '#ff9a9a', cursor: 'pointer', fontSize: 13 }}>삭제</button>
                  </>
                )}
              </div>
            ))}
          {isHead && <p style={{ color: '#7d6f8a', fontSize: 12, marginBottom: 0 }}>※ 참가확정 = 참가비 입금 완료. 이 버튼과 전화번호는 시진핑에게만 보입니다.</p>}
        </div>

        <div style={{ textAlign: 'center', color: '#8a7d96', fontSize: 13, marginTop: 26, lineHeight: 1.7 }}>
          <b style={{ color: PINK, letterSpacing: 2 }}>공주님 클럽 배</b> · 음주운전 레이스<br />
          <span style={{ color: '#a99bb8' }}>📍 7219 바하마 마마스 클럽 · 문의 {HOST_PHONE}</span>
        </div>
      </div>
      <div style={stripes} />
    </div>
  )
}
