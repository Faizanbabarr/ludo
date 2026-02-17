import type { PlayerId } from '../types/game'

const TRACK_LENGTH = 52
export const PATH_BASE = 0
export const PATH_TRACK_START = 1
export const PATH_TRACK_END = 52
export const PATH_HOME_START = 53
export const PATH_DONE = 58

/** Path position 1-52 -> track index 0-51 for given player */
export function pathToTrackIndex(player: PlayerId, pathPos: number): number | null {
  if (pathPos < PATH_TRACK_START || pathPos > PATH_TRACK_END) return null
  const start = { 0: 0, 1: 13, 2: 26, 3: 39 }[player]
  const stepsFromStart = pathPos - PATH_TRACK_START
  return (start + stepsFromStart) % TRACK_LENGTH
}

/** Path position 53-57 -> home index 0-4, 58 -> done */
export function pathToHomeIndex(pathPos: number): number | null {
  if (pathPos < PATH_HOME_START || pathPos > PATH_DONE) return null
  if (pathPos === PATH_DONE) return 5 // finished
  return pathPos - PATH_HOME_START
}

/** Is this path position on the main track? */
export function isOnTrack(pathPos: number): boolean {
  return pathPos >= PATH_TRACK_START && pathPos <= PATH_TRACK_END
}

/** Is this path position in home stretch? */
export function isInHomeStretch(pathPos: number): boolean {
  return pathPos >= PATH_HOME_START && pathPos <= PATH_DONE
}

/** Is token finished? */
export function isFinished(pathPos: number): boolean {
  return pathPos === PATH_DONE
}
