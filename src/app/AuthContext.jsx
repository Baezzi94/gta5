import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [memberId, setMemberId] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) { setRole(null); setMemberId(null); return }
    const { data } = await supabase.from('profiles').select('role, member_id').eq('id', userId).single()
    setRole(data?.role ?? null)
    setMemberId(data?.member_id ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      await loadProfile(s?.user?.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = {
    session, role, memberId, loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
