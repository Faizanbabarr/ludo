import { useCallback, useState } from 'react'
import { Game } from './components/Game'
import { useOnlineRoom } from './hooks/useOnlineRoom'
import { createInitialState } from './utils/gameLogic'
import { PLAYER_COLORS, PLAYER_NAMES } from './types/game'
import type { PlayerId } from './types/game'

type Screen = 'splash' | 'loading' | 'auth' | 'home' | 'online' | 'online-create' | 'game-local' | 'game-ai' | 'game-online'

interface OnlineSectionProps {
  screen: Screen
  setScreen: (s: Screen) => void
}

export function OnlineSection({ screen, setScreen }: OnlineSectionProps) {
  const online = useOnlineRoom()
  const [joinCode, setJoinCode] = useState('')
  const [numPlayers, setNumPlayers] = useState<2 | 4>(4)

  const handleCreateRoom = useCallback(async () => {
    const state = createInitialState(numPlayers)
    const code = await online.createRoom(state)
    if (code) setScreen('online-create')
  }, [online, setScreen, numPlayers])

  const handleJoinRoom = useCallback(
    async (code: string) => {
      const result = await online.joinRoom(code)
      if (result) {
        if (online.roomStatus === 'playing') {
          setScreen('game-online')
        } else {
          setScreen('online-create')
        }
      }
    },
    [online, setScreen]
  )

  // Online menu — create or join
  if (screen === 'online') {
    return (
      <main className="online-screen">
        <div className="online-card">
          <h2 className="online-title">Online Multiplayer</h2>
          <p className="online-subtitle">Play with friends in real-time</p>

          <div className="online-player-select">
            <span className="online-label">Players</span>
            <div className="online-player-btns">
              {([2, 4] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  className={`online-player-btn ${numPlayers === n ? 'active' : ''}`}
                  onClick={() => setNumPlayers(n)}
                >
                  {n}P
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="online-create-btn" onClick={handleCreateRoom} disabled={online.loading}>
            {online.loading ? 'Creating...' : 'Create Room'}
          </button>

          <div className="online-divider"><span>or</span></div>

          <div className="online-join-row">
            <input
              type="text"
              placeholder="Enter room code"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="online-join-input"
            />
            <button
              type="button"
              className="online-join-btn"
              onClick={() => joinCode.length >= 4 && handleJoinRoom(joinCode)}
              disabled={online.loading || joinCode.length < 4}
            >
              Join
            </button>
          </div>

          {online.error && <p className="online-error">{online.error}</p>}

          <button type="button" className="online-back-btn" onClick={() => setScreen('home')}>
            &larr; Back to Home
          </button>
        </div>
      </main>
    )
  }

  // Waiting lobby
  if (screen === 'online-create' && online.roomCode && online.roomStatus === 'waiting') {
    return (
      <main className="online-screen">
        <div className="online-card">
          <h2 className="online-title">Waiting for Players</h2>

          <div className="online-code-display">
            <span className="online-code-label">Room Code</span>
            <span className="online-code-value">{online.roomCode}</span>
            <button
              type="button"
              className="online-copy-btn"
              onClick={() => navigator.clipboard?.writeText(online.roomCode!)}
            >
              Copy
            </button>
          </div>

          <p className="online-subtitle">Share this code with friends</p>

          <div className="online-slots">
            {Array.from({ length: online.remoteState?.numPlayers ?? 4 }, (_, i) => {
              const joined = i < online.playerCount
              const isYou = i === online.localPlayerId
              return (
                <div key={i} className={`online-slot ${joined ? 'filled' : 'empty'}`}>
                  <div className="online-slot-dot" style={{ background: PLAYER_COLORS[i] }} />
                  <span className="online-slot-name">
                    {joined
                      ? `${online.playerNames[i] ?? PLAYER_NAMES[i as PlayerId]}${isYou ? ' (You)' : ''}`
                      : 'Waiting...'}
                  </span>
                  <span className="online-slot-color">{PLAYER_NAMES[i as PlayerId]}</span>
                </div>
              )
            })}
          </div>

          <div className="online-player-count">
            {online.playerCount} / {online.remoteState?.numPlayers ?? 4} players
          </div>

          <button type="button" className="online-back-btn" onClick={() => { online.leaveRoom(); setScreen('home') }}>
            &larr; Leave Room
          </button>
        </div>
      </main>
    )
  }

  // Game in progress
  if ((screen === 'online-create' || screen === 'game-online') && online.remoteState && online.roomCode) {
    if (screen === 'online-create' && online.roomStatus === 'playing') {
      setScreen('game-online')
    }

    if (online.roomStatus === 'playing' || online.roomStatus === 'finished') {
      return (
        <Game
          numPlayers={online.remoteState.numPlayers as 2 | 4}
          onBack={() => { online.leaveRoom(); setScreen('home') }}
          state={online.remoteState}
          setState={(s) => {
            const next = typeof s === 'function' ? s(online.remoteState!) : s
            online.updateRoom(next)
            online.setRemoteState(next)
          }}
          roomCode={online.roomCode}
          localPlayerId={online.localPlayerId}
          playerNames={online.playerNames}
        />
      )
    }
  }

  // Fallback
  return (
    <main className="online-screen">
      <div className="online-card">
        {online.loading ? <p>Loading...</p> : online.error ? <p className="online-error">{online.error}</p> : <p>Connecting...</p>}
        <button type="button" className="online-back-btn" onClick={() => { online.leaveRoom(); setScreen('home') }}>
          &larr; Back
        </button>
      </div>
    </main>
  )
}
