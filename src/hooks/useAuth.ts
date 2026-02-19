import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(s => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) fetchProfile(session.user.id)
      else setState(s => ({ ...s, loading: false }))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(s => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) fetchProfile(session.user.id)
      else setState(s => ({ ...s, profile: null, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error && error.code === 'PGRST116') {
        // Profile row doesn't exist — create it
        const user = (await supabase.auth.getUser()).data.user
        const username = user?.user_metadata?.username || 'Player_' + userId.slice(0, 6)
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId, username })
          .select()
          .single()
        setState(s => ({ ...s, profile: newProfile as Profile | null, loading: false }))
        return
      }
      if (error) {
        console.warn('Profile fetch skipped:', error.message)
        setState(s => ({ ...s, profile: null, loading: false }))
        return
      }
      setState(s => ({ ...s, profile: data as Profile | null, loading: false }))
    } catch {
      setState(s => ({ ...s, profile: null, loading: false }))
    }
  }

  async function signUp(email: string, password: string, username: string) {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return { error }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setState({ session: null, user: null, profile: null, loading: false })
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!supabase || !state.user) return
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single()
    if (data) setState(s => ({ ...s, profile: data as Profile }))
  }

  async function recordGameResult(won: boolean) {
    if (!supabase || !state.profile) return
    const p = state.profile
    const newStreak = won ? p.win_streak + 1 : 0
    const xpGain = won ? 25 : 5
    const coinGain = won ? 100 : 20
    const newXp = p.xp + xpGain
    const xpPerLevel = 100
    const newLevel = Math.floor(newXp / xpPerLevel) + 1

    await updateProfile({
      wins: p.wins + (won ? 1 : 0),
      losses: p.losses + (won ? 0 : 1),
      games_played: p.games_played + 1,
      win_streak: newStreak,
      best_streak: Math.max(p.best_streak, newStreak),
      xp: newXp,
      level: newLevel,
      coins: p.coins + coinGain,
      gems: p.gems + (won ? 2 : 0),
    })
  }

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    recordGameResult,
    refetchProfile: () => state.user && fetchProfile(state.user.id),
  }
}
