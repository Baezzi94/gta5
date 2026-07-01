import { supabase } from './supabase'

export async function listMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMember(id) {
  const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createMember(m) {
  const { data, error } = await supabase.from('members').insert(m).select().single()
  if (error) throw error
  return data
}

export async function updateMember(id, patch) {
  const { data, error } = await supabase.from('members').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deactivateMember(id) {
  return updateMember(id, { active: false })
}

export async function deleteMember(id) {
  // FK 참조 정리: 다른 테이블이 이 멤버를 가리키면 삭제가 막히므로 먼저 해제/삭제
  await supabase.from('customers').update({ referred_by: null }).eq('referred_by', id)
  await supabase.from('customers').update({ preferred_princess: null }).eq('preferred_princess', id)
  await supabase.from('members').update({ referred_by: null }).eq('referred_by', id)
  await supabase.from('bans').update({ created_by: null }).eq('created_by', id)
  await supabase.from('charges').update({ princess_id: null }).eq('princess_id', id)
  await supabase.from('reservations').update({ created_by: null }).eq('created_by', id)
  // 이 공주의 예약을 물고 있는 거래(reservation_id)는 ON DELETE가 없어 예약 삭제를 막음 → 먼저 링크 해제
  const { data: resRows } = await supabase.from('reservations').select('id').eq('princess_id', id)
  const resIds = (resRows || []).map((r) => r.id)
  if (resIds.length) await supabase.from('charges').update({ reservation_id: null }).in('reservation_id', resIds)
  // not-null FK라 null 불가 → 해당 멤버의 행 삭제
  await supabase.from('reservations').delete().eq('princess_id', id)
  await supabase.from('availability').delete().eq('member_id', id)
  await supabase.from('attendance').delete().eq('member_id', id)
  await supabase.from('payouts').delete().eq('member_id', id)
  // 로그인 계정 연결이 있으면 멤버 링크만 해제(계정은 보존)
  await supabase.from('profiles').update({ member_id: null }).eq('member_id', id)

  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}
