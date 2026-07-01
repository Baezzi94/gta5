import { supabase } from './supabase'

// 기간(YYYY-MM-DD ~ YYYY-MM-DD) 내 모든 가용 블록 (멤버 정보 포함)
export async function listRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('availability')
    .select('*, member:members(id, name, phone, type, profile_photo_url)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_min', { ascending: true })
  if (error) throw error
  return data
}

// 특정 날짜의 특정 공주님 가용 블록
export async function listByDatePrincess(date, memberId) {
  const { data, error } = await supabase
    .from('availability')
    .select('start_min, end_min, checked_in_at, checked_out_at')
    .eq('date', date)
    .eq('member_id', memberId)
  if (error) throw error
  return data
}

// 특정 날짜 가용 블록 전체 (멤버 포함)
export async function listByDate(date) {
  const { data, error } = await supabase
    .from('availability')
    .select('*, member:members(id, name, phone, type, profile_photo_url)')
    .eq('date', date)
    .order('start_min', { ascending: true })
  if (error) throw error
  return data
}

export async function addAvailability(memberId, date, startMin, endMin) {
  const { data, error } = await supabase
    .from('availability')
    .insert({ member_id: memberId, date, start_min: startMin, end_min: endMin })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkIn(id) {
  const { data, error } = await supabase
    .from('availability')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkOut(id) {
  const { data, error } = await supabase
    .from('availability')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// 재출근: 퇴근 기록만 지워 다시 출근중 상태로.
// (checked_in_at은 원래 출근시각 그대로 둔다 — 시간귀속 정산에서 퇴근 전 판매를 잃지 않도록.
//  퇴근~재출근 사이 공백은 출근으로 간주되지만, 실제 일한 매출을 잃는 것보다 안전.)
export async function reCheckIn(id) {
  const { data, error } = await supabase
    .from('availability')
    .update({ checked_out_at: null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeAvailability(id) {
  const { error } = await supabase.from('availability').delete().eq('id', id)
  if (error) throw error
}
