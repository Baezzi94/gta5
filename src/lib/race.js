import { supabase } from './supabase'

// 신청 (로그인 불필요). anon 은 base table select 권한이 없으므로 .select() 를 붙이지 않는다.
export async function applyRace({ nickname, phone, note }) {
  const row = {
    nickname: (nickname ?? '').trim(),
    phone: (phone ?? '').trim() || null,
    note: (note ?? '').trim() || null,
  }
  if (!row.nickname) throw new Error('닉네임을 입력하세요.')
  if (!row.phone) throw new Error('게임 전화번호를 입력하세요.')
  const { error } = await supabase.from('race_entries').insert(row)
  if (error) throw error
}

// 공개 리스트 (닉네임/확정여부만)
export async function listPublicEntries() {
  const { data, error } = await supabase
    .from('race_entries_public')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// 시진핑 전용 (전화번호 포함)
export async function listEntriesAdmin() {
  const { data, error } = await supabase
    .from('race_entries')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function setEntryConfirmed(id, confirmed) {
  const { error } = await supabase
    .from('race_entries')
    .update({ confirmed, confirmed_at: confirmed ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('race_entries').delete().eq('id', id)
  if (error) throw error
}
