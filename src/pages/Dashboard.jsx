import { useEffect, useState } from 'react'
import { listRange, CHARGE_LABEL } from '../lib/charges'
import { listRange as listAvailRange } from '../lib/schedule'
import { listMembers } from '../lib/members'
import { settle, settleAlcohol } from '../lib/settlement'
import { businessYmd, addDays } from '../lib/week'
import { toCsv, downloadCsv } from '../lib/csv'

const man = (won) => `${Math.round(won / 10000).toLocaleString()}만`
const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Dashboard() {
  const [from, setFrom] = useState(() => businessYmd(addDays(new Date(), -6)))
  const [to, setTo] = useState(() => businessYmd(new Date()))
  const [charges, setCharges] = useState([])
  const [avail, setAvail] = useState([])
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setCharges(await listRange(from, to))
      setAvail(await listAvailRange(from, to))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 15000) // 자동 새로고침(준실시간)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])
  useEffect(() => {
    listMembers().then(setMembers).catch(() => {})
  }, [])

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))
  const isVoid = (c) => (c.reservation?.status === 'cancelled' || c.reservation?.status === 'no_show') && !c.collected
  const collected = charges.filter((c) => c.collected && !isVoid(c))

  // KPI
  const totalCollected = collected.reduce((s, c) => s + c.amount, 0)
  const outstanding = charges.filter((c) => !c.collected && !isVoid(c)).reduce((s, c) => s + c.amount, 0)
  const opDays = new Set(collected.map((c) => c.date)).size

  // 일별 매출
  const dailyRev = {}
  for (const c of collected) dailyRev[c.date] = (dailyRev[c.date] || 0) + c.amount
  const dailyRows = Object.entries(dailyRev).sort((a, b) => a[0].localeCompare(b[0]))
  const maxRev = Math.max(1, ...dailyRows.map(([, v]) => v))

  // 인원별 정산 합계 (일별 settle 누적)
  const enrich = (c) => ({
    type: c.type,
    amount: c.amount,
    at: c.created_at,
    princess_id: c.princess_id,
    customer_id: c.customer_id,
    princess_referred_by: c.princess?.referred_by,
    customer_referred_by: c.customer?.referred_by,
  })
  const acc = {}
  for (const d of [...new Set(collected.map((c) => c.date))]) {
    const windows = avail
      .filter((a) => a.date === d && a.checked_in_at)
      .map((a) => ({ id: a.member_id, role: a.member?.type, inAt: a.checked_in_at, outAt: a.checked_out_at }))
    const res = settle(collected.filter((c) => c.date === d && c.type !== 'item').map(enrich), windows)
    const ensure = (id) => (acc[id] = acc[id] || { talk: 0, date2: 0, share: 0, referral: 0, recruit: 0, alcohol: 0, total: 0 })
    for (const pm of res.perMember) {
      const a = ensure(pm.id)
      a.talk += pm.talk; a.date2 += pm.date2; a.share += pm.share; a.referral += pm.referral; a.recruit += pm.recruit; a.total += pm.total
    }
    // 주류 마진(판매 시각 출근자 N빵). 도매값은 각자 사입이라 앱에서 안 건드림.
    const alc = settleAlcohol(collected.filter((c) => c.date === d && c.type === 'item').map((c) => ({ amount: c.amount, cost: c.cost, at: c.created_at })), windows)
    for (const [id, amt] of Object.entries(alc.per)) { const a = ensure(id); a.alcohol += amt; a.total += amt }
  }
  const memberRows = Object.entries(acc)
    .map(([id, a]) => ({ id, ...a, name: memberMap[id]?.name ?? '(삭제됨)', role: memberMap[id]?.type }))
    .filter((m) => m.total !== 0)
    .sort((a, b) => b.total - a.total)

  const princessRank = memberRows.filter((m) => m.role === 'princess').map((m) => ({ ...m, earn: m.talk + m.date2 })).sort((a, b) => b.earn - a.earn)
  const referrerRank = memberRows.map((m) => ({ ...m, ref: m.referral + m.recruit })).filter((m) => m.ref > 0).sort((a, b) => b.ref - a.ref)

  function exportCharges() {
    downloadCsv(`거래내역_${from}_${to}.csv`, toCsv(charges, [
      { label: '날짜', value: 'date' },
      { label: '유형', value: (r) => CHARGE_LABEL[r.type] ?? r.type },
      { label: '손님', value: (r) => r.customer?.nickname ?? '' },
      { label: '공주님', value: (r) => r.princess?.name ?? '' },
      { label: '금액(원)', value: 'amount' },
      { label: '수금', value: (r) => (r.collected ? '완료' : '미수금') },
      { label: '수금시각', value: (r) => r.collected_at ?? '' },
    ]))
  }
  function exportSettlement() {
    downloadCsv(`정산합계_${from}_${to}.csv`, toCsv(memberRows, [
      { label: '이름', value: 'name' },
      { label: '역할', value: (r) => ROLE_LABEL[r.role] ?? r.role ?? '' },
      { label: '대화료', value: 'talk' },
      { label: '2차', value: 'date2' },
      { label: '지분', value: 'share' },
      { label: '추천', value: 'referral' },
      { label: '영입', value: 'recruit' },
      { label: '주류', value: 'alcohol' },
      { label: '합계(원)', value: 'total' },
    ]))
  }

  const Bar = ({ value, max, color }) => (
    <div style={{ background: '#0a0810', borderRadius: 6, height: 16, flex: 1 }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 6 }} />
    </div>
  )

  return (
    <div>
      <h1>대시보드</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /> ~
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={() => { setFrom(businessYmd(addDays(new Date(), -6))); setTo(businessYmd(new Date())) }}>최근 7일</button>
        <button onClick={() => { setFrom(businessYmd(addDays(new Date(), -29))); setTo(businessYmd(new Date())) }}>최근 30일</button>
        <span style={{ flex: 1 }} />
        <button onClick={exportCharges}>거래내역 CSV</button>
        <button onClick={exportSettlement}>정산합계 CSV</button>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        <div className="card"><div style={{ color: '#9a93b8', fontSize: 12 }}>총 수금</div><div style={{ fontSize: 24, fontWeight: 800, color: '#5ee0a0' }}>{man(totalCollected)}</div></div>
        <div className="card"><div style={{ color: '#9a93b8', fontSize: 12 }}>미수금</div><div style={{ fontSize: 24, fontWeight: 800, color: outstanding > 0 ? '#ff6b6b' : '#9a93b8' }}>{man(outstanding)}</div></div>
        <div className="card"><div style={{ color: '#9a93b8', fontSize: 12 }}>거래 건수</div><div style={{ fontSize: 24, fontWeight: 800 }}>{collected.length}건</div></div>
        <div className="card"><div style={{ color: '#9a93b8', fontSize: 12 }}>운영일수</div><div style={{ fontSize: 24, fontWeight: 800 }}>{opDays}일</div></div>
      </div>

      {/* 일별 매출 */}
      <h2>일별 매출 (수금완료)</h2>
      {dailyRows.length === 0 ? <p style={{ color: '#9a93b8' }}>수금 내역이 없습니다.</p> : (
        <div style={{ display: 'grid', gap: 6, maxWidth: 640, marginBottom: 22 }}>
          {dailyRows.map(([d, v]) => (
            <div key={d} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 90, color: '#9a93b8', fontSize: 12 }}>{d.slice(5)}</span>
              <Bar value={v} max={maxRev} color="linear-gradient(90deg,#ff5ea0,#ffcf5a)" />
              <span style={{ width: 70, textAlign: 'right' }}>{man(v)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* 공주 수익 랭킹 */}
        <div>
          <h2>👑 공주님 수익 랭킹</h2>
          <table>
            <thead><tr><th>순위</th><th>공주님</th><th>수익(대화+2차)</th></tr></thead>
            <tbody>
              {princessRank.map((m, i) => (
                <tr key={m.id}><td>{i + 1}</td><td>{m.name}</td><td style={{ fontWeight: 700 }}>{man(m.earn)}</td></tr>
              ))}
              {princessRank.length === 0 && <tr><td colSpan={3} style={{ color: '#9a93b8' }}>없음</td></tr>}
            </tbody>
          </table>
        </div>

        {/* 추천 실적 랭킹 */}
        <div>
          <h2>📣 추천/영입 실적</h2>
          <table>
            <thead><tr><th>순위</th><th>이름</th><th>역할</th><th>실적</th></tr></thead>
            <tbody>
              {referrerRank.map((m, i) => (
                <tr key={m.id}><td>{i + 1}</td><td>{m.name}</td><td>{ROLE_LABEL[m.role] ?? m.role}</td><td style={{ fontWeight: 700 }}>{man(m.ref)}</td></tr>
              ))}
              {referrerRank.length === 0 && <tr><td colSpan={4} style={{ color: '#9a93b8' }}>없음</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인원별 정산 합계 */}
      <h2 style={{ marginTop: 22 }}>인원별 정산 합계 (기간)</h2>
      <table>
        <thead><tr><th>이름</th><th>역할</th><th>대화료</th><th>2차</th><th>지분</th><th>추천</th><th>영입</th><th>주류</th><th>합계</th></tr></thead>
        <tbody>
          {memberRows.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td><td>{ROLE_LABEL[m.role] ?? m.role ?? '-'}</td>
              <td>{m.talk ? man(m.talk) : '-'}</td><td>{m.date2 ? man(m.date2) : '-'}</td>
              <td>{m.share ? man(m.share) : '-'}</td><td>{m.referral ? man(m.referral) : '-'}</td>
              <td>{m.recruit ? man(m.recruit) : '-'}</td>
              <td>{m.alcohol ? man(m.alcohol) : '-'}</td>
              <td style={{ fontWeight: 800, color: '#5ee0a0' }}>{man(m.total)}</td>
            </tr>
          ))}
          {memberRows.length === 0 && <tr><td colSpan={9} style={{ color: '#9a93b8' }}>수금 완료된 거래가 없습니다.</td></tr>}
        </tbody>
      </table>
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 6 }}>※ 수금완료 기준 · 일별 정산 합산. 팁 제외.</p>
    </div>
  )
}
