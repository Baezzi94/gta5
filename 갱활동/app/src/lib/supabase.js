import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Supabase 환경변수가 비어있습니다. .env.local을 확인하세요.')
}

export const supabase = createClient(url ?? '', anonKey ?? '')
