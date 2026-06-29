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

// 전화번호로 찾고 없으면 생성 (예약 시 인라인 등록용). 추천자(referred_by) 반영.
export async function findOrCreateByPhone({ phone, nickname, referred_by }) {
  const existing = await getByPhone(phone)
  if (existing) {
    // 기존 손님인데 추천자가 비어있고 새로 들어오면 채워줌
    if (referred_by && !existing.referred_by) {
      return updateCustomer(existing.id, { referred_by })
    }
    return existing
  }
  return createCustomer({ phone, nickname: nickname || phone, referred_by: referred_by || null })
}
