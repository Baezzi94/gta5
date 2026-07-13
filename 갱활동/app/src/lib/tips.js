import { supabase } from './supabase'

export const STATUS_LABELS = {
  received: '접수', reviewing: '검토중', adopted: '채택', rejected: '기각',
}

export async function createTip({ title, body, categoryId, files = [], userId }) {
  const { data: tip, error } = await supabase.from('tips')
    .insert({ title, body, category_id: categoryId || null, submitter_id: userId })
    .select('id').single()
  if (error) throw error
  for (const file of files) {
    const path = `${userId}/${tip.id}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('tip-photos').upload(path, file)
    if (upErr) throw upErr
    const { error: phErr } = await supabase.from('tip_photos').insert({ tip_id: tip.id, path })
    if (phErr) throw phErr
  }
  return tip.id
}

export async function listMyTips(userId) {
  const { data, error } = await supabase.from('tips')
    .select('id, title, status, created_at')
    .eq('submitter_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('id, name').order('id')
  if (error) throw error
  return data
}

export async function listInbox() {
  const { data, error } = await supabase.from('tips')
    .select('id, title, status, verdict, clearance, created_at, categories(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTip(id) {
  const { data, error } = await supabase.from('tips')
    .select('*, categories(name), profiles!tips_submitter_id_fkey(char_name), tip_photos(id, path)')
    .eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateTipReview(id, fields) {
  const patch = { ...fields }
  if (fields.status === 'adopted' || fields.status === 'rejected') patch.decided_at = new Date().toISOString()
  const { error } = await supabase.from('tips').update(patch).eq('id', id)
  if (error) throw error
}

export async function getTipPhotoUrls(paths) {
  const urls = []
  for (const p of paths) {
    const { data, error } = await supabase.storage.from('tip-photos').createSignedUrl(p, 3600)
    if (!error && data?.signedUrl) urls.push(data.signedUrl)
  }
  return urls
}
