import { supabase } from './supabase'
import { reservationsToBusy } from './reservationBusy'
import { isAvailable, withinAnyWindow } from './availability'
import { listByDatePrincess } from './schedule'

// 특정 날짜의 예약 목록
export async function listByDate(date) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, customer:customers(id, nickname, phone), princess:members(id, name)')
    .eq('date', date)
    .order('start_min', { ascending: true })
  if (error) throw error
  return data
}

async function listForPrincessOnDate(date, princessId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('start_min, end_min, status')
    .eq('date', date)
    .eq('princess_id', princessId)
  if (error) throw error
  return data
}

// 날짜+시각(자정 기준 분) 기반 예약 생성. 가용 블록 내 + 충돌 없음 검사.
export async function createReservation({ date, customer_id, princess_id, start_min, end_min }) {
  const slot = { start: start_min, end: end_min }
  const windows = (await listByDatePrincess(date, princess_id)).map((w) => ({ start: w.start_min, end: w.end_min }))
  if (!withinAnyWindow(windows, slot)) {
    throw new Error('공주님 가용시간(예정) 밖입니다. 출근부에서 그 날짜 가용시간을 먼저 등록하세요.')
  }
  const existing = await listForPrincessOnDate(date, princess_id)
  if (!isAvailable(reservationsToBusy(existing), slot)) {
    throw new Error('해당 공주님의 그 시간대에 이미 예약이 있습니다.')
  }
  const { data, error } = await supabase
    .from('reservations')
    .insert({ date, customer_id, princess_id, start_min, end_min })
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
