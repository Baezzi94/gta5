import { useEffect, useState } from 'react'
import { createCharge, createMenuSale, CHARGE_AMOUNT } from '../lib/charges'
import { listMenu } from '../lib/menu'
import { createCustomer } from '../lib/customers'
import { isBannedCustomer } from '../lib/bans'
import { businessYmd } from '../lib/week'

const inp = { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #3a2440', background: '#16131f', color: '#fff', boxSizing: 'border-box' }
const rowS = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#1d1930', borderRadius: 10, marginBottom: 8 }
const stepBtn = { width: 40, height: 40, fontSize: 22, fontWeight: 800, borderRadius: 10, border: '1px solid #3a2440', background: '#241a3d', color: '#ece9f5' }

export default function MSell() {
  const date = businessYmd(new Date())
  const [menu, setMenu] = useState([])
  const [nick, setNick] = useState('')
  const [qty, setQty] = useState({}) // 'tc' | menu_item_id -> 수량
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { listMenu().then(setMenu).catch(() => {}) }, [])

  const items = [{ key: 'tc', name: 'TC 입장료', price: CHARGE_AMOUNT.tc }, ...menu.map((m) => ({ key: m.id, name: m.name, price: m.sale_price }))]
  const step = (k, d) => setQty((q) => ({ ...q, [k]: Math.max(0, (q[k] || 0) + d) }))
  const total = items.reduce((s, it) => s + (qty[it.key] || 0) * it.price, 0)
  const count = items.reduce((s, it) => s + (qty[it.key] || 0), 0)

  async function addCharges() {
    if (count === 0) return setErr('수량을 선택하세요.')
    setBusy(true); setErr(''); setMsg('')
    try {
      const n = nick.trim()
      if (n && (await isBannedCustomer({ nickname: n }))) throw new Error(`🚫 밴된 손님(${n})입니다.`)
      const cid = n ? (await createCustomer({ nickname: n, phone: null })).id : null
      const tcN = qty.tc || 0
      for (let i = 0; i < tcN; i++) await createCharge({ date, type: 'tc', amount: CHARGE_AMOUNT.tc, customer_id: cid })
      const lines = menu.filter((m) => (qty[m.id] || 0) > 0).map((m) => ({ menu_item_id: m.id, qty: qty[m.id], sale_price: m.sale_price, cost_price: m.cost_price }))
      if (lines.length) await createMenuSale({ date, customer_id: cid, sold_by: null, lines })
      setMsg('거래 추가 완료 (미수금). 수금은 별도로 처리하세요.')
      setQty({}); setNick('')
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>판매 · 거래 추가 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>미수금으로 기록</span></h2>
      {err && <p style={{ color: 'salmon', fontSize: 13 }}>{err}</p>}
      {msg && <p style={{ color: '#5ee0a0', fontSize: 13 }}>{msg}</p>}
      <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="손님 닉네임(선택)" style={inp} />
      <div style={{ marginTop: 10 }}>
        {items.map((it) => (
          <div key={it.key} style={rowS}>
            <div style={{ flex: 1 }}>{it.name} <span style={{ color: '#9a93b8', fontSize: 12 }}>{(it.price / 10000).toLocaleString()}만</span></div>
            <button onClick={() => step(it.key, -1)} style={stepBtn} disabled={busy}>−</button>
            <div style={{ width: 30, textAlign: 'center', fontWeight: 800, fontSize: 17 }}>{qty[it.key] || 0}</div>
            <button onClick={() => step(it.key, 1)} style={stepBtn} disabled={busy}>＋</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: 14, background: '#16131f', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#9a93b8' }}>합계 ({count}건)</span>
          <b style={{ color: '#ffcf5a', fontSize: 18 }}>{total.toLocaleString()}원</b>
        </div>
        <button disabled={busy || count === 0} onClick={addCharges} style={{ width: '100%', padding: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 'none', background: count === 0 ? '#3a2440' : '#ff5ea0', color: count === 0 ? '#9a93b8' : '#12101a' }}>거래 추가 (미수금)</button>
      </div>
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 8 }}>※ 여기선 거래만 등록(미수금). 수금 처리는 PC/수금탭에서. 대화료·2차는 예약 진행으로.</p>
    </div>
  )
}
