import { supabase } from './supabase'

export async function createReport({ title, body, clearance = 0, tipIds = [] }) {
  const { data: report, error } = await supabase.from('reports')
    .insert({ title, body, clearance }).select('id').single()
  if (error) throw error
  if (tipIds.length) {
    const rows = tipIds.map(tid => ({ report_id: report.id, tip_id: tid }))
    const { error: rtErr } = await supabase.from('report_tips').insert(rows)
    if (rtErr) throw rtErr
  }
  return report.id
}

export async function listReports() {
  const { data, error } = await supabase.from('reports')
    .select('id, title, clearance, created_at, read_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getReport(id) {
  const { data, error } = await supabase.from('reports')
    .select('*, report_tips(tips(id, title, clearance, status))')
    .eq('id', id).single()
  if (error) throw error
  return data
}

// 보스 열람 시 읽음 처리 (최초 1회)
export async function markReportRead(id) {
  await supabase.from('reports')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id).is('read_at', null)
}

// 전체 공유: 등급을 P3(전체)로 낮춰 전 조직원에게 개방
export async function shareReportAll(id) {
  const { error } = await supabase.from('reports').update({ clearance: 3 }).eq('id', id)
  if (error) throw error
}

// 공유(P3) 보고서 목록 — 전 조직원 열람용
export async function listSharedReports() {
  const { data, error } = await supabase.from('reports')
    .select('id, title, created_at')
    .eq('clearance', 3)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function countUnreadReports() {
  const { count, error } = await supabase.from('reports')
    .select('id', { count: 'exact', head: true }).is('read_at', null)
  if (error) return 0
  return count ?? 0
}
