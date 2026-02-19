import type { GameState, GameMode, PlayerId } from '../types/game'
import { getTrackLength, getStartIndex, isSafeIndex, getArrowShortcuts, SNAKES, LADDERS } from '../types/game'
import { PATH_BASE } from './ludoPath'
import { trackEnd, homeStart, done } from './ludoPath'

function getTrackIndex(player: PlayerId, pathPos: number, numPlayers: number): number | null {
  const tl = getTrackLength(numPlayers)
  if (pathPos < 1 || pathPos > tl) return null
  const start = getStartIndex(player, numPlayers)
  return (start + pathPos - 1) % tl
}

/** Convert track index back to path position for a given player */
function trackIndexToPathPos(player: PlayerId, trackIdx: number, numPlayers: number): number {
  const tl = getTrackLength(numPlayers)
  const start = getStartIndex(player, numPlayers)
  return ((trackIdx - start + tl) % tl) + 1
}

/** All modes have safe spots */
function isSafeTrackIndex(trackIndex: number, numPlayers: number): boolean {
  return isSafeIndex(trackIndex, numPlayers)
}

/** All modes need a 6 to exit base */
function canExitBase(diceValue: number): boolean {
  return diceValue === 6
}

/** Arrow shortcuts work in Arrow and Blitz modes */
function getArrowDestination(trackIdx: number, gameMode: GameMode, numPlayers: number): number | null {
  if (gameMode !== 'arrow' && gameMode !== 'blitz') return null
  const shortcuts = getArrowShortcuts(numPlayers)
  const shortcut = shortcuts.find(([from]) => from === trackIdx)
  return shortcut ? shortcut[1] : null
}

/** Resolve final landing position after arrow shortcuts */
function resolveArrowLanding(player: PlayerId, pathPos: number, gameMode: GameMode, numPlayers: number): number {
  const tl = getTrackLength(numPlayers)
  if ((gameMode !== 'arrow' && gameMode !== 'blitz') || pathPos < 1 || pathPos > tl) return pathPos
  const trackIdx = getTrackIndex(player, pathPos, numPlayers)
  if (trackIdx === null) return pathPos
  const arrowDest = getArrowDestination(trackIdx, gameMode, numPlayers)
  if (arrowDest === null) return pathPos
  const destPathPos = trackIndexToPathPos(player, arrowDest, numPlayers)
  return destPathPos <= tl ? destPathPos : pathPos
}

/** Get snake or ladder destination if landing on a special cell */
function getSnakeLadderDestination(trackIdx: number, gameMode: GameMode): { dest: number; type: 'snake' | 'ladder' } | null {
  if (gameMode !== 'snakeladder') return null
  const snake = SNAKES.find(([head]) => head === trackIdx)
  if (snake) return { dest: snake[1], type: 'snake' }
  const ladder = LADDERS.find(([bottom]) => bottom === trackIdx)
  if (ladder) return { dest: ladder[1], type: 'ladder' }
  return null
}

/** Resolve final landing position after snake/ladder effects */
function resolveSnakeLadderLanding(player: PlayerId, pathPos: number, gameMode: GameMode, numPlayers: number): { pathPos: number; effect: 'snake' | 'ladder' | null } {
  const tl = getTrackLength(numPlayers)
  if (gameMode !== 'snakeladder' || pathPos < 1 || pathPos > tl) return { pathPos, effect: null }
  const trackIdx = getTrackIndex(player, pathPos, numPlayers)
  if (trackIdx === null) return { pathPos, effect: null }
  const result = getSnakeLadderDestination(trackIdx, gameMode)
  if (!result) return { pathPos, effect: null }
  const destPathPos = trackIndexToPathPos(player, result.dest, numPlayers)
  if (destPathPos >= 1 && destPathPos <= tl) return { pathPos: destPathPos, effect: result.type }
  return { pathPos, effect: null }
}

// ─── Stack Check (for capture immunity) ───

/** Check if a player has 2+ tokens (a stack) at a given track index */
function hasStackAt(players: GameState['players'], playerId: number, trackIdx: number, numPlayers: number): boolean {
  const player = players[playerId]
  const tl = getTrackLength(numPlayers)
  let count = 0
  for (const token of player.tokens) {
    if (token.pathPosition >= 1 && token.pathPosition <= tl) {
      const ti = getTrackIndex(playerId as PlayerId, token.pathPosition, numPlayers)
      if (ti === trackIdx) count++
    }
  }
  return count >= 2
}

// ─── Valid Moves ───

/** Get valid token indices for current player after a roll */
export function getValidMoves(state: GameState): number[] {
  const { players, currentPlayer, diceValue, gameMode, captures, numPlayers } = state
  const player = players[currentPlayer]
  const valid: number[] = []
  const playerCaptures = captures[currentPlayer] ?? 0
  const tl = trackEnd(numPlayers)
  const hs = homeStart(numPlayers)
  const d = done(numPlayers)

  // Home entry blocked only in Blitz mode when no captures
  const homeBlocked = gameMode === 'blitz' && playerCaptures === 0

  // Exit from base - all modes need 6
  if (canExitBase(diceValue)) {
    player.tokens.forEach((token, idx) => {
      if (token.pathPosition === PATH_BASE) valid.push(idx)
    })
  }

  // Move tokens already on the board
  player.tokens.forEach((token, idx) => {
    if (token.pathPosition === PATH_BASE || token.pathPosition === d) return
    const nextPos = token.pathPosition + diceValue

    if (nextPos > d) return // overshoot

    // Block home entry if player has no captures (Blitz only)
    if (homeBlocked && nextPos >= hs) return

    if (nextPos === d) {
      valid.push(idx)
      return
    }

    // Home stretch - prevent own token stacking (one token per cell)
    if (nextPos >= hs && nextPos < d) {
      if (!player.tokens.some((t, i) => i !== idx && t.pathPosition === nextPos)) valid.push(idx)
      return
    }

    // Main track - no blocking, stacking allowed
    if (nextPos <= tl) {
      // Resolve arrow shortcut (Arrow + Blitz modes)
      let finalPos = resolveArrowLanding(currentPlayer, nextPos, gameMode, numPlayers)
      // Resolve snake/ladder
      const slResult = resolveSnakeLadderLanding(currentPlayer, finalPos, gameMode, numPlayers)
      finalPos = slResult.pathPos

      // Multiple tokens of same color CAN occupy same track cell
      // No path blocking by opponents
      valid.push(idx)
    }
  })

  return valid
}

// ─── Apply Move ───

/** Apply move: move token and handle capture; returns new state */
export function applyMove(state: GameState, tokenIndex: number): { state: GameState; extraRoll: boolean; snakeLadderEffect?: 'snake' | 'ladder' | null; snakeLadderFrom?: number | null; snakeLadderTo?: number | null } {
  const { numPlayers } = state
  const player = state.players[state.currentPlayer]
  const token = player.tokens[tokenIndex]
  const diceValue = state.diceValue
  const nextPos = token.pathPosition + diceValue
  const gameMode = state.gameMode
  const tl = trackEnd(numPlayers)
  const d = done(numPlayers)

  const newPlayers = state.players.map((p) => ({
    ...p,
    tokens: p.tokens.map((t) => ({ ...t })),
  })) as GameState['players']

  // Move token (from base -> enter at 1)
  const fromBase = token.pathPosition === PATH_BASE
  let newPos = fromBase ? 1 : Math.min(nextPos, d)

  // Arrow mode + Blitz: check for shortcut teleport (only on track positions)
  const preArrowPos = newPos
  newPos = resolveArrowLanding(state.currentPlayer, newPos, gameMode, numPlayers)
  const arrowTeleported = newPos !== preArrowPos

  // Snake & Ladder mode: check for snake/ladder teleport
  let snakeLadderEffect: 'snake' | 'ladder' | null = null
  let snakeLadderFrom: number | null = null
  let snakeLadderTo: number | null = null
  if (newPos >= 1 && newPos <= tl) {
    const slResult = resolveSnakeLadderLanding(state.currentPlayer, newPos, gameMode, numPlayers)
    if (slResult.effect) {
      snakeLadderEffect = slResult.effect
      snakeLadderFrom = newPos
      snakeLadderTo = slResult.pathPos
      newPos = slResult.pathPos
    }
  }

  newPlayers[state.currentPlayer].tokens[tokenIndex] = { pathPosition: newPos }

  // Capture: if landed on track, send opponent tokens at same track cell back to base
  // Stacked same-color tokens (2+) are immune from capture
  // Safe spots are immune from capture
  const newCaptures = [...state.captures]
  let capturedAny = false
  if (newPos >= 1 && newPos <= tl) {
    const myTrackIndex = getTrackIndex(state.currentPlayer, newPos, numPlayers)!
    if (!isSafeTrackIndex(myTrackIndex, numPlayers)) {
      // Identify immune opponents (those with 2+ tokens stacked at this cell)
      const immuneOpponents = new Set<number>()
      for (let pid = 0; pid < numPlayers; pid++) {
        if (pid === state.currentPlayer) continue
        if (hasStackAt(state.players, pid, myTrackIndex, numPlayers)) {
          immuneOpponents.add(pid)
        }
      }

      newPlayers.forEach((p, pid) => {
        if (pid === state.currentPlayer || immuneOpponents.has(pid)) return
        p.tokens.forEach((t, ti) => {
          if (t.pathPosition >= 1 && t.pathPosition <= tl) {
            const theirTrack = getTrackIndex(pid as PlayerId, t.pathPosition, numPlayers)
            if (theirTrack === myTrackIndex) {
              newPlayers[pid].tokens[ti] = { pathPosition: PATH_BASE }
              newCaptures[state.currentPlayer]++
              capturedAny = true
            }
          }
        })
      })
    }
  }

  const reachedHome = newPos === d
  const winner = checkWinner(newPlayers[state.currentPlayer].tokens, state.gameMode, numPlayers) ? state.currentPlayer : null
  // Bonus rolls: rolling 6, capturing, reaching home, or arrow teleport
  const extraRoll = diceValue === 6 || capturedAny || reachedHome || arrowTeleported
  const next = nextPlayer(state.currentPlayer, numPlayers)

  return {
    state: {
      ...state,
      players: newPlayers,
      captures: newCaptures,
      phase: winner !== null ? 'gameover' : 'roll',
      currentPlayer: winner !== null ? state.currentPlayer : extraRoll ? state.currentPlayer : next,
      validMoves: [],
      winner,
      sixesInTurn: extraRoll ? (state.sixesInTurn ?? 0) : 0,
    },
    extraRoll,
    snakeLadderEffect,
    snakeLadderFrom,
    snakeLadderTo,
  }
}

function nextPlayer(current: PlayerId, num: number): PlayerId {
  return ((current + 1) % num) as PlayerId
}

/** Blitz: first player to get 1 token home wins. Others: all 4 tokens home. */
function checkWinner(tokens: { pathPosition: number }[], gameMode: GameMode, numPlayers: number): boolean {
  const d = done(numPlayers)
  if (gameMode === 'blitz') {
    return tokens.some((t) => t.pathPosition === d)
  }
  return tokens.every((t) => t.pathPosition === d)
}

/** Create initial game state */
export function createInitialState(numPlayers: 2 | 3 | 4 | 6, gameMode: GameMode = 'classic', aiPlayers?: number[]): GameState {
  const playerIds = Array.from({ length: numPlayers }, (_, i) => i)
  const players = playerIds.map((id) => ({
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
    captures: Array(numPlayers).fill(0),
    sixesInTurn: 0,
    aiPlayers,
    chatMessages: [],
  }
}

/** AI: pick the best token to move */
export function getAIMove(state: GameState): number {
  const { currentPlayer, validMoves, diceValue, numPlayers, players } = state
  if (validMoves.length === 0) return -1
  if (validMoves.length === 1) return validMoves[0]

  const player = players[currentPlayer]
  const tl = trackEnd(numPlayers)

  // Score each valid move
  let bestIdx = validMoves[0]
  let bestScore = -Infinity

  for (const tokenIdx of validMoves) {
    const token = player.tokens[tokenIdx]
    let score = 0

    // Exiting base - moderate priority
    if (token.pathPosition === PATH_BASE) {
      score = 30
    } else {
      const newPos = token.pathPosition + diceValue

      // Reaching home - highest priority
      if (newPos === done(numPlayers)) {
        score = 100
      }
      // Moving into home stretch - high priority
      else if (newPos > tl) {
        score = 70
      }
      // Check for capture opportunity
      else if (newPos <= tl) {
        const trackIdx = getTrackIndexForAI(currentPlayer, newPos, numPlayers)
        if (trackIdx !== null && !isSafeIndex(trackIdx, numPlayers)) {
          const canCapture = players.some((p, pid) => {
            if (pid === currentPlayer) return false
            return p.tokens.some(t => {
              if (t.pathPosition < 1 || t.pathPosition > tl) return false
              const theirTrack = getTrackIndexForAI(pid as PlayerId, t.pathPosition, numPlayers)
              return theirTrack === trackIdx
            })
          })
          if (canCapture) score = 80 // capture is very valuable
        }
        // Moving to safe spot
        if (trackIdx !== null && isSafeIndex(trackIdx, numPlayers)) {
          score += 15
        }
        // Advance furthest token
        score += token.pathPosition * 0.5
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestIdx = tokenIdx
    }
  }

  return bestIdx
}

function getTrackIndexForAI(player: PlayerId | number, pathPos: number, numPlayers: number): number | null {
  const tl = getTrackLength(numPlayers)
  if (pathPos < 1 || pathPos > tl) return null
  const start = getStartIndex(player as number, numPlayers)
  return (start + pathPos - 1) % tl
}
