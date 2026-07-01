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

// 워크인/술판매용: 전화 있으면 전화 기준, 없으면 닉네임 기준으로 찾고 없으면 생성.
// 나중에 닉네임 손님에 전화가 붙으면(수정) 이력이 이어짐.
export async function findOrCreateCustomer({ nickname, phone, daily_no, referred_by }) {
  const ph = (phone || '').trim()
  const nk = (nickname || '').trim()
  const dn = (daily_no || '').trim() || null

  if (ph) {
    const existing = await getByPhone(ph)
    if (existing) {
      const patch = {}
      if (referred_by && !existing.referred_by) patch.referred_by = referred_by
      if (dn && !existing.daily_no) patch.daily_no = dn
      return Object.keys(patch).length ? updateCustomer(existing.id, patch) : existing
    }
    return createCustomer({ phone: ph, nickname: nk || ph, daily_no: dn, referred_by: referred_by || null })
  }

  if (!nk) throw new Error('닉네임 또는 전화번호가 필요합니다.')
  const existing = await getByNickname(nk)
  if (existing) {
    const patch = {}
    if (referred_by && !existing.referred_by) patch.referred_by = referred_by
    if (dn) patch.daily_no = dn // 데일리번호는 매번 갱신
    return Object.keys(patch).length ? updateCustomer(existing.id, patch) : existing
  }
  return createCustomer({ phone: null, nickname: nk, daily_no: dn, referred_by: referred_by || null })
}
