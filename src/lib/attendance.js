import { supabase } from './supabase'

export async function listBySession(sessionId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, member:members(id, name, type, profile_photo_url)')
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

export async function addPlanned(sessionId, memberId) {
  const { data, error } = await supabase
    .from('attendance')
    .insert({ session_id: sessionId, member_id: memberId, planned: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkIn(id) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkOut(id) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setAvailableSlots(id, n) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ available_slots: n })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removePlanned(id) {
  const { error } = await supabase.from('attendance').delete().eq('id', id)
  if (error) throw error
}
