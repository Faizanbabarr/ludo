import { useState } from 'react'
import { Game } from './components/Game'
import './App.css'
import { OnlineSection } from './OnlineSection'

function App() {
  const [screen, setScreen] = useState<'menu' | 'local' | 'online' | 'online-create' | 'online-join' | 'game-local' | 'game-online'>('menu')
  const [numPlayers, setNumPlayers] = useState<2 | 3 | 4>(2)

  const startLocal = () => setScreen('local')
  const startOnline = () => setScreen('online')

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
      ) : screen === 'online' || screen === 'online-create' || screen === 'game-online' ? (
        <OnlineSection screen={screen} setScreen={setScreen} />
      ) : screen === 'game-local' ? (
        <Game numPlayers={numPlayers} onBack={() => setScreen('local')} />
      ) : null}
    </div>
  )
}

export default App
