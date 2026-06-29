import { supabase } from './supabase'
import { reservationsToBusy } from './reservationBusy'
import { isAvailable, withinWindow } from './availability'

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

async function getPlanWindow(sessionId, princessId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('plan_start_min, plan_end_min')
    .eq('session_id', sessionId)
    .eq('member_id', princessId)
    .maybeSingle()
  if (error) throw error
  if (!data || data.plan_start_min == null || data.plan_end_min == null) return null
  return { start: data.plan_start_min, end: data.plan_end_min }
}

// start_min/end_min = 자정 기준 분(시각). 가용시간(예정) 내 + 충돌 없음 검사.
export async function createReservation({ session_id, customer_id, princess_id, start_min, end_min }) {
  const slot = { start: start_min, end: end_min }
  const window = await getPlanWindow(session_id, princess_id)
  if (!withinWindow(window, slot)) {
    throw new Error('공주님 가용시간(예정) 밖입니다. 출근부에서 예정 시간을 먼저 설정하세요.')
  }
  const existing = await listForPrincess(session_id, princess_id)
  if (!isAvailable(reservationsToBusy(existing), slot)) {
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
