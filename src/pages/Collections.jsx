import { useEffect, useState } from 'react'
import { listByDate, createCharge, createMenuSale, setCollected, deleteCharge, listCollectLogs, CHARGE_AMOUNT, CHARGE_LABEL } from '../lib/charges'
import { createCustomer } from '../lib/customers'
import { isBannedCustomer } from '../lib/bans'
import { listByDate as listAvailByDate } from '../lib/schedule'
import { listByDate as listPayouts, setPaid } from '../lib/payouts'
import { listMembers } from '../lib/members'
import { listMenu } from '../lib/menu'
import { settle, settleAlcohol } from '../lib/settlement'
import { businessYmd } from '../lib/week'
import { useAuth } from '../app/AuthContext'

const man = (won) => `${Math.round(won / 10000)}만`
const won = (n) => `${Math.round(n).toLocaleString()}원`
const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Collections() {
  const { role, memberId } = useAuth()
  const canAdd = role === 'owner' || role === 'staff'
  const [date, setDate] = useState(() => businessYmd(new Date()))
  const [rows, setRows] = useState([])
  const [avail, setAvail] = useState([])
  const [payouts, setPayouts] = useState([])
  const [members, setMembers] = useState([])
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ type: 'tc', nickname: '', princess_id: '' })
  const princesses = members.filter((m) => m.type === 'princess')
  const isHead = !!members.find((m) => m.id === memberId)?.wholesale_owner // 시진핑(총괄)만 true
  const [menu, setMenu] = useState([])
  const [saleCust, setSaleCust] = useState({ nickname: '' })
  const [qty, setQty] = useState({}) // { menu_item_id: 수량 }
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(await listByDate(date))
      setAvail(await listAvailByDate(date))
      setPayouts(await listPayouts(date))
      setLogs(await listCollectLogs()) // RLS로 시진핑만 실제 데이터 받음(그 외 빈 배열)
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    const t = setInterval(load, 12000) // 자동 새로고침(준실시간)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])
  useEffect(() => {
    listMembers().then(setMembers).catch(() => {})
    listMenu().then(setMenu).catch(() => {})
  }, [])

  async function onMenuSale(e) {
    e.preventDefault()
    setError('')
    const lines = menu
      .map((m) => ({ menu_item_id: m.id, qty: Number(qty[m.id] || 0), sale_price: m.sale_price, cost_price: m.cost_price }))
      .filter((l) => l.qty > 0)
    if (lines.length === 0) return setError('판매할 메뉴 수량을 입력하세요.')
    try {
      const nick = saleCust.nickname.trim()
      if (nick && (await isBannedCustomer({ nickname: nick }))) {
        setError(`🚫 밴된 손님입니다. 판매 불가 — 밴 관리에서 해제 후 가능.`)
        return
      }
      let customer_id = null
      if (nick) customer_id = (await createCustomer({ nickname: nick, phone: null })).id
      await createMenuSale({ date, customer_id, sold_by: null, lines })
      setQty({})
      setSaleCust({ nickname: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }
  const saleTotal = menu.reduce((s, m) => s + m.sale_price * Number(qty[m.id] || 0), 0)

  async function onAdd(e) {
    e.preventDefault()
    setError('')
    if (form.type !== 'tc' && !form.princess_id) return setError('대화료·2차는 공주님을 선택해야 합니다. (안 그러면 공주 몫이 누락됩니다)')
    try {
      const nick = form.nickname.trim()
      if (nick && (await isBannedCustomer({ nickname: nick }))) {
        setError(`🚫 밴된 손님입니다. 거래 불가 — 밴 관리에서 해제 후 가능.`)
        return
      }
      let customer_id = null
      if (nick) customer_id = (await createCustomer({ nickname: nick, phone: null })).id
      await createCharge({
        date,
        type: form.type,
        amount: CHARGE_AMOUNT[form.type],
        customer_id,
        princess_id: form.type === 'tc' ? null : form.princess_id || null,
      })
      setForm({ type: 'tc', nickname: '', princess_id: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function act(fn, ...args) {
    setError('')
    try {
      await fn(...args)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  // 노쇼/취소된 예약의 거래는 무효 처리(집계·정산 제외)
  // 취소/노쇼는 무효 처리하되, 이미 수금된 거래는 실제 받은 돈이므로 계속 포함
  const isVoid = (r) => (r.reservation?.status === 'cancelled' || r.reservation?.status === 'no_show') && !r.collected
  const live = rows.filter((r) => !isVoid(r))
  const total = live.reduce((s, r) => s + r.amount, 0)
  const collected = live.filter((r) => r.collected).reduce((s, r) => s + r.amount, 0)
  const outstanding = total - collected
  const uncollectedCount = live.filter((r) => !r.collected).length

  // 정산 (수금완료 기준, 무효 제외)
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))
  const enriched = live
    .filter((r) => r.collected && r.type !== 'item') // 주류는 따로 분배
    .map((c) => ({
      type: c.type,
      amount: c.amount,
      at: c.created_at, // 거래 발생 시각(시간귀속)
      princess_id: c.princess_id,
      customer_id: c.customer_id,
      princess_referred_by: c.princess?.referred_by,
      customer_referred_by: c.customer?.referred_by,
    }))
  // 출근 구간(체크인~퇴근). 거래 시각이 이 구간에 들면 그 거래를 나눠 가짐. 퇴근 안 눌렀으면 계속 출근으로 간주.
  // 운영풀 지분 가중치: 시진핑(wholesale_owner)만 1.2, 그 외(다른 사장 포함) 1.0
  const headOwner = Object.fromEntries(members.map((m) => [m.id, !!m.wholesale_owner]))
  const windows = avail
    .filter((a) => a.checked_in_at)
    .map((a) => ({ id: a.member_id, role: a.member?.type, inAt: a.checked_in_at, outAt: a.checked_out_at, weight: headOwner[a.member_id] ? 1.2 : 1.0 }))
  const settlement = settle(enriched, windows)

  // 주류: 판매 시각 출근자 전원 마진 N빵(도매원가는 각자 사입이라 앱 미처리)
  const itemCharges = live
    .filter((r) => r.collected && r.type === 'item')
    .map((c) => ({ amount: c.amount, cost: c.cost, at: c.created_at }))
  const alcohol = settleAlcohol(itemCharges, windows)

  // 합산
  const combined = {}
  const ensure = (id) => {
    if (!combined[id]) combined[id] = { id, talk: 0, date2: 0, share: 0, referral: 0, recruit: 0, alcohol: 0 }
    return combined[id]
  }
  for (const pm of settlement.perMember) {
    const e = ensure(pm.id)
    e.talk = pm.talk; e.date2 = pm.date2; e.share = pm.share; e.referral = pm.referral; e.recruit = pm.recruit
  }
  for (const [id, amt] of Object.entries(alcohol.per)) ensure(id).alcohol += amt // 주류 마진(N빵)
  const settleRows = Object.values(combined)
    .map((e) => ({ ...e, name: memberMap[e.id]?.name ?? '(삭제됨)', role: memberMap[e.id]?.type, total: e.talk + e.date2 + e.share + e.referral + e.recruit + e.alcohol }))
    .filter((r) => r.total !== 0)
    .sort((a, b) => b.total - a.total)
  const paidMap = Object.fromEntries(payouts.map((p) => [p.member_id, p]))

  async function onTogglePaid(memberId, paid, amount) {
    setError('')
    try {
      await setPaid(date, memberId, paid, amount)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>수금 / 정산</h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={() => setDate(businessYmd(new Date()))}>오늘</button>
      </div>

      {/* 요약 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>총 청구</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{man(total)}</div>
        </div>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>수금 완료</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5ee0a0' }}>{man(collected)}</div>
        </div>
        <div style={{ background: '#16131f', borderRadius: 10, padding: '10px 16px' }}>
          <div style={{ color: '#9a93b8', fontSize: 12 }}>미수금 ({uncollectedCount}건)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: outstanding > 0 ? '#ff5e5e' : '#9a93b8' }}>{man(outstanding)}</div>
        </div>
      </div>

      {/* 거래 추가 */}
      {canAdd && (
        <form onSubmit={onAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 10, background: '#16131f', borderRadius: 10 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="tc">TC(입장료) 5만</option>
            <option value="talk">대화료 25만</option>
            <option value="date2">2차 100만</option>
          </select>
          <input placeholder="손님 닉네임(선택)" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          {form.type !== 'tc' && (
            <select value={form.princess_id} onChange={(e) => setForm({ ...form, princess_id: e.target.value })}>
              <option value="">공주님</option>
              {princesses.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button type="submit">거래 추가</button>
        </form>
      )}

      {/* 주류·메뉴 판매 (선불) */}
      {canAdd && menu.length > 0 && (
        <form onSubmit={onMenuSale} style={{ marginBottom: 16, padding: 12, background: '#16131f', borderRadius: 10 }}>
          <strong>🍾 주류·메뉴 판매</strong>
          <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
            <input placeholder="손님 닉네임(선택)" value={saleCust.nickname} onChange={(e) => setSaleCust({ ...saleCust, nickname: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {menu.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1d1930', borderRadius: 8, padding: '6px 8px' }}>
                <span style={{ flex: 1 }}>{m.name} <span style={{ color: '#9a93b8', fontSize: 12 }}>{man(m.sale_price)}</span></span>
                <input
                  type="number"
                  min="0"
                  value={qty[m.id] || ''}
                  onChange={(e) => setQty({ ...qty, [m.id]: e.target.value })}
                  placeholder="0"
                  style={{ width: 56 }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ color: '#ffcf5a' }}>합계: {man(saleTotal)} ({won(saleTotal)})</strong>
            <button type="submit">판매 등록 (미수금)</button>
          </div>
        </form>
      )}

      {/* 수금현황 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>유형</th><th>손님</th><th>공주님</th><th>금액</th><th>수금</th>{canAdd && <th>처리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const voided = isVoid(r)
            return (
            <tr key={r.id} style={{ borderTop: '1px solid #2c2742', background: voided ? 'transparent' : (r.collected ? 'transparent' : 'rgba(255,94,94,.07)'), opacity: voided ? 0.5 : 1 }}>
              <td>{r.type === 'item' ? `${r.menu_item?.name ?? '메뉴'} ×${r.qty}` : CHARGE_LABEL[r.type]}</td>
              <td>{r.customer?.nickname ?? '-'}</td>
              <td>{r.princess?.name ?? '-'}</td>
              <td style={{ textDecoration: voided ? 'line-through' : 'none' }}>{man(r.amount)}</td>
              <td style={{ fontWeight: 700, color: voided ? '#9a93b8' : (r.collected ? '#5ee0a0' : '#ff5e5e') }}>
                {voided ? '취소됨' : (r.collected ? '수금완료' : '미수금')}
              </td>
              {canAdd && (
                <td style={{ display: 'flex', gap: 4 }}>
                  {!voided && (r.collected
                    ? <button onClick={() => act(setCollected, r.id, false)}>수금취소</button>
                    : <button onClick={() => act(setCollected, r.id, true)}>수금</button>)}
                  {isHead && <button onClick={() => act(deleteCharge, r.id)}>삭제</button>}
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
      </table>

      {/* 정산 대시보드 (수금완료 기준) */}
      <h2 style={{ marginTop: 28 }}>정산 분배 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>(수금완료 기준 · 운영풀 {won(settlement.pool)} · 지분 시진핑1.2 : 그 외 1.0)</span></h2>
      {(settlement.poolUnattributed > 0 || alcohol.marginUnattributed > 0) && (
        <p style={{ background: '#3a1620', border: '1px solid #ff5e7a', color: '#ffb3c1', padding: '8px 12px', borderRadius: 8 }}>
          ⚠️ <b>거래 발생 시각에 출근중이던 사람이 없어 미분배</b>된 금액이 있습니다
          {settlement.poolUnattributed > 0 && <> · 운영풀 {won(settlement.poolUnattributed)}</>}
          {alcohol.marginUnattributed > 0 && <> · 주류마진 {won(alcohol.marginUnattributed)}</>}
          . (해당 시간대 출근 체크인 필요)
        </p>
      )}
      {settleRows.length === 0 ? (
        <p style={{ color: '#9a93b8' }}>수금 완료된 거래가 없습니다. 거래를 "수금" 처리하면 자동 분배됩니다.</p>
      ) : (
        <table>
          <thead>
            <tr style={{ color: '#ffcf5a' }}>
              <th>이름</th><th>역할</th><th>대화료</th><th>2차</th><th>지분</th><th>손님추천</th><th>영입</th><th>주류</th><th>합계</th>{isHead && <th>지급</th>}
            </tr>
          </thead>
          <tbody>
            {settleRows.map((m) => {
              const prow = paidMap[m.id]
              const paid = !!prow?.paid
              const mismatch = paid && prow?.paid_amount != null && prow.paid_amount !== m.total
              return (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{ROLE_LABEL[m.role] ?? m.role ?? '-'}</td>
                  <td>{m.talk ? won(m.talk) : '-'}</td>
                  <td>{m.date2 ? won(m.date2) : '-'}</td>
                  <td>{m.share ? won(m.share) : '-'}</td>
                  <td>{m.referral ? won(m.referral) : '-'}</td>
                  <td>{m.recruit ? won(m.recruit) : '-'}</td>
                  <td>{m.alcohol ? won(m.alcohol) : '-'}</td>
                  <td style={{ fontWeight: 800, color: '#5ee0a0' }}>{won(m.total)}</td>
                  {isHead && (
                    <td>
                      <span style={{ color: paid ? '#5ee0a0' : '#ff6b6b', fontWeight: 700, marginRight: 6 }}>
                        {paid ? '지급완료' : '미지급'}
                      </span>
                      {mismatch && (
                        <span title={`지급 당시 ${won(prow.paid_amount)} → 현재 ${won(m.total)}`} style={{ color: '#ffcf5a', fontSize: 12, marginRight: 6 }}>
                          ⚠️ 지급 {won(prow.paid_amount)}
                        </span>
                      )}
                      {paid
                        ? <button onClick={() => onTogglePaid(m.id, false)}>취소</button>
                        : <button onClick={() => onTogglePaid(m.id, true, m.total)}>지급</button>}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {alcohol.margin > 0 && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#140d1e', border: '1px solid #33253f', borderRadius: 10, fontSize: 13 }}>
          🍾 <b style={{ color: '#ffcf5a' }}>주류 마진</b> {won(alcohol.margin)} — 판매 시각 출근자끼리 균등(N빵) 분배. (도매값은 각자 사입해 본인 매출에서 회수)
        </div>
      )}
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 6 }}>
        ※ 팁은 정산 제외(개인 수령). 지분·주류마진은 출근 시각 기준 자동 분배. 도매값은 각자 자기 돈으로 사입합니다.
      </p>

      {/* 수금/미수금 처리 로그 — 시진핑(총괄)만 열람 */}
      {isHead && (() => {
        const dayLogs = logs.filter((l) => l.charge?.date === date)
        return (
          <div style={{ marginTop: 28 }}>
            <h2>수금 처리 로그 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>(총괄만 열람 · {date})</span></h2>
            {dayLogs.length === 0 ? (
              <p style={{ color: '#9a93b8' }}>이 날짜의 수금 처리 기록이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
                    <th>시각</th><th>처리자</th><th>동작</th><th>거래</th><th>손님</th><th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {dayLogs.map((l) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #2c2742' }}>
                      <td>{new Date(l.at).toLocaleString('ko-KR', { hour12: false })}</td>
                      <td>{l.member?.name ?? '-'}</td>
                      <td style={{ color: l.collected ? '#5ee0a0' : '#ff6b6b', fontWeight: 700 }}>{l.collected ? '수금' : '미수금'}</td>
                      <td>{l.charge ? (CHARGE_LABEL[l.charge.type] ?? l.charge.type) : '-'}</td>
                      <td>{l.charge?.customer?.nickname ?? '-'}</td>
                      <td>{l.charge ? man(l.charge.amount) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })()}
    </div>
  )
}
