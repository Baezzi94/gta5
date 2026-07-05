import { supabase } from './supabase'

export const CHARGE_AMOUNT = { tc: 50000, talk: 250000, date2: 5000000 }
export const CHARGE_LABEL = { tc: 'TC(입장료)', talk: '대화료', date2: '2차' }

export async function listByDate(date) {
  const { data, error } = await supabase
    .from('charges')
    .select('*, customer:customers(id, nickname, phone, referred_by), princess:members!princess_id(id, name, referred_by), server:members!sold_by(id, name), reservation:reservations(status), menu_item:menu_items(name)')
    .eq('date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function listRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('charges')
    .select('*, customer:customers(id, nickname, referred_by), princess:members!princess_id(id, name, referred_by), reservation:reservations(status)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createCharge({ date, type, amount, customer_id, princess_id, reservation_id }) {
  const { data, error } = await supabase
    .from('charges')
    .insert({
      date,
      type,
      amount: amount ?? CHARGE_AMOUNT[type],
      customer_id: customer_id ?? null,
      princess_id: princess_id ?? null,
      reservation_id: reservation_id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// 예약 단위로 특정 유형 거래 1건 생성 (이미 있으면 건너뜀)
async function createFromReservation(r, type, extra = {}) {
  const { data: existing } = await supabase
    .from('charges')
    .select('id')
    .eq('reservation_id', r.id)
    .eq('type', type)
    .limit(1)
  if (existing && existing.length) return existing[0]
  return createCharge({
    date: r.date,
    type,
    amount: CHARGE_AMOUNT[type],
    customer_id: r.customer_id,
    reservation_id: r.id,
    ...extra,
  })
}

// 예약(타임) 진행 시: 대화료 거래
export async function createTalkFromReservation(r) {
  return createFromReservation(r, 'talk', { princess_id: r.princess_id })
}

// 예약(타임)마다 TC(입장료) 거래 — 시간(방문)이 다르면 각각 부과
export async function createTcFromReservation(r) {
  return createFromReservation(r, 'tc')
}

// 2차 거래(500만)
export async function createDate2FromReservation(r) {
  return createFromReservation(r, 'date2', { princess_id: r.princess_id })
}

// 메뉴(주류·담배) 판매: 수량>0인 항목들을 거래로 일괄 생성 (선불 — 미수금으로 생성 후 수금 처리)
export async function createMenuSale({ date, customer_id, sold_by, lines }) {
  const rows = (lines || [])
    .filter((l) => l.qty > 0)
    .map((l) => ({
      date,
      type: 'item',
      menu_item_id: l.menu_item_id,
      qty: l.qty,
      amount: l.sale_price * l.qty,
      cost: l.cost_price * l.qty,
      customer_id: customer_id ?? null,
      sold_by: sold_by ?? null,
    }))
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('charges').insert(rows).select()
  if (error) throw error
  return data
}

export async function setCollected(id, collected) {
  const { data, error } = await supabase
    .from('charges')
    .update({ collected, collected_at: collected ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  // 누가·언제 수금/미수금 처리했는지 로그(member_id는 DB default current_member_id()). 실패해도 본작업은 유지.
  await supabase.from('charge_collect_logs').insert({ charge_id: id, collected })
  return data
}

// 수금/미수금 처리 로그 (시진핑만 RLS로 조회 가능). 최근순.
export async function listCollectLogs(limit = 300) {
  const { data, error } = await supabase
    .from('charge_collect_logs')
    .select('*, member:members(name), charge:charges(date, type, amount, customer:customers(nickname))')
    .order('at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function deleteCharge(id) {
  const { error } = await supabase.from('charges').delete().eq('id', id)
  if (error) throw error
}
