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
  const payload = b.phone ? { ...b, phone: normPhone(b.phone) } : b
  const { data, error } = await supabase.from('bans').insert(payload).select().single()
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
