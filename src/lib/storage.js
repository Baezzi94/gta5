import { supabase } from './supabase'

// 프로필 사진 업로드 → 공개 URL 반환 (버킷: avatars)
export async function uploadAvatar(memberId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${memberId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
