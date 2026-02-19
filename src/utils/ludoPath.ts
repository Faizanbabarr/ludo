import type { PlayerId } from '../types/game'
import { getTrackLength, getStartIndex } from '../types/game'

// 4-player defaults (used as constants for backward compat)
export const PATH_BASE = 0
export const PATH_TRACK_START = 1
export const PATH_TRACK_END = 52
export const PATH_HOME_START = 53
export const PATH_DONE = 58

/** Dynamic path values based on player count */
export function trackEnd(numPlayers: number): number { return getTrackLength(numPlayers) }
export function homeStart(numPlayers: number): number { return trackEnd(numPlayers) + 1 }
export function done(numPlayers: number): number { return homeStart(numPlayers) + 5 }

/** Path position 1-N -> track index 0-(N-1) for given player */
export function pathToTrackIndex(player: PlayerId, pathPos: number, numPlayers: number = 4): number | null {
  const tl = getTrackLength(numPlayers)
  if (pathPos < 1 || pathPos > tl) return null
  const start = getStartIndex(player, numPlayers)
  return (start + pathPos - 1) % tl
}

/** Path position -> home index */
export function pathToHomeIndex(pathPos: number, numPlayers: number = 4): number | null {
  const hs = homeStart(numPlayers)
  const d = done(numPlayers)
  if (pathPos < hs || pathPos > d) return null
  if (pathPos === d) return 5
  return pathPos - hs
}

/** Is this path position on the main track? */
export function isOnTrack(pathPos: number, numPlayers: number = 4): boolean {
  return pathPos >= 1 && pathPos <= trackEnd(numPlayers)
}

/** Is this path position in home stretch? */
export function isInHomeStretch(pathPos: number, numPlayers: number = 4): boolean {
  return pathPos >= homeStart(numPlayers) && pathPos <= done(numPlayers)
}

/** Is token finished? */
export function isFinished(pathPos: number, numPlayers: number = 4): boolean {
  return pathPos === done(numPlayers)
}
