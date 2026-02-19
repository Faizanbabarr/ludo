import { useEffect, useState } from 'react'
import { Game } from './components/Game'
import { SplashScreen } from './screens/SplashScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { AuthScreen } from './screens/AuthScreen'
import { OnlineSection } from './OnlineSection'
import { MusicToggle } from './components/MusicToggle'
import { useAuth } from './hooks/useAuth'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'
import type { GameMode } from './types/game'
import { DICE_STYLES } from './components/Dice'
import type { DiceStyle } from './components/Dice'
import './App.css'

type Screen =
  | 'splash'
  | 'loading'
  | 'auth'
  | 'home'
  | 'online'
  | 'online-create'
  | 'game-local'
  | 'game-ai'
  | 'game-online'

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [screenClass, setScreenClass] = useState('screen-enter')
  const [numPlayers, setNumPlayers] = useState<2 | 4 | 6>(2)
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [diceStyle, setDiceStyle] = useState<DiceStyle>(DICE_STYLES[0])
  const [aiPlayers, setAiPlayers] = useState<number[]>([])
  const [introComplete, setIntroComplete] = useState(false)
  const auth = useAuth()
  const music = useBackgroundMusic()

  function changeScreen(next: Screen) {
    setScreenClass('screen-exit')
    setTimeout(() => {
      setScreen(next)
      setScreenClass('screen-enter')
    }, 250)
  }

  // Only auto-navigate for auth changes AFTER splash+loading are done
  useEffect(() => {
    if (!introComplete) return
    if (auth.user && screen === 'auth') {
      changeScreen('home')
    }
  }, [auth.user, introComplete])

  function handleLoadingComplete() {
    setIntroComplete(true)
    if (auth.user) {
      changeScreen('home')
    } else {
      changeScreen('auth')
    }
  }

  function handleSplashComplete() {
    setScreen('loading')
    music.start()
  }

  useEffect(() => {
    if (screen === 'game-local' || screen === 'game-online' || screen === 'game-ai') {
      music.stop()
    } else if (screen === 'home' || screen === 'loading') {
      if (!music.isPlaying && localStorage.getItem('bg_music_muted') !== 'true') {
        music.start()
      }
    }
  }, [screen])

  const showMusicToggle = screen === 'loading' || screen === 'home' || screen === 'auth'

  return (
    <div className="app">
      <div className={screenClass}>
        {screen === 'splash' && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}

        {screen === 'loading' && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}

        {screen === 'auth' && (
          <AuthScreen
            onSignIn={auth.signIn}
            onSignUp={auth.signUp}
            onSkip={() => changeScreen('home')}
          />
        )}

        {screen === 'home' && (
          <HomeScreen
            onPlayLocal={(n, mode) => {
              setNumPlayers(n)
              setGameMode(mode)
              setAiPlayers([])
              changeScreen('game-local')
            }}
            onPlayAI={(n, mode) => {
              setNumPlayers(n)
              setGameMode(mode)
              setAiPlayers(Array.from({ length: n - 1 }, (_, i) => i + 1))
              changeScreen('game-ai')
            }}
            onPlayOnline={() => changeScreen('online')}
            diceStyle={diceStyle}
            onDiceStyleChange={setDiceStyle}
            profile={auth.profile}
            isSignedIn={!!auth.user}
            onSignOut={async () => { await auth.signOut(); changeScreen('auth') }}
            onSignIn={() => changeScreen('auth')}
            onUpdateProfile={auth.updateProfile}
            isMusicPlaying={music.isPlaying}
            onMusicToggle={music.toggle}
          />
        )}

        {(screen === 'online' || screen === 'online-create' || screen === 'game-online') && (
          <OnlineSection screen={screen} setScreen={setScreen} />
        )}

        {screen === 'game-local' && (
          <Game
            numPlayers={numPlayers}
            gameMode={gameMode}
            onBack={() => {
              changeScreen('home')
              auth.refetchProfile()
            }}
            diceStyle={diceStyle}
            onGameEnd={(won) => auth.recordGameResult(won)}
          />
        )}

        {screen === 'game-ai' && (
          <Game
            numPlayers={numPlayers}
            gameMode={gameMode}
            onBack={() => {
              changeScreen('home')
              auth.refetchProfile()
            }}
            diceStyle={diceStyle}
            onGameEnd={(won) => auth.recordGameResult(won)}
            aiPlayers={aiPlayers}
          />
        )}
      </div>

      {showMusicToggle && (
        <MusicToggle isPlaying={music.isPlaying} onToggle={music.toggle} />
      )}
    </div>
  )
}

export default App
