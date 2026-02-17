import { useCallback, useEffect, useState } from 'react'
import type { GameState } from '../types/game'
import { supabase, hasSupabase } from '../lib/supabase'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function useOnlineRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [remoteState, setRemoteState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createRoom = useCallback(async (initialState: GameState): Promise<string | null> => {
    if (!hasSupabase() || !supabase) {
      setError('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return null
    }
    setLoading(true)
    setError(null)
    const code = generateCode()
    const { error: e } = await supabase.from('rooms').insert({
      code,
      state: initialState,
      num_players: initialState.numPlayers,
      updated_at: new Date().toISOString(),
    })
    if (e) {
      setError(e.message)
      setLoading(false)
      return null
    }
    setRoomCode(code)
    setRemoteState(initialState)
    setLoading(false)
    return code
  }, [])

  const joinRoom = useCallback(async (code: string): Promise<GameState | null> => {
    if (!hasSupabase() || !supabase) {
      setError('Supabase not configured.')
      return null
    }
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase.from('rooms').select('state').eq('code', code.toUpperCase()).single()
    if (e || !data?.state) {
      setError(e?.message ?? 'Room not found')
      setLoading(false)
      return null
    }
    setRoomCode(code.toUpperCase())
    setRemoteState(data.state as GameState)
    setLoading(false)
    return data.state as GameState
  }, [])

  const updateRoom = useCallback(
    async (state: GameState) => {
      if (!supabase || !roomCode) return
      await supabase.from('rooms').update({ state, updated_at: new Date().toISOString() }).eq('code', roomCode)
    },
    [roomCode]
  )

  useEffect(() => {
    if (!supabase || !roomCode) return
    const sb = supabase
    const channel = sb
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
        (payload) => {
          const newState = (payload.new as { state: GameState }).state
          if (newState) setRemoteState(newState)
        }
      )
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }, [roomCode])

  const leaveRoom = useCallback(() => {
    setRoomCode(null)
    setRemoteState(null)
  }, [])

  return {
    roomCode,
    remoteState,
    setRemoteState,
    error,
    loading,
    createRoom,
    joinRoom,
    updateRoom,
    leaveRoom,
    hasSupabase: hasSupabase(),
  }
}

