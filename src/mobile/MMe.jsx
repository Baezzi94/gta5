import { useEffect, useState } from 'react'
import { useAuth } from '../app/AuthContext'
import { listByDate } from '../lib/charges'
import { listByDate as listAvail } from '../lib/schedule'
import { listMembers } from '../lib/members'
import { settle, settleAlcohol } from '../lib/settlement'
import { businessYmd } from '../lib/week'

const won = (n) => `${Math.round(n).toLocaleString()}원`

export default function MMe() {
  const { memberId } = useAuth()
  const date = businessYmd(new Date())
  const [charges, setCharges] = useState([])
  const [avail, setAvail] = useState([])
  const [members, setMembers] = useState([])
  const [err, setErr] = useState('')

  async function load() { try { setCharges(await listByDate(date)); setAvail(await listAvail(date)) } catch (e) { setErr(e.message) } }
  useEffect(() => {
    listMembers().then(setMembers).catch(() => {})
    load(); const t = setInterval(load, 15000); return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const isVoid = (c) => (c.reservation?.status === 'cancelled' || c.reservation?.status === 'no_show') && !c.collected
  const live = charges.filter((c) => !isVoid(c))
  const headOwner = Object.fromEntries(members.map((m) => [m.id, !!m.wholesale_owner]))
  const windows = avail.filter((a) => a.checked_in_at).map((a) => ({ id: a.member_id, role: a.member?.type, inAt: a.checked_in_at, outAt: a.checked_out_at, weight: headOwner[a.member_id] ? 1.2 : 1.0 }))
  const enriched = live.filter((r) => r.collected && r.type !== 'item').map((c) => ({ type: c.type, amount: c.amount, at: c.created_at, princess_id: c.princess_id, customer_id: c.customer_id, princess_referred_by: c.princess?.referred_by, customer_referred_by: c.customer?.referred_by }))
  const s = settle(enriched, windows)
  const items = live.filter((r) => r.collected && r.type === 'item').map((c) => ({ amount: c.amount, cost: c.cost, at: c.created_at }))
  const alc = settleAlcohol(items, windows)
  const pm = s.perMember.find((m) => m.id === memberId) || { talk: 0, date2: 0, share: 0, referral: 0, recruit: 0 }
  const alcMine = alc.per[memberId] || 0
  const total = (pm.talk || 0) + (pm.date2 || 0) + (pm.share || 0) + (pm.referral || 0) + (pm.recruit || 0) + alcMine
  const view = [['대화료', pm.talk], ['2차', pm.date2], ['운영풀 지분', pm.share], ['손님추천', pm.referral], ['공주영입', pm.recruit], ['주류 마진', alcMine]].filter(([, v]) => v)

  // 오늘 내 수금 매출(참고)
  const myCollected = live.filter((c) => c.collected).reduce((s2, c) => s2 + c.amount, 0)

  if (!memberId) return <p style={{ color: '#9a93b8' }}>연결된 멤버가 없습니다.</p>
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>오늘 내 정산 <span style={{ color: '#9a93b8', fontSize: 13, fontWeight: 400 }}>{date}</span></h2>
      {err && <p style={{ color: 'salmon', fontSize: 13 }}>{err}</p>}
      <div style={{ background: '#16131f', borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ color: '#9a93b8', fontSize: 13 }}>오늘 내 정산액 (수금완료 기준)</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#5ee0a0' }}>{won(total)}</div>
      </div>
      {view.length === 0
        ? <p style={{ color: '#9a93b8' }}>아직 수금된 내 몫이 없습니다. (출근+수금 완료돼야 잡힘)</p>
        : view.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#16131f', borderRadius: 8, marginBottom: 6 }}>
            <span style={{ color: '#9a93b8' }}>{k}</span><b>{won(v)}</b>
          </div>
        ))}
      <p style={{ color: '#9a93b8', fontSize: 12, marginTop: 12 }}>※ 팁은 정산 외 개인 수령. 가게 오늘 수금 합계: {won(myCollected)}.</p>
    </div>
  )
}
