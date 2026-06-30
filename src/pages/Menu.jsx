import { useEffect, useState } from 'react'
import { listMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../lib/menu'

const won = (n) => `${Number(n).toLocaleString()}원`
const man = (n) => `${Math.round(n / 10000).toLocaleString()}만`

export default function Menu() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', sale_price: '', cost_price: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setItems(await listMenu())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    const sale = Number(form.sale_price)
    const cost = Number(form.cost_price)
    if (!form.name || Number.isNaN(sale) || Number.isNaN(cost)) return setError('이름·판매가·도매가를 정확히 입력하세요. (원 단위)')
    try {
      await createMenuItem({ name: form.name, sale_price: sale, cost_price: cost })
      setForm({ name: '', sale_price: '', cost_price: '' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onSaveEdit() {
    setError('')
    try {
      await updateMenuItem(editing.id, {
        name: editing.name,
        sale_price: Number(editing.sale_price),
        cost_price: Number(editing.cost_price),
      })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onDelete(id, name) {
    if (!window.confirm(`'${name}' 메뉴를 삭제할까요?`)) return
    setError('')
    try {
      await deleteMenuItem(id)
      load()
    } catch (e) {
      setError('삭제 실패: ' + e.message)
    }
  }

  return (
    <div>
      <h1>메뉴 관리 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>(주류·담배 판매가/도매가 · 사장 전용)</span></h1>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <form onSubmit={onCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 10, background: '#16131f', borderRadius: 10 }}>
        <input placeholder="메뉴명" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="판매가(원)" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} style={{ width: 120 }} required />
        <input type="number" placeholder="도매가(원)" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} style={{ width: 120 }} required />
        <button type="submit">메뉴 추가</button>
        <span style={{ color: '#9a93b8', fontSize: 12, alignSelf: 'center' }}>예: 양주 판매 300000 / 도매 120000</span>
      </form>

      <table>
        <thead>
          <tr style={{ color: '#ffcf5a' }}>
            <th>메뉴</th><th>판매가</th><th>도매가</th><th>마진</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const ed = editing && editing.id === m.id
            return (
              <tr key={m.id}>
                <td>{ed ? <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={{ width: 120 }} /> : m.name}</td>
                <td>{ed ? <input type="number" value={editing.sale_price} onChange={(e) => setEditing({ ...editing, sale_price: e.target.value })} style={{ width: 110 }} /> : `${won(m.sale_price)} (${man(m.sale_price)})`}</td>
                <td>{ed ? <input type="number" value={editing.cost_price} onChange={(e) => setEditing({ ...editing, cost_price: e.target.value })} style={{ width: 110 }} /> : `${won(m.cost_price)} (${man(m.cost_price)})`}</td>
                <td style={{ color: '#5ee0a0' }}>{won(m.sale_price - m.cost_price)}</td>
                <td style={{ display: 'flex', gap: 4 }}>
                  {ed ? (
                    <>
                      <button onClick={onSaveEdit}>저장</button>
                      <button onClick={() => setEditing(null)}>취소</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing({ id: m.id, name: m.name, sale_price: m.sale_price, cost_price: m.cost_price })}>수정</button>
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
