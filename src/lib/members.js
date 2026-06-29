import { supabase } from './supabase'

export async function listMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
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
