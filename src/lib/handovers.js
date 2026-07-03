import { supabase } from './supabase'

// 중간정산 실수령 기록 (시진핑만 RLS)
export async function listHandovers(date) {
  const { data, error } = await supabase
    .from('cash_handovers')
    .select('*, member:members(name)')
    .eq('date', date)
    .order('at', { ascending: true })
  if (error) throw error
  return data
}

export async function addHandover({ date, member_id, amount, note }) {
  const { data, error } = await supabase
    .from('cash_handovers')
    .insert({ date, member_id, amount, note: note || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHandover(id) {
  const { error } = await supabase.from('cash_handovers').delete().eq('id', id)
  if (error) throw error
}
