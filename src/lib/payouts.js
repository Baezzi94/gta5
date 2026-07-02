import { supabase } from './supabase'

export async function listByDate(date) {
  const { data, error } = await supabase.from('payouts').select('*').eq('date', date)
  if (error) throw error
  return data
}

// 날짜·멤버 지급상태 설정 (upsert). paid=true면 그 시점 정산액(amount)을 스냅샷 저장.
export async function setPaid(date, memberId, paid, amount = null) {
  const { data, error } = await supabase
    .from('payouts')
    .upsert(
      {
        date,
        member_id: memberId,
        paid,
        paid_at: paid ? new Date().toISOString() : null,
        paid_amount: paid ? amount : null,
      },
      { onConflict: 'date,member_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}
