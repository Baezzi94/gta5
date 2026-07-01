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

// 전화 OR 손님id 로 밴 여부 (전화 없는 워크인 손님도 잡기 위함)
export async function isBannedCustomer({ phone, customer_id }) {
  const conds = []
  const norm = normPhone(phone)
  if (norm) conds.push(`phone.eq.${norm}`)
  if (customer_id) conds.push(`customer_id.eq.${customer_id}`)
  if (!conds.length) return false
  const { data, error } = await supabase
    .from('bans')
    .select('id')
    .eq('lifted', false)
    .or(conds.join(','))
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}
