import { supabase } from './supabase'

// 전화번호 비교용 정규화: 숫자만 남김 (공백/하이픈 차이로 밴이 새는 것 방지)
export function normPhone(p) {
  return (p || '').replace(/\D/g, '')
}

export async function listBans() {
  const { data, error } = await supabase
    .from('bans')
    .select('*, customer:customers(id, nickname, phone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBan(b) {
  const phone = b.phone && b.phone.trim() ? normPhone(b.phone) : null
  const { data, error } = await supabase.from('bans').insert({ ...b, phone }).select().single()
  if (error) throw error
  return data
}

export async function liftBan(id) {
  const { data, error } = await supabase
    .from('bans')
    .update({ lifted: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// 해당 전화번호가 현재 밴 상태인지
export async function isBanned(phone) {
  const norm = normPhone(phone)
  if (!norm) return false
  const { data, error } = await supabase
    .from('bans')
    .select('id')
    .eq('phone', norm)
    .eq('lifted', false)
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

// 전화 OR 손님id OR 닉네임 으로 밴 여부 (전화 없는 워크인·닉네임 밴도 잡기 위함).
// 밴 목록은 소수이므로 활성 밴을 한 번에 가져와 클라이언트에서 매칭 → 동명이인 손님행이
// 아무리 많아도 OR 필터가 폭발하지 않음(URL 길이 초과로 밴 체크가 깨지는 것 방지).
export async function isBannedCustomer({ phone, customer_id, nickname }) {
  const norm = normPhone(phone)
  const nk = (nickname || '').trim()
  if (!norm && !customer_id && !nk) return false
  const { data, error } = await supabase
    .from('bans')
    .select('id, phone, customer_id, customer:customers(nickname)')
    .eq('lifted', false)
  if (error) throw error
  return (data || []).some(
    (b) =>
      (norm && b.phone === norm) ||
      (customer_id && b.customer_id === customer_id) ||
      (nk && b.customer?.nickname === nk)
  )
}
