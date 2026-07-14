import { supabase } from './supabase'

export const STATUS_LABELS = {
  received: '접수', reviewing: '검토중', adopted: '채택', rejected: '기각',
}

export async function createTip({ title, body, categoryId, files = [], userId }) {
  const { data: tip, error } = await supabase.from('tips')
    .insert({ title, body, category_id: categoryId || null, submitter_id: userId })
    .select('id').single()
  if (error) throw error
  let i = 0
  for (const file of files) {
    // Storage 키는 한글/공백 불가 → 확장자만 살리고 안전한 이름으로 교체
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
    const path = `${userId}/${tip.id}/${Date.now()}_${i++}.${ext}`
    const { error: upErr } = await supabase.storage.from('tip-photos').upload(path, file)
    if (upErr) throw upErr
    const { error: phErr } = await supabase.from('tip_photos').insert({ tip_id: tip.id, path, original_name: file.name })
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
    .select('*, categories(name), profiles!tips_submitter_id_fkey(char_name), tip_photos(id, path, original_name)')
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

export async function listBrowse() {
  const { data, error } = await supabase.from('browse_tips')
    .select('id, title, body, clearance, decided_at, category_id')
    .order('decided_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listBrowsePhotos(tipId) {
  const { data, error } = await supabase.from('browse_tip_photos')
    .select('path').eq('tip_id', tipId)
  if (error) throw error
  return getTipPhotoUrls(data.map(p => p.path))
}

// 서명 URL + 원본 파일명 쌍 (접수함 상세용)
export async function getTipPhotoItems(tipPhotos) {
  const items = []
  for (const p of tipPhotos) {
    const { data, error } = await supabase.storage.from('tip-photos').createSignedUrl(p.path, 3600)
    if (!error && data?.signedUrl) items.push({ url: data.signedUrl, name: p.original_name ?? null })
  }
  return items
}

export async function getTipPhotoUrls(paths) {
  const urls = []
  for (const p of paths) {
    const { data, error } = await supabase.storage.from('tip-photos').createSignedUrl(p, 3600)
    if (!error && data?.signedUrl) urls.push(data.signedUrl)
  }
  return urls
}
