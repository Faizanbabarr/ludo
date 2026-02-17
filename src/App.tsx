import { useCallback, useState } from 'react'
import { Game } from './components/Game'
import { useOnlineRoom } from './hooks/useOnlineRoom'
import { createInitialState } from './utils/gameLogic'
import './App.css'

function App() {
  const [screen, setScreen] = useState<'menu' | 'local' | 'online' | 'online-create' | 'online-join' | 'game-local' | 'game-online'>('menu')
  const [numPlayers, setNumPlayers] = useState<2 | 3 | 4>(2)
  const online = useOnlineRoom()

  const startLocal = () => setScreen('local')
  const startOnline = () => setScreen('online')

  const handleCreateRoom = useCallback(async () => {
    setScreen('online-create')
    const state = createInitialState(4)
    const code = await online.createRoom(state)
    if (code) setScreen('game-online')
  }, [online])

  const handleJoinRoom = useCallback(
    async (code: string) => {
      const state = await online.joinRoom(code)
      if (state) setScreen('game-online')
    },
    [online]
  )

  return (
    <div className="app">
      {screen === 'menu' ? (
        <>
          <header className="header">
            <h1>Roll Home</h1>
            <p className="tagline">Web · Android · iOS</p>
          </header>
          <main className="main menu">
            <button type="button" className="btn-start" onClick={startLocal}>
              Play locally
            </button>
            <button type="button" className="btn-start secondary" onClick={startOnline}>
              Play online
            </button>
            {screen === 'menu' && (
              <p className="menu-hint">Roll 6 to leave base. Get all 4 tokens home to win.</p>
            )}
          </main>
        </>
      ) : screen === 'local' ? (
        <>
          <main className="main menu">
            <p className="menu-label">Players (same device)</p>
            <div className="player-buttons">
              {([2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn-players ${numPlayers === n ? 'active' : ''}`}
                  onClick={() => setNumPlayers(n)}
                >
                  {n} players
                </button>
              ))}
            </div>
            <button type="button" className="btn-start" onClick={() => setScreen('game-local')}>
              Play
            </button>
            <button type="button" className="btn-back-inline" onClick={() => setScreen('menu')}>
              ← Back
            </button>
          </main>
        </>
      ) : screen === 'online' ? (
        <main className="main menu">
          <p className="menu-label">Online (4 players)</p>
          <button type="button" className="btn-start" onClick={handleCreateRoom} disabled={online.loading}>
            {online.loading ? 'Creating...' : 'Create game'}
          </button>
          <JoinForm onJoin={handleJoinRoom} loading={online.loading} error={online.error} />
          <button type="button" className="btn-back-inline" onClick={() => setScreen('menu')}>
            ← Back
          </button>
        </main>
      ) : screen === 'online-create' || screen === 'game-online' ? (
        online.remoteState && online.roomCode ? (
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
        ) : (
          <main className="main menu">
            {online.loading ? <p>Creating room...</p> : online.error ? <p className="error-msg">{online.error}</p> : null}
            <button type="button" className="btn-back-inline" onClick={() => setScreen('menu')}>
              ← Back
            </button>
          </main>
        )
      ) : screen === 'game-local' ? (
        <Game numPlayers={numPlayers} onBack={() => setScreen('local')} />
      ) : null}
    </div>
  )
}

function JoinForm({
  onJoin,
  loading,
  error,
}: {
  onJoin: (code: string) => void
  loading: boolean
  error: string | null
}) {
  const [code, setCode] = useState('')
  return (
    <>
      <div className="join-row">
        <input
          type="text"
          placeholder="Room code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="input-code"
        />
        <button
          type="button"
          className="btn-join"
          onClick={() => code.length >= 4 && onJoin(code)}
          disabled={loading || code.length < 4}
        >
          Join
        </button>
      </div>
      {error && <p className="error-msg">{error}</p>}
    </>
  )
}

export default App
