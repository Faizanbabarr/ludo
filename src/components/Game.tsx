import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Board } from './Board'
import { Dice } from './Dice'
import { EmojiPicker } from './EmojiPicker'
import { ParticleBurst } from './ParticleEffects'
import { useSound } from '../hooks/useSound'
import type { DiceStyle } from './Dice'
import type { GameState, GameMode, PlayerId, ChatMessage } from '../types/game'
import { PLAYER_NAMES, PLAYER_COLORS } from '../types/game'
import { applyMove, createInitialState, getValidMoves, getAIMove } from '../utils/gameLogic'
import { PATH_BASE } from '../utils/ludoPath'
import { homeStart, trackEnd } from '../utils/ludoPath'

interface GameProps {
  numPlayers: 2 | 3 | 4 | 6
  gameMode?: GameMode
  onBack: () => void
  state?: GameState
  setState?: (s: GameState | ((prev: GameState) => GameState)) => void
  roomCode?: string | null
  diceStyle?: DiceStyle
  onGameEnd?: (won: boolean) => void
  aiPlayers?: number[]
  localPlayerId?: PlayerId | null // which player we control in online mode
  playerNames?: string[] // display names for online players
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
  snakeLadderEffect?: 'snake' | 'ladder' | null
  snakeLadderFrom?: number | null
  snakeLadderTo?: number | null
  slidePlayed?: boolean
}

interface FloatingEmojiData {
  id: number
  emoji: string
  x: number
  y: number
}

function getAnimationSteps(fromPos: number, diceValue: number, numPlayers: number): number[] {
  if (fromPos === PATH_BASE) return [1]
  const steps: number[] = []
  for (let i = 1; i <= diceValue; i++) {
    steps.push(fromPos + i)
  }
  const te = trackEnd(numPlayers)
  const hs = homeStart(numPlayers)
  if (steps.length >= 2) {
    const idxTE = steps.indexOf(te)
    if (idxTE >= 0 && idxTE < steps.length - 1 && steps[idxTE + 1] >= hs) {
      steps.splice(idxTE, 1)
    }
  }
  return steps
}

const QUICK_CHAT = [
  'Good luck!',
  'Nice move!',
  'Hurry up!',
  'Well played!',
  'Oops!',
  'Ha ha!',
  'GG',
  'Rematch?',
]

export function Game({ numPlayers, gameMode = 'classic', onBack, state: controlledState, setState: setControlledState, roomCode, diceStyle, onGameEnd, aiPlayers, localPlayerId, playerNames: onlineNames }: GameProps) {
  const [localState, setLocalState] = useState<GameState>(() => createInitialState(numPlayers, gameMode, aiPlayers))
  const state = controlledState ?? localState
  const setState = setControlledState ?? setLocalState
  const isOnline = roomCode != null && localPlayerId != null
  // In online mode, you can only act on your own turn
  const isMyTurn = isOnline ? state.currentPlayer === localPlayerId : true
  const [rolling, setRolling] = useState(false)
  const [diceResult, setDiceResult] = useState(1)
  const [animating, setAnimating] = useState<AnimatingMove | null>(null)
  const [prevPlayer, setPrevPlayer] = useState<PlayerId>(0)
  const [turnFlash, setTurnFlash] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiData[]>([])
  const [captureBurst, setCaptureBurst] = useState<{ x: number; y: number; color: string } | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const sound = useSound()

  const isAITurn = (state.aiPlayers ?? []).includes(state.currentPlayer)

  useEffect(() => {
    if (!animating) return
    if (animating.currentStep >= animating.pathSteps.length) {
      const captured = state.players.some((p, pidIdx) => {
        if (pidIdx === animating.playerId) return false
        return p.tokens.some((t, tidx) =>
          t.pathPosition !== 0 && animating.finalState.players[pidIdx].tokens[tidx].pathPosition === 0
        )
      })
      if (captured) {
        sound.play('capture')
        setCaptureBurst({ x: 40 + Math.random() * 20, y: 45 + Math.random() * 10, color: PLAYER_COLORS[animating.playerId] })
      }
      if (animating.finalState.winner !== null) {
        sound.play('win')
        if (onGameEnd) onGameEnd(animating.finalState.winner === 0)
      }
      setState(animating.finalState)
      setAnimating(null)
      return
    }
    const timer = setTimeout(() => {
      const isSlideStep = animating.snakeLadderEffect && animating.currentStep === animating.pathSteps.length - 2
      if (isSlideStep && animating.snakeLadderEffect) {
        sound.play(animating.snakeLadderEffect)
      } else {
        sound.play('move')
      }
      setAnimating(prev => prev ? { ...prev, currentStep: prev.currentStep + 1 } : null)
    }, 320)
    return () => clearTimeout(timer)
  }, [animating, sound, setState])

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
    if (isOnline && !isMyTurn) return
    setRolling(true)
    const value = rollDice()
    setDiceResult(value)
    setTimeout(() => {
      setRolling(false)
      sound.play('roll')
      setState((s) => {
        const newSixesInTurn = value === 6 ? (s.sixesInTurn ?? 0) + 1 : 0

        if (newSixesInTurn >= 3) {
          return {
            ...s,
            diceValue: value,
            lastRoll: value,
            phase: 'roll' as const,
            currentPlayer: ((s.currentPlayer + 1) % numPlayers) as PlayerId,
            validMoves: [],
            sixesInTurn: 0,
          }
        }

        const next = { ...s, diceValue: value, lastRoll: value, sixesInTurn: newSixesInTurn }
        const valid = getValidMoves(next)

        if (valid.length > 0) {
          return { ...next, phase: 'move' as const, validMoves: valid }
        }

        if (value === 6) {
          return { ...next, phase: 'roll' as const, validMoves: [] }
        }

        return {
          ...next,
          phase: 'roll' as const,
          currentPlayer: ((s.currentPlayer + 1) % numPlayers) as PlayerId,
          validMoves: [],
          sixesInTurn: 0,
        }
      })
    }, 600)
  }, [state.phase, state.winner, rolling, animating, numPlayers, sound, setState])

  const handleTokenClick = useCallback(
    (player: PlayerId, tokenIndex: number) => {
      if (animating) return
      if (isOnline && player !== localPlayerId) return
      if (state.phase !== 'move' || state.currentPlayer !== player || !state.validMoves.includes(tokenIndex)) return

      const token = state.players[player].tokens[tokenIndex]
      const steps = getAnimationSteps(token.pathPosition, state.diceValue, numPlayers)
      const { state: newState, snakeLadderEffect, snakeLadderTo } = applyMove(state, tokenIndex)

      const allSteps = [...steps]
      if (snakeLadderEffect && snakeLadderTo != null) {
        allSteps.push(snakeLadderTo)
      }

      setAnimating({
        playerId: player,
        tokenIdx: tokenIndex,
        pathSteps: allSteps,
        currentStep: 0,
        finalState: newState,
        snakeLadderEffect,
        snakeLadderTo,
      })
    },
    [state, animating, numPlayers]
  )

  // AI auto-play
  useEffect(() => {
    if (!isAITurn || state.winner !== null || animating || rolling) return

    if (state.phase === 'roll') {
      const timer = setTimeout(() => handleRoll(), 800)
      return () => clearTimeout(timer)
    }

    if (state.phase === 'move' && state.validMoves.length > 0) {
      const bestMove = getAIMove(state)
      if (bestMove >= 0) {
        const timer = setTimeout(() => {
          handleTokenClick(state.currentPlayer, bestMove)
        }, 600)
        return () => clearTimeout(timer)
      }
    }
  }, [isAITurn, state.phase, state.currentPlayer, state.winner, animating, rolling, state.validMoves])

  const handleEmojiSelect = useCallback((emoji: string) => {
    const id = Date.now()
    const x = 40 + Math.random() * 20
    const y = 50
    setFloatingEmojis(prev => [...prev, { id, emoji, x, y }])
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id))
    }, 1500)
  }, [])

  const handleSendChat = useCallback((text: string) => {
    if (!text.trim()) return
    const myId = isOnline && localPlayerId != null ? localPlayerId : (0 as PlayerId)
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId: myId,
      text: text.trim(),
      timestamp: Date.now(),
    }
    setState(s => ({
      ...s,
      chatMessages: [...(s.chatMessages ?? []), msg],
    }))
    setChatInput('')
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [setState])

  useEffect(() => {
    if (state.currentPlayer !== prevPlayer) {
      setTurnFlash(true)
      setPrevPlayer(state.currentPlayer)
      const timer = setTimeout(() => setTurnFlash(false), 400)
      return () => clearTimeout(timer)
    }
  }, [state.currentPlayer, prevPlayer])

  const canRoll = state.phase === 'roll' && state.winner === null && !rolling && !animating && isMyTurn

  const topPlayers = numPlayers === 6 ? [1, 2, 3] : [1, 2]
  const bottomPlayers = numPlayers === 6 ? [0, 4, 5] : [0, 3]

  return (
    <div className="game-screen">
      <header className="game-header">
        <button type="button" className="btn-back" onClick={onBack}>&larr;</button>
        <h2 className="turn-label">
          {roomCode && <span className="room-code">Room: {roomCode}</span>}
          {!roomCode && gameMode !== 'classic' && (
            <span className="mode-badge-game">
              {gameMode === 'arrow' ? '\u{1F3F9}' : gameMode === 'blitz' ? '\u26A1' : '\u{1F40D}'} {gameMode === 'snakeladder' ? 'S&L' : gameMode.toUpperCase()}
            </span>
          )}
          {state.winner !== null ? (
            <span className="winner-msg">
              {isOnline && onlineNames?.[state.winner]
                ? `${onlineNames[state.winner]} wins!`
                : `${PLAYER_NAMES[state.winner]} wins!`}
            </span>
          ) : (
            <span style={{ color: PLAYER_COLORS[state.currentPlayer] }}>
              {isOnline
                ? (isMyTurn ? 'Your Turn' : `${onlineNames?.[state.currentPlayer] ?? PLAYER_NAMES[state.currentPlayer]}'s Turn`)
                : `${PLAYER_NAMES[state.currentPlayer]}'s Turn`}
              {isAITurn && <span className="ai-badge">AI</span>}
            </span>
          )}
        </h2>
        <div style={{ width: 32 }} />
      </header>

      {/* Player row - top */}
      <div className="player-row">
        {topPlayers.map(pid => {
          if (pid >= numPlayers) return null
          const isActive = state.currentPlayer === pid
          const isAI = (state.aiPlayers ?? []).includes(pid)
          return (
            <div key={pid} className={`player-indicator ${isActive ? 'active' : ''}${isActive && turnFlash ? ' turn-transition' : ''}`}>
              <div
                className="indicator-dot"
                style={{
                  background: PLAYER_COLORS[pid],
                  boxShadow: isActive ? `0 0 10px ${PLAYER_COLORS[pid]}` : 'none',
                }}
              />
              <span className="indicator-name">
                {PLAYER_NAMES[pid as PlayerId]}
                {isAI && ' (AI)'}
              </span>
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
          captures={state.captures}
        />
      </div>

      {/* Player row - bottom */}
      <div className="player-row">
        {bottomPlayers.map(pid => {
          if (pid >= numPlayers) return null
          const isActive = state.currentPlayer === pid
          const isAI = (state.aiPlayers ?? []).includes(pid)
          return (
            <div key={pid} className={`player-indicator ${isActive ? 'active' : ''}${isActive && turnFlash ? ' turn-transition' : ''}`}>
              <div
                className="indicator-dot"
                style={{
                  background: PLAYER_COLORS[pid],
                  boxShadow: isActive ? `0 0 10px ${PLAYER_COLORS[pid]}` : 'none',
                }}
              />
              <span className="indicator-name">
                {PLAYER_NAMES[pid as PlayerId]}
                {isAI && ' (AI)'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="game-controls">
        <div className="dice-container">
          <Dice
            value={diceResult}
            rolling={rolling}
            size={64}
            canRoll={canRoll && !isAITurn}
            onRoll={handleRoll}
            style={diceStyle}
          />
          {state.phase === 'move' && !animating && !isAITurn && (
            <span className="dice-hint">Pick a pawn</span>
          )}
          {isAITurn && state.winner === null && (
            <span className="dice-hint ai-thinking">AI thinking...</span>
          )}
        </div>

        {state.winner !== null &&
          (setControlledState ? (
            <button type="button" className="btn-new" onClick={onBack}>Leave</button>
          ) : (
            <button type="button" className="btn-new" onClick={() => setState(createInitialState(numPlayers, gameMode, aiPlayers))}>
              New Game
            </button>
          ))}
      </div>

      {/* Emoji/Chat bar */}
      <div className="game-bottom-bar">
        <button type="button" className="emoji-chat-btn" onClick={() => setShowEmoji(true)}>
          EMOJI
        </button>
        <button type="button" className="emoji-chat-btn" onClick={() => setShowChat(!showChat)}>
          CHAT {(state.chatMessages?.length ?? 0) > 0 && <span className="chat-badge">{state.chatMessages?.length}</span>}
        </button>
      </div>

      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>Chat</span>
            <button type="button" className="chat-close-btn" onClick={() => setShowChat(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {(state.chatMessages ?? []).length === 0 && (
              <div className="chat-empty">No messages yet</div>
            )}
            {(state.chatMessages ?? []).map(msg => (
              <div key={msg.id} className="chat-msg" style={{ borderLeftColor: PLAYER_COLORS[msg.playerId] }}>
                <span className="chat-msg-name" style={{ color: PLAYER_COLORS[msg.playerId] }}>
                  {PLAYER_NAMES[msg.playerId]}
                </span>
                <span className="chat-msg-text">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-quick-btns">
            {QUICK_CHAT.map(text => (
              <button key={text} type="button" className="chat-quick-btn" onClick={() => handleSendChat(text)}>
                {text}
              </button>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat(chatInput)}
              maxLength={100}
            />
            <button type="button" className="chat-send-btn" onClick={() => handleSendChat(chatInput)}>
              Send
            </button>
          </div>
        </div>
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

      {captureBurst && (
        <ParticleBurst
          x={captureBurst.x}
          y={captureBurst.y}
          color={captureBurst.color}
          onDone={() => setCaptureBurst(null)}
        />
      )}

      {state.winner !== null && <Confetti />}
    </div>
  )
}

function Confetti() {
  const COLORS = ['#E53935', '#43A047', '#FDD835', '#1E88E5', '#FFD700', '#FF8C00', '#7B68EE', '#E91E63']
  const SHAPES = ['', 'confetti-circle', 'confetti-triangle', 'confetti-strip']
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    color: COLORS[i % COLORS.length],
    size: `${5 + Math.random() * 7}px`,
    shape: SHAPES[i % SHAPES.length],
    drift: `${(Math.random() - 0.5) * 80}px`,
    duration: `${2 + Math.random() * 1.5}s`,
    rotation: `${Math.random() * 720}deg`,
  }))

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`confetti-piece ${p.shape}`}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            backgroundColor: p.color,
            width: p.size,
            height: p.shape === 'confetti-strip' ? `${parseInt(p.size) * 2.5}px` : p.size,
            '--drift': p.drift,
            '--rotation': p.rotation,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
