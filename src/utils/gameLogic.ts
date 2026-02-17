import type { GameState, PlayerId } from '../types/game'
import { SAFE_TRACK_INDEXES, START_TRACK_INDEX } from '../types/game'
import { PATH_BASE, PATH_DONE, PATH_HOME_START } from './ludoPath'

function getTrackIndex(player: PlayerId, pathPos: number): number | null {
  if (pathPos < 1 || pathPos > 52) return null
  const start = START_TRACK_INDEX[player]
  return (start + pathPos - 1) % 52
}

function isSafeTrackIndex(trackIndex: number): boolean {
  return SAFE_TRACK_INDEXES.includes(trackIndex as (typeof SAFE_TRACK_INDEXES)[number])
}

/** Get valid token indices for current player after a roll */
export function getValidMoves(state: GameState): number[] {
  const { players, currentPlayer, diceValue } = state
  const player = players[currentPlayer]
  const valid: number[] = []

  if (diceValue === 6) {
    // Can bring a token from base
    const inBase = player.tokens.findIndex((t) => t.pathPosition === PATH_BASE)
    if (inBase !== -1) {
      if (!player.tokens.some((t, i) => i !== inBase && t.pathPosition === 1)) valid.push(inBase)
    }
  }

  player.tokens.forEach((token, idx) => {
    if (token.pathPosition === PATH_BASE || token.pathPosition === PATH_DONE) return
    const nextPos = token.pathPosition + diceValue

    if (nextPos > PATH_DONE) return // overshoot
    if (nextPos === PATH_DONE) {
      valid.push(idx)
      return
    }
    // Same color can't stack (except in base/home)
    if (nextPos >= PATH_HOME_START && nextPos < PATH_DONE) {
      if (!player.tokens.some((t, i) => i !== idx && t.pathPosition === nextPos)) valid.push(idx)
      return
    }
    if (nextPos <= 52) {
      if (!player.tokens.some((t, i) => i !== idx && t.pathPosition === nextPos)) valid.push(idx)
    }
  })

  return valid
}

/** Apply move: move token and handle capture; returns new state and whether to give extra roll (rolled 6) */
export function applyMove(state: GameState, tokenIndex: number): { state: GameState; extraRoll: boolean } {
  const player = state.players[state.currentPlayer]
  const token = player.tokens[tokenIndex]
  const diceValue = state.diceValue
  const nextPos = token.pathPosition + diceValue

  const newPlayers = state.players.map((p) => ({
    ...p,
    tokens: p.tokens.map((t) => ({ ...t })),
  })) as GameState['players']

  // Move token (from base with 6 -> enter at 1)
  const fromBase = token.pathPosition === PATH_BASE
  const newPos = fromBase ? 1 : Math.min(nextPos, PATH_DONE)
  newPlayers[state.currentPlayer].tokens[tokenIndex] = { pathPosition: newPos }

  // Capture: if landed on track, send opponent tokens at same track cell back to base
  const landedPos = fromBase ? 1 : nextPos
  if (landedPos >= 1 && landedPos <= 52) {
    const myTrackIndex = getTrackIndex(state.currentPlayer, landedPos)!
    if (!isSafeTrackIndex(myTrackIndex)) {
      newPlayers.forEach((p, pid) => {
        if (pid === state.currentPlayer) return
        p.tokens.forEach((t, ti) => {
          if (t.pathPosition >= 1 && t.pathPosition <= 52) {
            const theirTrack = getTrackIndex(pid as PlayerId, t.pathPosition)
            if (theirTrack === myTrackIndex) {
              newPlayers[pid].tokens[ti] = { pathPosition: PATH_BASE }
            }
          }
        })
      })
    }
  }

  const winner = checkWinner(newPlayers[state.currentPlayer].tokens) ? state.currentPlayer : null
  const extraRoll = diceValue === 6
  const next = nextPlayer(state.currentPlayer, state.numPlayers)

  return {
    state: {
      ...state,
      players: newPlayers,
      phase: winner !== null ? 'gameover' : extraRoll ? 'roll' : 'roll',
      currentPlayer: winner !== null ? state.currentPlayer : extraRoll ? state.currentPlayer : next,
      validMoves: [],
      winner,
    },
    extraRoll,
  }
}

function nextPlayer(current: PlayerId, num: 2 | 3 | 4): PlayerId {
  return ((current + 1) % num) as PlayerId
}

function checkWinner(tokens: { pathPosition: number }[]): boolean {
  return tokens.every((t) => t.pathPosition === PATH_DONE)
}

/** Create initial game state */
export function createInitialState(numPlayers: 2 | 3 | 4): GameState {
  const players = [0, 1, 2, 3].slice(0, numPlayers).map((id) => ({
    id: id as PlayerId,
    tokens: Array.from({ length: 4 }, () => ({ pathPosition: PATH_BASE })),
  })) as GameState['players']
  return {
    players,
    currentPlayer: 0,
    diceValue: 0,
    phase: 'roll',
    winner: null,
    lastRoll: 0,
    validMoves: [],
    numPlayers,
  }
}
