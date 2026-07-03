import { supabase } from './supabase'

// 닉 또는 전화 부분일치 검색
export async function searchCustomers(query) {
  const q = (query || '').trim()
  let req = supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(50)
  if (q) req = req.or(`phone.ilike.%${q}%,nickname.ilike.%${q}%`)
  const { data, error } = await req
  if (error) throw error
  return data
}

export async function getByPhone(phone) {
  const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).maybeSingle()
  if (error) throw error
  return data
}

// 닉네임으로 찾기(가장 최근 1명). 워크인 손님은 닉네임이 주키.
export async function getByNickname(nickname) {
  const nk = (nickname || '').trim()
  if (!nk) return null
  const { data, error } = await supabase
    .from('customers').select('*').eq('nickname', nk)
    .order('created_at', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

export async function createCustomer(c) {
  const { data, error } = await supabase.from('customers').insert(c).select().single()
  if (error) throw error
  return data
}

export async function updateCustomer(id, patch) {
  const { data, error } = await supabase.from('customers').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}
