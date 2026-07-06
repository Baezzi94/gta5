import { useEffect, useState } from 'react'
import { listByDate, createCharge, createMenuSale, setCollected, CHARGE_AMOUNT } from '../lib/charges'
import { listMenu } from '../lib/menu'
import { createCustomer } from '../lib/customers'
import { isBannedCustomer } from '../lib/bans'
import { businessYmd } from '../lib/week'

const sellBtn = { padding: '18px 8px', fontSize: 15, borderRadius: 12, border: '1px solid #3a2440', background: '#1d1930', color: '#ece9f5', textAlign: 'center', lineHeight: 1.5 }

export default function MSell() {
  const date = businessYmd(new Date())
  const [menu, setMenu] = useState([])
  const [rows, setRows] = useState([])
  const [nick, setNick] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function load() { try { setRows(await listByDate(date)) } catch (e) { setErr(e.message) } }
  useEffect(() => { listMenu().then(setMenu).catch(() => {}); load() }, [date])

  const collectedTotal = rows.filter((r) => r.collected).reduce((s, r) => s + r.amount, 0)

  async function resolveCustomer() {
    const n = nick.trim()
    if (!n) return null
    if (await isBannedCustomer({ nickname: n })) throw new Error(`🚫 밴된 손님(${n})입니다.`)
    return (await createCustomer({ nickname: n, phone: null })).id
  }

  async function sellTc() {
    setBusy(true); setErr(''); setMsg('')
    try {
      const cid = await resolveCustomer()
      const c = await createCharge({ date, type: 'tc', amount: CHARGE_AMOUNT.tc, customer_id: cid })
      await setCollected(c.id, true)
      setMsg('TC 5만 기록+수금 완료'); setNick(''); await load()
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function sellItem(m) {
    setBusy(true); setErr(''); setMsg('')
    try {
      const cid = await resolveCustomer()
      const data = await createMenuSale({ date, customer_id: cid, sold_by: null, lines: [{ menu_item_id: m.id, qty: 1, sale_price: m.sale_price, cost_price: m.cost_price }] })
      if (data?.[0]) await setCollected(data[0].id, true)
      setMsg(`${m.name} 기록+수금 완료`); setNick(''); await load()
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>빠른 판매 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>탭 = 기록+수금</span></h2>
      {err && <p style={{ color: 'salmon', fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: '#5ee0a0', fontSize: 13 }}>{msg}</p>}
      <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="손님 닉네임(선택)" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #3a2440', background: '#16131f', color: '#fff', marginBottom: 10 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button disabled={busy} onClick={sellTc} style={sellBtn}>TC 입장료<br /><b>5만</b></button>
        {menu.map((m) => (
          <button key={m.id} disabled={busy} onClick={() => sellItem(m)} style={sellBtn}>{m.name}<br /><b>{(m.sale_price / 10000).toLocaleString()}만</b></button>
        ))}
      </div>
      <div style={{ marginTop: 16, color: '#9a93b8' }}>오늘 수금 합계: <b style={{ color: '#5ee0a0' }}>{collectedTotal.toLocaleString()}원</b></div>
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 8 }}>※ 대화료·2차는 예약 탭에서 "진행"으로. 주류 도매값은 각자 사입.</p>
    </div>
  )
}
