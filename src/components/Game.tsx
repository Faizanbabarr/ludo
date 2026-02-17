import { useCallback, useState } from 'react'
import { Board } from './Board'
import { Dice } from './Dice'
import { useSound } from '../hooks/useSound'
import type { GameState, PlayerId } from '../types/game'
import { PLAYER_NAMES } from '../types/game'
import { applyMove, createInitialState, getValidMoves } from '../utils/gameLogic'

interface GameProps {
  numPlayers: 2 | 3 | 4
  onBack: () => void
  /** When provided, game is controlled (e.g. online sync) */
  state?: GameState
  setState?: (s: GameState | ((prev: GameState) => GameState)) => void
  /** Show when online so players can share the code */
  roomCode?: string | null
}

function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function Game({ numPlayers, onBack, state: controlledState, setState: setControlledState, roomCode }: GameProps) {
  const [localState, setLocalState] = useState<GameState>(() => createInitialState(numPlayers))
  const state = controlledState ?? localState
  const setState = setControlledState ?? setLocalState
  const [rolling, setRolling] = useState(false)
  const sound = useSound()

  const handleRoll = useCallback(() => {
    if (state.phase !== 'roll' || state.winner !== null) return
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
  }, [state.phase, state.winner, state, numPlayers])

  const handleTokenClick = useCallback(
    (player: PlayerId, tokenIndex: number) => {
      if (state.phase !== 'move' || state.currentPlayer !== player || !state.validMoves.includes(tokenIndex)) return
      const { state: newState } = applyMove(state, tokenIndex)
      if (newState.winner !== null) sound.play('win')
      else sound.play('move')
      setState(newState)
    },
    [state, sound]
  )

  const canRoll = state.phase === 'roll' && state.winner === null && !rolling

  return (
    <div className="game-screen">
      <header className="game-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2 className="turn-label">
          {roomCode && <span className="room-code">Room: {roomCode}</span>}
          {state.winner !== null ? (
            <span className="winner-msg">{PLAYER_NAMES[state.winner]} wins!</span>
          ) : (
            <span>Turn: {PLAYER_NAMES[state.currentPlayer]}</span>
          )}
        </h2>
      </header>

      <div className="game-board-area">
        <Board
          state={state}
          onTokenClick={handleTokenClick}
          validMoves={state.validMoves}
          currentPlayer={state.currentPlayer}
        />
      </div>

      <div className="game-controls">
        <div className="dice-area">
          <Dice value={state.lastRoll || 1} rolling={rolling} size={56} />
          <span className="dice-label">{state.lastRoll ? `Rolled: ${state.lastRoll}` : 'Roll'}</span>
        </div>
        <button type="button" className="btn-roll" onClick={handleRoll} disabled={!canRoll}>
          {canRoll ? 'Roll dice' : state.phase === 'move' ? 'Choose a token' : 'Rolling...'}
        </button>
        {state.winner !== null &&
          (setControlledState ? (
            <button type="button" className="btn-new" onClick={onBack}>
              Leave game
            </button>
          ) : (
            <button type="button" className="btn-new" onClick={() => setState(createInitialState(numPlayers))}>
              New game
            </button>
          ))}
      </div>
    </div>
  )
}
