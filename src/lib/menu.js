import { supabase } from './supabase'

export async function listMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createMenuItem({ name, sale_price, cost_price, sort }) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ name, sale_price, cost_price, sort: sort ?? 99 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMenuItem(id, patch) {
  const { data, error } = await supabase.from('menu_items').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}
