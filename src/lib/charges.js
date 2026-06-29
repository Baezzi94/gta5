import { supabase } from './supabase'

export const CHARGE_AMOUNT = { tc: 50000, talk: 250000, date2: 1000000 }
export const CHARGE_LABEL = { tc: 'TC(입장료)', talk: '대화료', date2: '2차' }

export async function listByDate(date) {
  const { data, error } = await supabase
    .from('charges')
    .select('*, customer:customers(id, nickname, phone), princess:members(id, name)')
    .eq('date', date)
    .order('created_at', { ascending: true })
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

// 예약 완료 시 대화료 거래 자동 생성 (이미 있으면 건너뜀)
export async function createTalkFromReservation(r) {
  const { data: existing } = await supabase.from('charges').select('id').eq('reservation_id', r.id).maybeSingle()
  if (existing) return existing
  return createCharge({
    date: r.date,
    type: 'talk',
    amount: CHARGE_AMOUNT.talk,
    customer_id: r.customer_id,
    princess_id: r.princess_id,
    reservation_id: r.id,
  })
}

// 손님당 하루 1번 TC(입장료) 거래 생성 (이미 있으면 건너뜀)
export async function createTcOnce({ date, customer_id }) {
  if (!customer_id) return null
  const { data: existing } = await supabase
    .from('charges')
    .select('id')
    .eq('date', date)
    .eq('type', 'tc')
    .eq('customer_id', customer_id)
    .limit(1)
  if (existing && existing.length) return existing[0]
  return createCharge({ date, type: 'tc', amount: CHARGE_AMOUNT.tc, customer_id })
}

export async function setCollected(id, collected) {
  const { data, error } = await supabase
    .from('charges')
    .update({ collected, collected_at: collected ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCharge(id) {
  const { error } = await supabase.from('charges').delete().eq('id', id)
  if (error) throw error
}
