import { supabase } from './supabase'
import { reservationsToBusy } from './reservationBusy'
import { isAvailable } from './availability'

export async function listBySession(sessionId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, customer:customers(id, nickname, phone), princess:members(id, name)')
    .eq('session_id', sessionId)
    .order('start_min', { ascending: true })
  if (error) throw error
  return data
}

async function listForPrincess(sessionId, princessId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('start_min, end_min, status')
    .eq('session_id', sessionId)
    .eq('princess_id', princessId)
  if (error) throw error
  return data
}

// 생성 전 가용성 검사 → 충돌 시 throw
export async function createReservation({ session_id, customer_id, princess_id, start_min, end_min }) {
  const existing = await listForPrincess(session_id, princess_id)
  const busy = reservationsToBusy(existing)
  if (!isAvailable(busy, { start: start_min, end: end_min })) {
    throw new Error('해당 공주님의 그 시간대에 이미 예약이 있습니다.')
  }
  const { data, error } = await supabase
    .from('reservations')
    .insert({ session_id, customer_id, princess_id, start_min, end_min })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setStatus(id, status) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
