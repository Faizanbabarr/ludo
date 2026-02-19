import type { PlayerId } from '../types/game'
import { PATH_BASE, PATH_DONE, PATH_HOME_START, PATH_TRACK_END } from './ludoPath'

// 15x15 grid. SVG viewBox is 0-100. Board occupies most of it with some padding.
const GRID = 15
const PADDING = 4      // SVG units of padding around the board
const BOARD_SIZE = 92   // SVG units for the board
const CELL = BOARD_SIZE / GRID

function gridToSvg(col: number, row: number): { x: number; y: number } {
  return {
    x: PADDING + (col + 0.5) * CELL,
    y: PADDING + (row + 0.5) * CELL,
  }
}

/** Grid (col, row) to SVG rect position */
export function gridToRect(col: number, row: number): { x: number; y: number; w: number; h: number } {
  return {
    x: PADDING + col * CELL,
    y: PADDING + row * CELL,
    w: CELL,
    h: CELL,
  }
}

export { PADDING, BOARD_SIZE, CELL, GRID }

/**
 * Standard 52-cell Ludo board track on a 15x15 grid.
 * Clockwise path. Player start indices: Red=0, Green=13, Yellow=26, Blue=39
 *
 * Layout (bases match track starting positions):
 * - Red base: cols 0-5, rows 0-5 (top-left)     → starts at track[0]=[1,6]
 * - Green base: cols 9-14, rows 0-5 (top-right)  → starts at track[13]=[8,1]
 * - Yellow base: cols 9-14, rows 9-14 (bottom-right) → starts at track[26]=[13,8]
 * - Blue base: cols 0-5, rows 9-14 (bottom-left)  → starts at track[39]=[6,13]
 */
const TRACK_GRID: [number, number][] = [
  // 0-4: Red's starting arm (top-left, going right along row 6)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // 5-10: Up the left column of center (col 6, rows 5->0)
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // 11-12: Across top edge (row 0, cols 7->8)
  [7, 0], [8, 0],
  // 13-17: Green's starting arm (top-right, going down col 8, rows 1->5)
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // 18-23: Right along row 6 (cols 9->14)
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // 24-25: Down right edge (col 14, rows 7->8)
  [14, 7], [14, 8],
  // 26-30: Yellow's starting arm (bottom-right, going left along row 8, cols 13->9)
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // 31-36: Down the right column of center (col 8, rows 9->14)
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // 37-38: Across bottom edge (row 14, cols 7->6)
  [7, 14], [6, 14],
  // 39-43: Blue's starting arm (bottom-left, going up col 6, rows 13->9)
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // 44-49: Left along row 8 (cols 5->0)
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // 50-51: Up left edge (col 0, rows 7->6)
  [0, 7], [0, 6],
]

/** Home stretch cells (5 cells leading toward center for each player) */
const HOME_CELLS: Record<number, [number, number][]> = {
  0: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],       // Red: row 7, cols 1-5 (going right)
  1: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],       // Green: col 7, rows 1-5 (going down)
  2: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],   // Yellow: row 7, cols 13-9 (going left)
  3: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],   // Blue: col 7, rows 13-9 (going up)
}

/** Base token positions (4 tokens arranged in 2x2 within each 6x6 base) */
const BASE_CELLS: Record<number, [number, number][]> = {
  0: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],         // Red: top-left
  1: [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],     // Green: top-right
  2: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]], // Yellow: bottom-right
  3: [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],     // Blue: bottom-left
}

/** Path position 1-52 -> track index 0-51 for this player */
function pathToTrackIndex(player: PlayerId, pathPos: number): number {
  const startMap: Record<number, number> = { 0: 0, 1: 13, 2: 26, 3: 39 }
  const start = startMap[player] ?? 0
  return (start + pathPos - 1) % 52
}

/** Get center of a cell for a token (no stacking offset) */
export function getTokenCellCenter(
  player: PlayerId,
  pathPosition: number,
): { x: number; y: number } | null {
  if (pathPosition >= 1 && pathPosition <= PATH_TRACK_END) {
    const ti = pathToTrackIndex(player, pathPosition)
    const [col, row] = TRACK_GRID[ti]
    return gridToSvg(col, row)
  }
  if (pathPosition >= PATH_HOME_START && pathPosition < PATH_DONE) {
    const homeIndex = pathPosition - PATH_HOME_START
    const [col, row] = HOME_CELLS[player][homeIndex]
    return gridToSvg(col, row)
  }
  if (pathPosition === PATH_DONE) {
    return gridToSvg(7, 7)
  }
  return null
}

/** Get (x, y) in 0-100 SVG for a token */
export function getTokenCoords(
  player: PlayerId,
  pathPosition: number,
  tokenOffset: number
): { x: number; y: number } {
  if (pathPosition === PATH_BASE) {
    const [col, row] = BASE_CELLS[player][tokenOffset]
    return gridToSvg(col, row)
  }

  if (pathPosition === PATH_DONE) {
    // Place done tokens in their player's home triangle
    const triangleCenters: Record<number, [number, number]> = {
      0: [6.2, 7],    // Red: left triangle
      1: [7, 6.2],    // Green: top triangle
      2: [7.8, 7],    // Yellow: right triangle
      3: [7, 7.8],    // Blue: bottom triangle
    }
    const [cx, cy] = triangleCenters[player]
    const doneOff: [number, number][] = [
      [-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22],
    ]
    const [dx, dy] = doneOff[tokenOffset]
    return gridToSvg(cx + dx, cy + dy)
  }

  if (pathPosition >= 1 && pathPosition <= PATH_TRACK_END) {
    const ti = pathToTrackIndex(player, pathPosition)
    const [col, row] = TRACK_GRID[ti]
    return gridToSvg(col, row)
  }

  if (pathPosition >= PATH_HOME_START && pathPosition < PATH_DONE) {
    const homeIndex = pathPosition - PATH_HOME_START
    const [col, row] = HOME_CELLS[player][homeIndex]
    return gridToSvg(col, row)
  }

  return gridToSvg(7, 7)
}

/** Get grid positions for drawing the board */
export function getBoardLayout() {
  const trackCells = TRACK_GRID.map(([c, r]) => ({ col: c, row: r }))

  const bases: Record<number, { col: number; row: number; w: number; h: number }> = {
    0: { col: 0, row: 0, w: 6, h: 6 },   // Red: top-left
    1: { col: 9, row: 0, w: 6, h: 6 },   // Green: top-right
    2: { col: 9, row: 9, w: 6, h: 6 },   // Yellow: bottom-right
    3: { col: 0, row: 9, w: 6, h: 6 },   // Blue: bottom-left
  }

  const homeStretches = HOME_CELLS
  const baseCells = BASE_CELLS

  // Safe spots on the track (indices into TRACK_GRID)
  const safeTrackIndices = [0, 8, 13, 21, 26, 34, 39, 47]
  const safeCells = safeTrackIndices.map(i => TRACK_GRID[i])

  // Start positions on track
  const startTrackIndices = [0, 13, 26, 39]
  const startCells = startTrackIndices.map(i => TRACK_GRID[i])

  return { trackCells, bases, homeStretches, baseCells, safeCells, startCells, safeTrackIndices, startTrackIndices }
}

/** Get all track cell rects for rendering */
export function getTrackCellRects() {
  return TRACK_GRID.map(([col, row]) => gridToRect(col, row))
}
