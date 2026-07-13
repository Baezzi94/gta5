import { supabase } from './supabase'
import { normalizePhone } from './phone'

// 전화번호가 같으면 기존 인물에 이름 이력만 추가 (그룹바이), 없으면 신규 생성
export async function findOrCreatePerson({ phone, name, affiliation = null, clearance = 2 }) {
  const p = normalizePhone(phone)
  let person = null
  if (p) {
    const { data } = await supabase.from('persons').select('id').eq('phone', p).maybeSingle()
    person = data
  }
  if (!person) {
    const { data, error } = await supabase.from('persons')
      .insert({ phone: p || null, affiliation, clearance }).select('id').single()
    if (error) throw error
    person = data
  }
  if (name?.trim()) {
    // unique(person_id, name) 충돌은 무시
    await supabase.from('person_names').upsert(
      { person_id: person.id, name: name.trim() },
      { onConflict: 'person_id,name', ignoreDuplicates: true }
    )
  }
  return person.id
}

export async function listPersons(search = '') {
  const { data, error } = await supabase.from('persons')
    .select('id, phone, affiliation, clearance, person_names(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  const s = search.trim()
  if (!s) return data
  const sp = normalizePhone(s)
  return data.filter(p =>
    (sp && p.phone?.includes(sp)) ||
    p.person_names.some(n => n.name.includes(s))
  )
}

export async function getPerson(id) {
  const { data, error } = await supabase.from('persons')
    .select('*, person_names(id, name, created_at), tip_persons(tips(id, title, status, clearance))')
    .eq('id', id).single()
  if (error) throw error
  return data
}

export async function updatePerson(id, fields) {
  const { error } = await supabase.from('persons').update(fields).eq('id', id)
  if (error) throw error
}

export async function linkTipPerson(tipId, personId) {
  const { error } = await supabase.from('tip_persons')
    .upsert({ tip_id: tipId, person_id: personId }, { onConflict: 'tip_id,person_id', ignoreDuplicates: true })
  if (error) throw error
}
