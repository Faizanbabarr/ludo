import type { PlayerId } from '../types/game'
import { PATH_BASE, PATH_DONE, PATH_HOME_START, PATH_TRACK_END } from './ludoPath'

const CX = 50
const CY = 50
const TRACK_R = 42
const HOME_R = 8

/** Angle for track index 0-51. Red start (0) at bottom. */
function trackIndexToAngle(trackIndex: number): number {
  return -90 + (trackIndex / 52) * 360
}

function angleToXY(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + (r / 100) * 50 * Math.cos(rad), y: CY + (r / 100) * 50 * Math.sin(rad) }
}

/** Path position 1-52 -> track index for player (for drawing we use global track index) */
function pathToTrackIndex(player: PlayerId, pathPos: number): number {
  const start = { 0: 0, 1: 13, 2: 26, 3: 39 }[player]
  return (start + pathPos - 1) % 52
}

/** Get (x, y) in 0-100 svg coords for a token. viewBox 0 100 100. */
export function getTokenCoords(
  player: PlayerId,
  pathPosition: number,
  tokenOffset: number
): { x: number; y: number } {
  const off = (tokenOffset - 1.5) * 2
  if (pathPosition === PATH_BASE) {
    /* Base rects are at (16,51), (51,51), (51,16), (16,16) size 15 - centers below */
    const baseCenters: Record<PlayerId, { x: number; y: number }> = {
      0: { x: 23.5, y: 58.5 },
      1: { x: 58.5, y: 58.5 },
      2: { x: 58.5, y: 23.5 },
      3: { x: 23.5, y: 23.5 },
    }
    const half = 3.75
    const baseOff: Record<PlayerId, { dx: number; dy: number }[]> = {
      0: [{ dx: -half, dy: -half }, { dx: half, dy: -half }, { dx: -half, dy: half }, { dx: half, dy: half }],
      1: [{ dx: -half, dy: -half }, { dx: half, dy: -half }, { dx: -half, dy: half }, { dx: half, dy: half }],
      2: [{ dx: -half, dy: -half }, { dx: half, dy: -half }, { dx: -half, dy: half }, { dx: half, dy: half }],
      3: [{ dx: -half, dy: -half }, { dx: half, dy: -half }, { dx: -half, dy: half }, { dx: half, dy: half }],
    }
    const c = baseCenters[player]
    const d = baseOff[player][tokenOffset]
    return { x: c.x + d.dx, y: c.y + d.dy }
  }
  if (pathPosition === PATH_DONE) {
    const homeCenters: Record<PlayerId, { x: number; y: number }> = {
      0: { x: 50, y: 50 },
      1: { x: 50, y: 50 },
      2: { x: 50, y: 50 },
      3: { x: 50, y: 50 },
    }
    const doneOff: Record<PlayerId, { dx: number; dy: number }[]> = {
      0: [{ dx: 4, dy: 4 }, { dx: -4, dy: 4 }, { dx: 4, dy: -4 }, { dx: -4, dy: -4 }],
      1: [{ dx: 4, dy: 4 }, { dx: -4, dy: 4 }, { dx: 4, dy: -4 }, { dx: -4, dy: -4 }],
      2: [{ dx: 4, dy: 4 }, { dx: -4, dy: 4 }, { dx: 4, dy: -4 }, { dx: -4, dy: -4 }],
      3: [{ dx: 4, dy: 4 }, { dx: -4, dy: 4 }, { dx: 4, dy: -4 }, { dx: -4, dy: -4 }],
    }
    const c = homeCenters[player]
    const o = doneOff[player][tokenOffset]
    return { x: c.x + o.dx, y: c.y + o.dy }
  }
  if (pathPosition >= 1 && pathPosition <= PATH_TRACK_END) {
    const trackIndex = pathToTrackIndex(player, pathPosition)
    const angle = trackIndexToAngle(trackIndex)
    const { x, y } = angleToXY(angle, TRACK_R)
    const dx = off * Math.cos((angle * Math.PI) / 180)
    const dy = off * Math.sin((angle * Math.PI) / 180)
    return { x: x + dx, y: y + dy }
  }
  if (pathPosition >= PATH_HOME_START && pathPosition < PATH_DONE) {
    const homeIndex = pathPosition - PATH_HOME_START
    const angles: Record<PlayerId, number> = { 0: -90, 1: 0, 2: 90, 3: 180 }
    const baseAngle = angles[player]
    const homeAngle = baseAngle + (homeIndex + 1) * (90 / 6)
    const r = TRACK_R - (homeIndex + 1) * (HOME_R * 2)
    const { x, y } = angleToXY(homeAngle, r)
    return { x: x + off * 0.8, y: y + off * 0.8 }
  }
  return { x: 50, y: 50 }
}

/** Board SVG path for the track (center line) - for reference */
export function getTrackPath(): string {
  const points: string[] = []
  for (let i = 0; i <= 52; i++) {
    const angle = trackIndexToAngle(i % 52)
    const { x, y } = angleToXY(angle, TRACK_R)
    points.push(`${x},${y}`)
  }
  return `M ${points.join(' L ')}`
}
