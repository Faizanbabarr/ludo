import { useState } from 'react'
import { Game } from './components/Game'
import { SplashScreen } from './screens/SplashScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { OnlineSection } from './OnlineSection'
import type { GameMode } from './types/game'
import './App.css'

type Screen =
  | 'splash'
  | 'loading'
  | 'home'
  | 'online'
  | 'online-create'
  | 'game-local'
  | 'game-online'

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [numPlayers, setNumPlayers] = useState<2 | 4>(2)
  const [gameMode, setGameMode] = useState<GameMode>('classic')

  return (
    <div className="app">
      {screen === 'splash' && (
        <SplashScreen onComplete={() => setScreen('loading')} />
      )}

      {screen === 'loading' && (
        <LoadingScreen onComplete={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <HomeScreen
          onPlayLocal={(n, mode) => {
            setNumPlayers(n)
            setGameMode(mode)
            setScreen('game-local')
          }}
          onPlayOnline={() => setScreen('online')}
        />
      )}

      {(screen === 'online' || screen === 'online-create' || screen === 'game-online') && (
        <OnlineSection screen={screen} setScreen={setScreen} />
      )}

      {screen === 'game-local' && (
        <Game
          numPlayers={numPlayers}
          gameMode={gameMode}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  )
}

export default App
