import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './Board'
import { Dice } from './Dice'
import { EmojiPicker } from './EmojiPicker'
import { useSound } from '../hooks/useSound'
import type { GameState, GameMode, PlayerId } from '../types/game'
import { PLAYER_NAMES, PLAYER_COLORS } from '../types/game'
import { applyMove, createInitialState, getValidMoves } from '../utils/gameLogic'
import { PATH_BASE } from '../utils/ludoPath'

interface GameProps {
  numPlayers: 2 | 3 | 4
  gameMode?: GameMode
  onBack: () => void
  state?: GameState
  setState?: (s: GameState | ((prev: GameState) => GameState)) => void
  roomCode?: string | null
}

function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

interface AnimatingMove {
  playerId: PlayerId
  tokenIdx: number
  pathSteps: number[]
  currentStep: number
  finalState: GameState
}

interface FloatingEmojiData {
  id: number
  emoji: string
  x: number
  y: number
}

function getAnimationSteps(fromPos: number, diceValue: number): number[] {
  if (fromPos === PATH_BASE) return [1]
  const steps: number[] = []
  for (let i = 1; i <= diceValue; i++) {
    steps.push(fromPos + i)
  }
  return steps
}

export function Game({ numPlayers, gameMode = 'classic', onBack, state: controlledState, setState: setControlledState, roomCode }: GameProps) {
  const [localState, setLocalState] = useState<GameState>(() => createInitialState(numPlayers, gameMode))
  const state = controlledState ?? localState
  const setState = setControlledState ?? setLocalState
  const [rolling, setRolling] = useState(false)
  const [animating, setAnimating] = useState<AnimatingMove | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([])
  const sound = useSound()

  // Step-by-step animation effect
  useEffect(() => {
    if (!animating) return
    if (animating.currentStep >= animating.pathSteps.length) {
      // Detect capture: check if any opponent token was sent back to base
      const captured = state.players.some((p, pidIdx) => {
        if (pidIdx === animating.playerId) return false
        return p.tokens.some((t, tidx) =>
          t.pathPosition !== 0 && animating.finalState.players[pidIdx].tokens[tidx].pathPosition === 0
        )
      })
      if (captured) sound.play('capture')
      if (animating.finalState.winner !== null) sound.play('win')
      setState(animating.finalState)
      setAnimating(null)
      return
    }
    const timer = setTimeout(() => {
      sound.play('move')
      setAnimating(prev => prev ? { ...prev, currentStep: prev.currentStep + 1 } : null)
    }, 200)
    return () => clearTimeout(timer)
  }, [animating, sound, setState])

  // Display state: show animating token at its current step position
  const displayState = useMemo((): GameState => {
    if (!animating) return state
    const stepIdx = Math.min(animating.currentStep, animating.pathSteps.length - 1)
    return {
      ...state,
      players: state.players.map((p, pid) => ({
        ...p,
        tokens: p.tokens.map((t, tid) => {
          if (pid === animating.playerId && tid === animating.tokenIdx) {
            return { pathPosition: animating.pathSteps[stepIdx] }
          }
          return { ...t }
        })
      }))
    }
  }, [state, animating])

  const handleRoll = useCallback(() => {
    if (state.phase !== 'roll' || state.winner !== null || rolling || animating) return
    setRolling(true)
    const value = rollDice()
    setTimeout(() => {
      setRolling(false)
      sound.play('roll')
      setState((s) => {
        const next = { ...s, diceValue: value, lastRoll: value }
        const valid = getValidMoves(next)
        return {
          ...next,
          phase: valid.length > 0 ? 'move' : 'roll',
          currentPlayer: (valid.length === 0 ? (s.currentPlayer + 1) % numPlayers : s.currentPlayer) as PlayerId,
          validMoves: valid,
        }
      })
    }, 500)
  }, [state.phase, state.winner, rolling, animating, numPlayers, sound, setState])

  const handleTokenClick = useCallback(
    (player: PlayerId, tokenIndex: number) => {
      if (animating) return
      if (state.phase !== 'move' || state.currentPlayer !== player || !state.validMoves.includes(tokenIndex)) return

      const token = state.players[player].tokens[tokenIndex]
      const steps = getAnimationSteps(token.pathPosition, state.diceValue)
      const { state: newState } = applyMove(state, tokenIndex)

      setAnimating({
        playerId: player,
        tokenIdx: tokenIndex,
        pathSteps: steps,
        currentStep: 0,
        finalState: newState,
      })
    },
    [state, animating]
  )

  const handleEmojiSelect = useCallback((emoji: string) => {
    const id = Date.now()
    const x = 40 + Math.random() * 20
    const y = 50
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }])
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id))
    }, 1500)
  }, [])

  const canRoll = state.phase === 'roll' && state.winner === null && !rolling && !animating

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <button type="button" className="btn-back" onClick={onBack}>&larr;</button>
        <h2 className="turn-label">
          {roomCode && <span className="room-code">Room: {roomCode}</span>}
          {!roomCode && gameMode !== 'classic' && (
            <span className="mode-badge-game">
              {gameMode === 'arrow' ? '🏹' : '⚡'} {gameMode.toUpperCase()}
            </span>
          )}
          {state.winner !== null ? (
            <span className="winner-msg">{PLAYER_NAMES[state.winner]} wins!</span>
          ) : (
            <span style={{ color: PLAYER_COLORS[state.currentPlayer] }}>
              {PLAYER_NAMES[state.currentPlayer]}&apos;s Turn
            </span>
          )}
        </h2>
        <div style={{ width: 32 }} />
      </header>

      {/* Player row - top (Green + Yellow) */}
      <div className="player-row">
        {[1, 2].map(pid => {
          if (pid >= numPlayers) return null
          const isActive = state.currentPlayer === pid
          return (
            <div key={pid} className={`player-indicator ${isActive ? 'active' : ''}`}>
              <div
                className="indicator-dot"
                style={{
                  background: PLAYER_COLORS[pid],
                  boxShadow: isActive ? `0 0 10px ${PLAYER_COLORS[pid]}` : 'none',
                }}
              />
              <span className="indicator-name">{PLAYER_NAMES[pid as PlayerId]}</span>
            </div>
          )
        })}
      </div>

      {/* Board */}
      <div className="game-board-area">
        <Board
          state={displayState}
          onTokenClick={handleTokenClick}
          validMoves={animating ? [] : state.validMoves}
          currentPlayer={state.currentPlayer}
          gameMode={gameMode}
        />
      </div>

      {/* Player row - bottom (Red + Blue) */}
      <div className="player-row">
        {[0, 3].map(pid => {
          if (pid >= numPlayers) return null
          const isActive = state.currentPlayer === pid
          return (
            <div key={pid} className={`player-indicator ${isActive ? 'active' : ''}`}>
              <div
                className="indicator-dot"
                style={{
                  background: PLAYER_COLORS[pid],
                  boxShadow: isActive ? `0 0 10px ${PLAYER_COLORS[pid]}` : 'none',
                }}
              />
              <span className="indicator-name">{PLAYER_NAMES[pid as PlayerId]}</span>
            </div>
          )
        })}
      </div>

      {/* Controls - clickable dice only */}
      <div className="game-controls">
        <div className="dice-container">
          <Dice
            value={state.lastRoll || 1}
            rolling={rolling}
            size={60}
            canRoll={canRoll}
            onRoll={handleRoll}
          />
          {state.phase === 'move' && !animating && (
            <span className="dice-hint">Pick a pawn</span>
          )}
        </div>

        {state.winner !== null &&
          (setControlledState ? (
            <button type="button" className="btn-new" onClick={onBack}>Leave</button>
          ) : (
            <button type="button" className="btn-new" onClick={() => setState(createInitialState(numPlayers, gameMode))}>
              New Game
            </button>
          ))}
      </div>

      {/* Emoji/Chat bar */}
      <div className="game-bottom-bar">
        <button type="button" className="emoji-chat-btn" onClick={() => setShowEmoji(true)}>
          EMOJI
        </button>
        <button type="button" className="emoji-chat-btn">
          CHAT
        </button>
      </div>

      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {floatingEmojis.map(fe => (
        <div
          key={fe.id}
          className="floating-emoji"
          style={{ left: `${fe.x}%`, top: `${fe.y}%` }}
        >
          {fe.emoji}
        </div>
      ))}

      {state.winner !== null && <Confetti />}
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1}s`,
    color: ['#E53935', '#43A047', '#FDD835', '#1E88E5', '#FFD700', '#FF8C00'][i % 6],
    size: `${6 + Math.random() * 6}px`,
  }))

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  )
}
