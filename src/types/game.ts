export const PLAYER_COLORS = ['#e53935', '#43a047', '#fdd835', '#1e88e5', '#9C27B0', '#FF9800'] as const
export const PLAYER_NAMES = ['Red', 'Green', 'Yellow', 'Blue', 'Purple', 'Orange'] as const
export type PlayerId = 0 | 1 | 2 | 3 | 4 | 5

export type GameMode = 'classic' | 'arrow' | 'blitz' | 'snakeladder'

export interface Token {
  pathPosition: number // 0 = base, 1-N = track, N+1 to N+5 = home, N+6 = done
}

export interface Player {
  id: PlayerId
  tokens: Token[]
}

export type GamePhase = 'roll' | 'move' | 'gameover'

export interface GameState {
  players: Player[]
  currentPlayer: PlayerId
  diceValue: number
  phase: GamePhase
  winner: PlayerId | null
  lastRoll: number
  validMoves: number[] // indices of tokens that can move
  numPlayers: 2 | 3 | 4 | 6
  gameMode: GameMode
  captures: number[] // captures[playerId] = number of opponent tokens captured
  sixesInTurn: number // consecutive 6s rolled in current turn (voided at 3)
  aiPlayers?: number[] // player indices controlled by AI
  chatMessages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  playerId: PlayerId
  text: string
  timestamp: number
}

// 4-player constants
export const SAFE_TRACK_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47] as const
export const START_TRACK_INDEX: Record<number, number> = { 0: 0, 1: 13, 2: 26, 3: 39 }

// 6-player constants
export const SAFE_TRACK_INDEXES_6P = [0, 8, 12, 20, 24, 32, 36, 44, 48, 56, 60, 68] as const
export const START_TRACK_INDEX_6P: Record<number, number> = { 0: 0, 1: 12, 2: 24, 3: 36, 4: 48, 5: 60 }

/** Helper: get track length based on player count */
export function getTrackLength(numPlayers: number): number {
  return numPlayers <= 4 ? 52 : 72
}

/** Helper: get start track index for a player */
export function getStartIndex(player: number, numPlayers: number): number {
  if (numPlayers <= 4) return START_TRACK_INDEX[player] ?? 0
  return START_TRACK_INDEX_6P[player] ?? 0
}

/** Helper: check if a track index is safe */
export function isSafeIndex(trackIdx: number, numPlayers: number): boolean {
  if (numPlayers <= 4) return (SAFE_TRACK_INDEXES as readonly number[]).includes(trackIdx)
  return (SAFE_TRACK_INDEXES_6P as readonly number[]).includes(trackIdx)
}

// Arrow shortcuts (4P)
export const ARROW_SHORTCUTS: [number, number][] = [
  [8, 18],
  [21, 31],
  [34, 44],
  [47, 5],
]

// Arrow shortcuts (6P)
export const ARROW_SHORTCUTS_6P: [number, number][] = [
  [8, 18],
  [20, 30],
  [32, 42],
  [44, 54],
  [56, 66],
  [68, 6],
]

/** Get arrow shortcuts for player count */
export function getArrowShortcuts(numPlayers: number): [number, number][] {
  return numPlayers <= 4 ? ARROW_SHORTCUTS : ARROW_SHORTCUTS_6P
}

// Snake & Ladder (4P only)
export const SNAKES: [number, number][] = [
  [10, 3],
  [24, 16],
  [37, 29],
  [49, 42],
]

export const LADDERS: [number, number][] = [
  [5, 15],
  [18, 28],
  [31, 41],
  [44, 2],
]
