import { supabase } from './supabase'

export async function listBans() {
  const { data, error } = await supabase
    .from('bans')
    .select('*, customer:customers(id, nickname, phone)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBan(b) {
  const { data, error } = await supabase.from('bans').insert(b).select().single()
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
  if (!phone) return false
  const { data, error } = await supabase
    .from('bans')
    .select('id')
    .eq('phone', phone)
    .eq('lifted', false)
    .limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}
