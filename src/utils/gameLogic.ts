import type { GameState, GameMode, PlayerId } from '../types/game'
import { SAFE_TRACK_INDEXES, START_TRACK_INDEX, ARROW_SHORTCUTS } from '../types/game'
import { PATH_BASE, PATH_DONE, PATH_HOME_START } from './ludoPath'

function getTrackIndex(player: PlayerId, pathPos: number): number | null {
  if (pathPos < 1 || pathPos > 52) return null
  const start = START_TRACK_INDEX[player]
  return (start + pathPos - 1) % 52
}

/** Convert track index back to path position for a given player */
function trackIndexToPathPos(player: PlayerId, trackIdx: number): number {
  const start = START_TRACK_INDEX[player]
  return ((trackIdx - start + 52) % 52) + 1
}

function isSafeTrackIndex(trackIndex: number, gameMode: GameMode): boolean {
  // Blitz mode: no safe spots
  if (gameMode === 'blitz') return false
  return SAFE_TRACK_INDEXES.includes(trackIndex as (typeof SAFE_TRACK_INDEXES)[number])
}

/** Check if player can exit base with this dice value */
function canExitBase(diceValue: number, gameMode: GameMode): boolean {
  // Blitz: any roll can exit base
  if (gameMode === 'blitz') return true
  // Classic/Arrow: need a 6
  return diceValue === 6
}

/** Get the arrow destination track index if landing on an arrow cell */
function getArrowDestination(trackIdx: number, gameMode: GameMode): number | null {
  if (gameMode !== 'arrow') return null
  const shortcut = ARROW_SHORTCUTS.find(([from]) => from === trackIdx)
  return shortcut ? shortcut[1] : null
}

/** Resolve final landing position after arrow shortcuts */
function resolveArrowLanding(player: PlayerId, pathPos: number, gameMode: GameMode): number {
  if (gameMode !== 'arrow' || pathPos < 1 || pathPos > 52) return pathPos
  const trackIdx = getTrackIndex(player, pathPos)
  if (trackIdx === null) return pathPos
  const arrowDest = getArrowDestination(trackIdx, gameMode)
  if (arrowDest === null) return pathPos
  const destPathPos = trackIndexToPathPos(player, arrowDest)
  // Only apply if destination is still on track (not past into home stretch)
  return destPathPos <= 52 ? destPathPos : pathPos
}

/** Get valid token indices for current player after a roll */
export function getValidMoves(state: GameState): number[] {
  const { players, currentPlayer, diceValue, gameMode } = state
  const player = players[currentPlayer]
  const valid: number[] = []

  if (canExitBase(diceValue, gameMode)) {
    // Can bring any token from base (if starting cell is not occupied by own token)
    const startOccupied = player.tokens.some((t) => t.pathPosition === 1)
    if (!startOccupied) {
      player.tokens.forEach((token, idx) => {
        if (token.pathPosition === PATH_BASE) valid.push(idx)
      })
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
      // Check arrow shortcut destination for collision with own token
      const finalPos = resolveArrowLanding(currentPlayer, nextPos, gameMode)
      if (!player.tokens.some((t, i) => i !== idx && t.pathPosition === finalPos)) valid.push(idx)
    }
  })

  return valid
}

/** Apply move: move token and handle capture; returns new state and whether to give extra roll */
export function applyMove(state: GameState, tokenIndex: number): { state: GameState; extraRoll: boolean } {
  const player = state.players[state.currentPlayer]
  const token = player.tokens[tokenIndex]
  const diceValue = state.diceValue
  const nextPos = token.pathPosition + diceValue
  const gameMode = state.gameMode

  const newPlayers = state.players.map((p) => ({
    ...p,
    tokens: p.tokens.map((t) => ({ ...t })),
  })) as GameState['players']

  // Move token (from base -> enter at 1)
  const fromBase = token.pathPosition === PATH_BASE
  let newPos = fromBase ? 1 : Math.min(nextPos, PATH_DONE)

  // Arrow mode: check for shortcut teleport (only on track positions 1-52)
  newPos = resolveArrowLanding(state.currentPlayer, newPos, gameMode)

  newPlayers[state.currentPlayer].tokens[tokenIndex] = { pathPosition: newPos }

  // Capture: if landed on track, send opponent tokens at same track cell back to base
  if (newPos >= 1 && newPos <= 52) {
    const myTrackIndex = getTrackIndex(state.currentPlayer, newPos)!
    if (!isSafeTrackIndex(myTrackIndex, gameMode)) {
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
      phase: winner !== null ? 'gameover' : 'roll',
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
export function createInitialState(numPlayers: 2 | 3 | 4, gameMode: GameMode = 'classic'): GameState {
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
    gameMode,
  }
}
