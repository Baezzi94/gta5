import { supabase } from './supabase'

export async function listSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function createSession(date) {
  const { data, error } = await supabase.from('sessions').insert({ date }).select().single()
  if (error) throw error
  return data
}

export async function openSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'open', opened_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getOpenSession() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
