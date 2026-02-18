export const PLAYER_COLORS = ['#e53935', '#43a047', '#fdd835', '#1e88e5'] as const
export const PLAYER_NAMES = ['Red', 'Green', 'Yellow', 'Blue'] as const
export type PlayerId = 0 | 1 | 2 | 3

export type GameMode = 'classic' | 'arrow' | 'blitz'

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
  gameMode: GameMode
}

export const SAFE_TRACK_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47] as const
export const START_TRACK_INDEX: Record<PlayerId, number> = { 0: 0, 1: 13, 2: 26, 3: 39 }

/**
 * Arrow mode shortcuts: [fromTrackIndex, toTrackIndex]
 * When a pawn lands on fromTrackIndex, it teleports to toTrackIndex.
 * Placed symmetrically, one per quadrant.
 */
export const ARROW_SHORTCUTS: [number, number][] = [
  [4, 14],   // top-left area → jump forward 10
  [17, 27],  // top-right area → jump forward 10
  [30, 40],  // bottom-right area → jump forward 10
  [43, 1],   // bottom-left area → wraps around forward 10 (43+10=53%52=1)
]
