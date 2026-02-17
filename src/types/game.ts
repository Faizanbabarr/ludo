export const PLAYER_COLORS = ['#e53935', '#43a047', '#fdd835', '#1e88e5'] as const
export const PLAYER_NAMES = ['Red', 'Green', 'Yellow', 'Blue'] as const
export type PlayerId = 0 | 1 | 2 | 3

export interface Token {
  pathPosition: number // 0 = base, 1-52 = track, 53-57 = home, 58 = done
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
  numPlayers: 2 | 3 | 4
}

export const SAFE_TRACK_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47] as const
export const START_TRACK_INDEX: Record<PlayerId, number> = { 0: 0, 1: 13, 2: 26, 3: 39 }
