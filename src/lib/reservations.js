import { supabase } from './supabase'
import { reservationsToBusy } from './reservationBusy'
import { isAvailable, withinAnyWindow } from './availability'
import { listByDatePrincess } from './schedule'

// 특정 날짜의 예약 목록
export async function listByDate(date) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, customer:customers(id, nickname, phone), princess:members!princess_id(id, name)')
    .eq('date', date)
    .order('start_min', { ascending: true })
  if (error) throw error
  return data
}

async function listForPrincessOnDate(date, princessId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id, start_min, end_min, status')
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

// 예약 수정 (공주/시간 변경) — 가용시간·충돌 재검사(자기 자신 제외)
export async function updateReservation(id, { date, princess_id, start_min, end_min }) {
  const slot = { start: start_min, end: end_min }
  const windows = (await listByDatePrincess(date, princess_id)).map((w) => ({ start: w.start_min, end: w.end_min }))
  if (!withinAnyWindow(windows, slot)) {
    throw new Error('공주님 가용시간(예정) 밖입니다.')
  }
  const others = (await listForPrincessOnDate(date, princess_id)).filter((r) => r.id !== id)
  if (!isAvailable(reservationsToBusy(others), slot)) {
    throw new Error('그 시간대에 이미 다른 예약이 있습니다.')
  }
  const { data, error } = await supabase
    .from('reservations')
    .update({ princess_id, start_min, end_min })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// 2차 전환: 시작~(시작+duration) 동안 공주 자리 비움(end 연장+표시).
// 반환: 그 시간대에 겹쳐 "밀어내야 할" 다른 예약 id 목록.
export async function startDate2(r, durationMin) {
  const start = r.start_min
  const end = start + durationMin
  const all = await listForPrincessOnDate(r.date, r.princess_id)
  const conflicts = all
    .filter((x) => x.id !== r.id && x.status !== 'cancelled' && x.status !== 'no_show')
    .filter((x) => x.start_min < end && start < x.end_min)
    .map((x) => x.id)
  const { error } = await supabase
    .from('reservations')
    .update({ is_date2: true, end_min: end, status: 'in_progress' })
    .eq('id', r.id)
  if (error) throw error
  return conflicts
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
