import { useCallback, useEffect, useState } from 'react'
import type { GameState, PlayerId } from '../types/game'
import { supabase, hasSupabase } from '../lib/supabase'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

interface RoomRow {
  code: string
  state: GameState
  num_players: number
  player_ids: string[]
  player_names: string[]
  status: string
  host_id: string | null
}

export function useOnlineRoom() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [remoteState, setRemoteState] = useState<GameState | null>(null)
  const [localPlayerId, setLocalPlayerId] = useState<PlayerId | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [playerCount, setPlayerCount] = useState(0)
  const [roomStatus, setRoomStatus] = useState<string>('waiting')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Get or create a stable user identifier
  const ensureUserId = useCallback(async (): Promise<string> => {
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.id) return data.session.user.id
    }
    let guestId = localStorage.getItem('online_guest_id')
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem('online_guest_id', guestId)
    }
    return guestId
  }, [])

  const getUsername = useCallback(async (): Promise<string> => {
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single()
        if (profile?.username) return profile.username
      }
    }
    return localStorage.getItem('guest_username') || 'Guest'
  }, [])

  const createRoom = useCallback(async (initialState: GameState): Promise<string | null> => {
    if (!hasSupabase() || !supabase) {
      setError('Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return null
    }
    setLoading(true)
    setError(null)

    const userId = await ensureUserId()
    const username = await getUsername()
    const code = generateCode()

    const { error: e } = await supabase.from('rooms').insert({
      code,
      state: initialState,
      num_players: initialState.numPlayers,
      host_id: userId.startsWith('guest_') ? null : userId,
      player_ids: [userId],
      player_names: [username],
      status: 'waiting',
    })

    if (e) {
      setError(e.message)
      setLoading(false)
      return null
    }

    setRoomCode(code)
    setRemoteState(initialState)
    setLocalPlayerId(0 as PlayerId)
    setPlayerNames([username])
    setPlayerCount(1)
    setRoomStatus('waiting')
    setLoading(false)
    return code
  }, [ensureUserId, getUsername])

  const joinRoom = useCallback(async (code: string): Promise<{ state: GameState; playerId: PlayerId } | null> => {
    if (!hasSupabase() || !supabase) {
      setError('Supabase not configured.')
      return null
    }
    setLoading(true)
    setError(null)

    const upperCode = code.toUpperCase()
    const userId = await ensureUserId()
    const username = await getUsername()

    const { data, error: e } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', upperCode)
      .single()

    if (e || !data) {
      setError(e?.message ?? 'Room not found')
      setLoading(false)
      return null
    }

    const room = data as unknown as RoomRow
    const ids: string[] = room.player_ids ?? []
    const names: string[] = room.player_names ?? []

    // Check if already in room (rejoin)
    const existingSlot = ids.indexOf(userId)
    if (existingSlot >= 0) {
      setRoomCode(upperCode)
      setRemoteState(room.state)
      setLocalPlayerId(existingSlot as PlayerId)
      setPlayerNames(names)
      setPlayerCount(ids.length)
      setRoomStatus(room.status)
      setLoading(false)
      return { state: room.state, playerId: existingSlot as PlayerId }
    }

    // Check full
    if (ids.length >= room.num_players) {
      setError('Room is full')
      setLoading(false)
      return null
    }

    if (room.status === 'finished') {
      setError('Game already finished')
      setLoading(false)
      return null
    }

    const newIds = [...ids, userId]
    const newNames = [...names, username]
    const mySlot = ids.length as PlayerId

    const updateData: Record<string, unknown> = {
      player_ids: newIds,
      player_names: newNames,
    }
    if (newIds.length >= room.num_players) {
      updateData.status = 'playing'
    }

    const { error: ue } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('code', upperCode)

    if (ue) {
      setError(ue.message)
      setLoading(false)
      return null
    }

    setRoomCode(upperCode)
    setRemoteState(room.state)
    setLocalPlayerId(mySlot)
    setPlayerNames(newNames)
    setPlayerCount(newIds.length)
    setRoomStatus(newIds.length >= room.num_players ? 'playing' : room.status)
    setLoading(false)
    return { state: room.state, playerId: mySlot }
  }, [ensureUserId, getUsername])

  const updateRoom = useCallback(
    async (state: GameState) => {
      if (!supabase || !roomCode) return
      const updateData: Record<string, unknown> = {
        state,
        updated_at: new Date().toISOString(),
      }
      if (state.winner !== null) updateData.status = 'finished'
      await supabase.from('rooms').update(updateData).eq('code', roomCode)
    },
    [roomCode]
  )

  // Realtime subscription
  useEffect(() => {
    if (!supabase || !roomCode) return
    const sb = supabase
    const channel = sb
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
        (payload) => {
          const row = payload.new as unknown as RoomRow
          if (row.state) setRemoteState(row.state)
          if (row.player_names) setPlayerNames(row.player_names)
          if (row.player_ids) setPlayerCount(row.player_ids.length)
          if (row.status) setRoomStatus(row.status)
        }
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [roomCode])

  const leaveRoom = useCallback(() => {
    setRoomCode(null)
    setRemoteState(null)
    setLocalPlayerId(null)
    setPlayerNames([])
    setPlayerCount(0)
    setRoomStatus('waiting')
  }, [])

  return {
    roomCode,
    remoteState,
    setRemoteState,
    localPlayerId,
    playerNames,
    playerCount,
    roomStatus,
    error,
    loading,
    createRoom,
    joinRoom,
    updateRoom,
    leaveRoom,
    hasSupabase: hasSupabase(),
  }
}
