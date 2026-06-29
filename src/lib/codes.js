import { supabase } from './supabase'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randCode(len = 8) {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

export async function listCodes() {
  const { data, error } = await supabase.from('role_codes').select('*')
  if (error) throw error
  return data
}

export async function regenerateCode(role) {
  const code = randCode()
  const { data, error } = await supabase.from('role_codes').update({ code }).eq('role', role).select().single()
  if (error) throw error
  return data
}
