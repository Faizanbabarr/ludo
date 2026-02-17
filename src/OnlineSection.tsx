import { useCallback, useState } from 'react'
import { Game } from './components/Game'
import { useOnlineRoom } from './hooks/useOnlineRoom'
import { createInitialState } from './utils/gameLogic'

type Screen = 'menu' | 'local' | 'online' | 'online-create' | 'online-join' | 'game-local' | 'game-online'

interface OnlineSectionProps {
  screen: Screen
  setScreen: (s: Screen) => void
}

export function OnlineSection({ screen, setScreen }: OnlineSectionProps) {
  const online = useOnlineRoom()
  const [joinCode, setJoinCode] = useState('')

  const handleCreateRoom = useCallback(async () => {
    setScreen('online-create')
    const state = createInitialState(4)
    const code = await online.createRoom(state)
    if (code) setScreen('game-online')
  }, [online, setScreen])

  const handleJoinRoom = useCallback(
    async (code: string) => {
      const state = await online.joinRoom(code)
      if (state) setScreen('game-online')
    },
    [online, setScreen]
  )

  if (screen === 'online') {
    return (
      <main className="main menu">
        <p className="menu-label">Online (4 players)</p>
        <button type="button" className="btn-start" onClick={handleCreateRoom} disabled={online.loading}>
          {online.loading ? 'Creating...' : 'Create game'}
        </button>
        <div className="join-row">
          <input
            type="text"
            placeholder="Room code"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="input-code"
          />
          <button
            type="button"
            className="btn-join"
            onClick={() => joinCode.length >= 4 && handleJoinRoom(joinCode)}
            disabled={online.loading || joinCode.length < 4}
          >
            Join
          </button>
        </div>
        {online.error && <p className="error-msg">{online.error}</p>}
        <button type="button" className="btn-back-inline" onClick={() => setScreen('menu')}>
          ← Back
        </button>
      </main>
    )
  }

  if (screen === 'online-create' || screen === 'game-online') {
    if (online.remoteState && online.roomCode) {
      return (
        <Game
          numPlayers={4}
          onBack={() => {
            online.leaveRoom()
            setScreen('menu')
          }}
          state={online.remoteState}
          setState={(s) => {
            const next = typeof s === 'function' ? s(online.remoteState!) : s
            online.updateRoom(next)
            online.setRemoteState(next)
          }}
          roomCode={online.roomCode}
        />
      )
    }
    return (
      <main className="main menu">
        {online.loading ? <p>Creating room...</p> : online.error ? <p className="error-msg">{online.error}</p> : null}
        <button type="button" className="btn-back-inline" onClick={() => setScreen('menu')}>
          ← Back
        </button>
      </main>
    )
  }

  return null
}
