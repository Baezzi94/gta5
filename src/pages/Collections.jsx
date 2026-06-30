import { useEffect, useState } from 'react'
import { listByDate, createCharge, setCollected, deleteCharge, CHARGE_AMOUNT, CHARGE_LABEL } from '../lib/charges'
import { findOrCreateByPhone } from '../lib/customers'
import { isBanned } from '../lib/bans'
import { listByDate as listAvailByDate } from '../lib/schedule'
import { listByDate as listPayouts, setPaid } from '../lib/payouts'
import { listMembers } from '../lib/members'
import { settle } from '../lib/settlement'
import { ymd } from '../lib/week'
import { useAuth } from '../app/AuthContext'

const man = (won) => `${Math.round(won / 10000)}만`
const won = (n) => `${Math.round(n).toLocaleString()}원`
const ROLE_LABEL = { owner: '사장', staff: '운영스탭', promoter: '삐끼', princess: '공주님' }

export default function Collections() {
  const { role } = useAuth()
  const isOwner = role === 'owner'
  const canAdd = role === 'owner' || role === 'staff'
  const [date, setDate] = useState(() => ymd(new Date()))
  const [rows, setRows] = useState([])
  const [avail, setAvail] = useState([])
  const [payouts, setPayouts] = useState([])
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ type: 'tc', phone: '', nickname: '', princess_id: '' })
  const princesses = members.filter((m) => m.type === 'princess')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(await listByDate(date))
      setAvail(await listAvailByDate(date))
      setPayouts(await listPayouts(date))
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])
  useEffect(() => {
    listMembers().then(setMembers).catch(() => {})
  }, [])

  async function onAdd(e) {
    e.preventDefault()
    setError('')
    try {
      if (form.phone && (await isBanned(form.phone))) {
        setError(`🚫 밴된 번호(${form.phone})입니다. 거래 불가 — 밴 관리에서 해제 후 가능.`)
        return
      }
      let customer_id = null
      if (form.phone) {
        const c = await findOrCreateByPhone({ phone: form.phone, nickname: form.nickname })
        customer_id = c.id
      }
      await createCharge({
        date,
        type: form.type,
        amount: CHARGE_AMOUNT[form.type],
        customer_id,
        princess_id: form.type === 'tc' ? null : form.princess_id || null,
      })
      setForm({ type: 'tc', phone: '', nickname: '', princess_id: '' })
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
  const isVoid = (r) => r.reservation?.status === 'cancelled' || r.reservation?.status === 'no_show'
  const live = rows.filter((r) => !isVoid(r))
  const total = live.reduce((s, r) => s + r.amount, 0)
  const collected = live.filter((r) => r.collected).reduce((s, r) => s + r.amount, 0)
  const outstanding = total - collected
  const uncollectedCount = live.filter((r) => !r.collected).length

  // 정산 (수금완료 기준, 무효 제외)
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))
  const enriched = live
    .filter((r) => r.collected)
    .map((c) => ({
      type: c.type,
      amount: c.amount,
      princess_id: c.princess_id,
      customer_id: c.customer_id,
      princess_referred_by: c.princess?.referred_by,
      customer_referred_by: c.customer?.referred_by,
    }))
  // 그날 출근(체크인)한 스탭만 지분. 사장은 항상 포함.
  const staffInIds = new Set(avail.filter((a) => a.checked_in_at && a.member?.type === 'staff').map((a) => a.member_id))
  const shareMembers = members
    .filter((m) => m.active && (m.type === 'owner' || (m.type === 'staff' && staffInIds.has(m.id))))
    .map((m) => ({ id: m.id, role: m.type }))
  const settlement = settle(enriched, shareMembers)
  const settleRows = settlement.perMember
    .map((pm) => ({ ...pm, name: memberMap[pm.id]?.name ?? '(삭제됨)', role: memberMap[pm.id]?.type }))
    .filter((pm) => pm.total !== 0)
    .sort((a, b) => b.total - a.total)
  const paidMap = Object.fromEntries(payouts.map((p) => [p.member_id, p.paid]))

  async function onTogglePaid(memberId, paid) {
    setError('')
    try {
      await setPaid(date, memberId, paid)
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
        <button onClick={() => setDate(ymd(new Date()))}>오늘</button>
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
          <input placeholder="손님 전화" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="닉" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
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

      {/* 수금현황 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#ffcf5a' }}>
            <th>유형</th><th>손님</th><th>공주님</th><th>금액</th><th>수금</th>{isOwner && <th>처리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const voided = isVoid(r)
            return (
            <tr key={r.id} style={{ borderTop: '1px solid #2c2742', background: voided ? 'transparent' : (r.collected ? 'transparent' : 'rgba(255,94,94,.07)'), opacity: voided ? 0.5 : 1 }}>
              <td>{CHARGE_LABEL[r.type]}</td>
              <td>{r.customer?.nickname ?? '-'}</td>
              <td>{r.princess?.name ?? '-'}</td>
              <td style={{ textDecoration: voided ? 'line-through' : 'none' }}>{man(r.amount)}</td>
              <td style={{ fontWeight: 700, color: voided ? '#9a93b8' : (r.collected ? '#5ee0a0' : '#ff5e5e') }}>
                {voided ? '취소됨' : (r.collected ? '수금완료' : '미수금')}
              </td>
              {isOwner && (
                <td style={{ display: 'flex', gap: 4 }}>
                  {!voided && (r.collected
                    ? <button onClick={() => act(setCollected, r.id, false)}>수금취소</button>
                    : <button onClick={() => act(setCollected, r.id, true)}>수금</button>)}
                  <button onClick={() => act(deleteCharge, r.id)}>삭제</button>
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
      </table>

      {/* 정산 대시보드 (수금완료 기준) */}
      <h2 style={{ marginTop: 28 }}>정산 분배 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>(수금완료 기준 · 운영풀 {won(settlement.pool)} · 지분 사장1.2 : 스탭1.0)</span></h2>
      {settleRows.length === 0 ? (
        <p style={{ color: '#9a93b8' }}>수금 완료된 거래가 없습니다. 거래를 "수금" 처리하면 자동 분배됩니다.</p>
      ) : (
        <table>
          <thead>
            <tr style={{ color: '#ffcf5a' }}>
              <th>이름</th><th>역할</th><th>대화료</th><th>2차</th><th>지분</th><th>손님추천</th><th>영입</th><th>합계</th><th>지급</th>
            </tr>
          </thead>
          <tbody>
            {settleRows.map((m) => {
              const paid = !!paidMap[m.id]
              return (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{ROLE_LABEL[m.role] ?? m.role ?? '-'}</td>
                  <td>{m.talk ? won(m.talk) : '-'}</td>
                  <td>{m.date2 ? won(m.date2) : '-'}</td>
                  <td>{m.share ? won(m.share) : '-'}</td>
                  <td>{m.referral ? won(m.referral) : '-'}</td>
                  <td>{m.recruit ? won(m.recruit) : '-'}</td>
                  <td style={{ fontWeight: 800, color: '#5ee0a0' }}>{won(m.total)}</td>
                  <td>
                    <span style={{ color: paid ? '#5ee0a0' : '#ff6b6b', fontWeight: 700, marginRight: 6 }}>
                      {paid ? '지급완료' : '미지급'}
                    </span>
                    {isOwner && (
                      paid
                        ? <button onClick={() => onTogglePaid(m.id, false)}>취소</button>
                        : <button onClick={() => onTogglePaid(m.id, true)}>지급</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 6 }}>
        ※ 팁은 정산 제외(개인 수령). 지분은 활성 사장·운영스탭 기준 자동 분배. 수금 처리할수록 실시간 반영됩니다.
      </p>
    </div>
  )
}
