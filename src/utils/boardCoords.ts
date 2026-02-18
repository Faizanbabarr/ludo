import type { PlayerId } from '../types/game'
import { PATH_BASE, PATH_DONE, PATH_HOME_START, PATH_TRACK_END } from './ludoPath'

// 15x15 grid (0-14). Board inner rect in Board.tsx is x=14,y=14, width=72, height=72
const INNER_LEFT = 14
const INNER_TOP = 14
const INNER_SIZE = 72
const CELL = INNER_SIZE / GRID

function gridToSvg(col: number, row: number): { x: number; y: number } {
  return {
    x: INNER_LEFT + (col + 0.5) * CELL,
    y: INNER_TOP + (row + 0.5) * CELL,
  }
}

/** Track index 0-51 -> (col, row) on 15x15 grid. 52-cell closed square path. */
const TRACK_GRID: [number, number][] = [
  // 0-12: bottom (1,6) to (13,6)
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((c) => [c, 6] as [number, number]),
  // 13-25: right (13,5) to (5,1)
  ...[5, 4, 3, 2, 1].map((r) => [13, r] as [number, number]),
  ...[12, 11, 10, 9, 8, 7, 6, 5].map((c) => [c, 1] as [number, number]),
  // 26-38: top (8,5) to (13,12) — 13 cells
  ...[5, 6, 7, 8].map((r) => [8, r] as [number, number]),
  ...[9, 10, 11, 12].map((c) => [c, 8] as [number, number]),
  [13, 8],
  ...[9, 10, 11, 12].map((r) => [13, r] as [number, number]),
  // 39-51: left (7,13) to (1,7) — 13 cells, then wraps to (1,6)
  ...[7, 6, 5, 4, 3, 2, 1].map((c) => [c, 13] as [number, number]),
  ...[12, 11, 10, 9, 8, 7].map((r) => [1, r] as [number, number]),
]

/** Path position 1-52 -> track index 0-51 for this player */
function pathToTrackIndex(player: PlayerId, pathPos: number): number {
  const start = { 0: 0, 1: 13, 2: 26, 3: 39 }[player]
  return (start + pathPos - 1) % 52
}

/** Get (x, y) in 0-100 SVG for a token */
export function getTokenCoords(
  player: PlayerId,
  pathPosition: number,
  tokenOffset: number
): { x: number; y: number } {
  const off = (tokenOffset - 1.5) * 1.8
  if (pathPosition === PATH_BASE) {
    // 4 cells per base: (col, row) for tokens 0..3
    const baseCells: Record<PlayerId, [number, number][]> = {
      0: [[0, 5], [1, 5], [0, 6], [1, 6]],
      1: [[7, 0], [8, 0], [7, 1], [8, 1]],
      2: [[12, 7], [13, 7], [12, 8], [13, 8]],
      3: [[5, 12], [6, 12], [5, 13], [6, 13]],
    }
    const [col, row] = baseCells[player][tokenOffset]
    return gridToSvg(col, row)
  }
  if (pathPosition === PATH_DONE) {
    const doneOff: [number, number][] = [
      [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4],
    ]
    const [dc, dr] = doneOff[tokenOffset]
    return gridToSvg(7 + dc, 7 + dr)
  }
  if (pathPosition >= 1 && pathPosition <= PATH_TRACK_END) {
    const ti = pathToTrackIndex(player, pathPosition)
    const [col, row] = TRACK_GRID[ti]
    const { x, y } = gridToSvg(col, row)
    return { x: x + off, y: y + off }
  }
  if (pathPosition >= PATH_HOME_START && pathPosition < PATH_DONE) {
    const homeIndex = pathPosition - PATH_HOME_START
    const homeCells: Record<PlayerId, [number, number][]> = {
      0: [[7, 6], [7, 5], [7, 4], [7, 3], [7, 2]],
      1: [[7, 7], [8, 7], [9, 7], [10, 7], [11, 7]],
      2: [[7, 8], [7, 9], [7, 10], [7, 11], [7, 12]],
      3: [[6, 7], [5, 7], [4, 7], [3, 7], [2, 7]],
    }
    const [col, row] = homeCells[player][homeIndex]
    const { x, y } = gridToSvg(col, row)
    return { x: x + off * 0.8, y: y + off * 0.8 }
  }
  return gridToSvg(7, 7)
}

/** SVG path for the main track (for drawing) */
export function getTrackPath(): string {
  const points = TRACK_GRID.map(([c, r]) => {
    const { x, y } = gridToSvg(c, r)
    return `${x},${y}`
  })
  return `M ${points.join(' L ')} Z`
}

/** Get grid positions for drawing the board (track cells, bases, home stretches) */
export function getBoardLayout() {
  const trackCells = TRACK_GRID.map(([c, r]) => ({ col: c, row: r }))
  const bases: Record<PlayerId, { col: number; row: number; w: number; h: number }> = {
    0: { col: 0, row: 5, w: 2, h: 2 },
    1: { col: 7, row: 0, w: 2, h: 2 },
    2: { col: 12, row: 7, w: 2, h: 2 },
    3: { col: 5, row: 12, w: 2, h: 2 },
  }
  return { trackCells, bases }
}
