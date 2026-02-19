import type { PlayerId } from '../types/game'
import { getStartIndex, getTrackLength } from '../types/game'

/**
 * 6-Player Ludo Board — ARM-based layout (like 4P cross but with 6 arms)
 *
 * SVG viewBox: 0 0 100 100, center at (50, 50)
 * 6 arms radiate from center at 60° intervals.
 * Each arm: 3 columns (left track, center home-stretch, right track) × 5 rows.
 * Track: 72 cells total, 12 per section.
 * Each section = 5 cells up left side + 2 tip cells + 5 cells down right side.
 *
 * Player layout (angles point outward from center):
 *   0: Red    (270° — top)
 *   1: Green  (330° — upper-right)
 *   2: Yellow ( 30° — lower-right)
 *   3: Blue   ( 90° — bottom)
 *   4: Purple (150° — lower-left)
 *   5: Orange (210° — upper-left)
 */

const CX = 50
const CY = 50
const RAD = Math.PI / 180

// Cell size and arm geometry
const CS = 3.2          // cell size
const R0 = 13           // inner radius — distance from center to row 0
const ROWS = 5          // rows per arm column (0=inner, 4=outer)

// Arm direction angles (outward from center)
const ARM_ANGLES = [270, 330, 30, 90, 150, 210]

/** Direction vector for an arm */
function dir(angle: number): [number, number] {
  return [Math.cos(angle * RAD), Math.sin(angle * RAD)]
}

/** Right perpendicular (clockwise side when looking outward) */
function perpR(angle: number): [number, number] {
  return [-Math.sin(angle * RAD), Math.cos(angle * RAD)]
}

/** Left perpendicular */
function perpL(angle: number): [number, number] {
  const [px, py] = perpR(angle)
  return [-px, -py]
}

function pos(x: number, y: number) { return { x, y } }

/**
 * Generate 72 track cells.
 * Section i (12 cells): traverses arm i
 *   0-4:  left side of arm i, rows 0→4 (outward)
 *   5-6:  tip of arm i (left→right)
 *   7-11: right side of arm i, rows 4→0 (inward)
 *
 * Player i starts at cell 12*i (= left side of arm i, row 0).
 * Home entrance for player i is cell (12*i - 1 + 72) % 72 = right side of arm i, row 0.
 */
function generateTrack(): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []

  for (let arm = 0; arm < 6; arm++) {
    const a = ARM_ANGLES[arm]
    const [dx, dy] = dir(a)
    const [lx, ly] = perpL(a)
    const [rx, ry] = perpR(a)

    // Left side going outward (cells 0-4)
    for (let row = 0; row < ROWS; row++) {
      const r = R0 + row * CS
      cells.push(pos(CX + r * dx + CS * lx, CY + r * dy + CS * ly))
    }

    // Tip cells (cells 5-6)
    const tipR = R0 + (ROWS - 0.5) * CS
    cells.push(pos(CX + tipR * dx + CS * 0.5 * lx, CY + tipR * dy + CS * 0.5 * ly))
    cells.push(pos(CX + tipR * dx + CS * 0.5 * rx, CY + tipR * dy + CS * 0.5 * ry))

    // Right side going inward (cells 7-11)
    for (let row = ROWS - 1; row >= 0; row--) {
      const r = R0 + row * CS
      cells.push(pos(CX + r * dx + CS * rx, CY + r * dy + CS * ry))
    }
  }

  return cells
}

const TRACK_CELLS = generateTrack()

/**
 * Home stretch: 5 cells along arm center, going inward from R0 toward center.
 * cell 0 = entrance (at R0 - csH), cell 4 = near center.
 */
function generateHomeCells(): Record<number, { x: number; y: number }[]> {
  const homes: Record<number, { x: number; y: number }[]> = {}
  const csH = (R0 - 3) / 5 // spacing so innermost cell is at r=3

  for (let pid = 0; pid < 6; pid++) {
    const a = ARM_ANGLES[pid]
    const [dx, dy] = dir(a)
    const cells: { x: number; y: number }[] = []
    for (let i = 0; i < 5; i++) {
      const r = R0 - (i + 1) * csH
      cells.push(pos(CX + r * dx, CY + r * dy))
    }
    homes[pid] = cells
  }
  return homes
}

const HOME_CELLS = generateHomeCells()

/** Base token positions — 2×2 grid beyond the arm tip */
function generateBaseCells(): Record<number, { x: number; y: number }[]> {
  const bases: Record<number, { x: number; y: number }[]> = {}
  const baseR = R0 + (ROWS + 2) * CS // beyond the tip

  for (let pid = 0; pid < 6; pid++) {
    const a = ARM_ANGLES[pid]
    const [dx, dy] = dir(a)
    const [rx, ry] = perpR(a)
    const bcx = CX + baseR * dx
    const bcy = CY + baseR * dy
    const sp = 2.2

    bases[pid] = [
      pos(bcx - sp * rx - sp * dy, bcy - sp * ry + sp * dx),
      pos(bcx + sp * rx - sp * dy, bcy + sp * ry + sp * dx),
      pos(bcx - sp * rx + sp * dy, bcy - sp * ry - sp * dx),
      pos(bcx + sp * rx + sp * dy, bcy + sp * ry - sp * dx),
    ]
  }
  return bases
}

const BASE_CELLS = generateBaseCells()

/** Base area centers */
function generateBaseAreas(): Record<number, { cx: number; cy: number; angle: number }> {
  const areas: Record<number, { cx: number; cy: number; angle: number }> = {}
  const baseR = R0 + (ROWS + 2) * CS

  for (let pid = 0; pid < 6; pid++) {
    const a = ARM_ANGLES[pid]
    const [dx, dy] = dir(a)
    areas[pid] = { cx: CX + baseR * dx, cy: CY + baseR * dy, angle: a }
  }
  return areas
}

const BASE_AREAS = generateBaseAreas()

// Safe spots: 2 per section (start + midpoint)
const SAFE_INDICES_6P = [0, 5, 12, 17, 24, 29, 36, 41, 48, 53, 60, 65]
const START_INDICES_6P = [0, 12, 24, 36, 48, 60]

function pathToTrackIndex6P(player: PlayerId, pathPos: number): number | null {
  const tl = getTrackLength(6)
  if (pathPos < 1 || pathPos > tl) return null
  const start = getStartIndex(player, 6)
  return (start + pathPos - 1) % tl
}

export function getTokenCoords6P(
  player: PlayerId,
  pathPosition: number,
  tokenOffset: number,
): { x: number; y: number } {
  if (pathPosition === 0) return BASE_CELLS[player][tokenOffset]

  const tl = getTrackLength(6)
  const hs = tl + 1
  const d = hs + 5

  if (pathPosition === d) {
    const a = ARM_ANGLES[player]
    const [dx, dy] = dir(a)
    const cx = CX + 2 * dx
    const cy = CY + 2 * dy
    const offsets: [number, number][] = [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]
    return pos(cx + offsets[tokenOffset][0], cy + offsets[tokenOffset][1])
  }

  if (pathPosition >= 1 && pathPosition <= tl) {
    const ti = pathToTrackIndex6P(player, pathPosition)
    if (ti !== null && TRACK_CELLS[ti]) return TRACK_CELLS[ti]
  }

  if (pathPosition >= hs && pathPosition < d) {
    const homeIndex = pathPosition - hs
    const cell = HOME_CELLS[player]?.[homeIndex]
    if (cell) return cell
  }

  return pos(CX, CY)
}

export function getTokenCellCenter6P(
  player: PlayerId,
  pathPosition: number,
): { x: number; y: number } | null {
  const tl = getTrackLength(6)
  const hs = tl + 1
  const d = hs + 5

  if (pathPosition >= 1 && pathPosition <= tl) {
    const ti = pathToTrackIndex6P(player, pathPosition)
    if (ti !== null && TRACK_CELLS[ti]) return TRACK_CELLS[ti]
    return null
  }

  if (pathPosition >= hs && pathPosition < d) {
    const homeIndex = pathPosition - hs
    return HOME_CELLS[player]?.[homeIndex] ?? null
  }

  if (pathPosition === d) return pos(CX, CY)
  return null
}

/** Get hex outline points for a given radius */
export function getHexPoints(r: number): string {
  return ARM_ANGLES.map(a =>
    `${CX + r * Math.cos(a * RAD)},${CY + r * Math.sin(a * RAD)}`
  ).join(' ')
}

/** Get 12-sided polygon (dodecagon) points — used for board frame */
export function getDodecagonPoints(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 12; i++) {
    const a = (30 * i - 90) * RAD
    pts.push(`${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

/** Get arm corridor polygon (3-column wide arm shape) for rendering */
export function getArmPolygon(armIndex: number): string {
  const a = ARM_ANGLES[armIndex]
  const [dx, dy] = dir(a)
  const [lx, ly] = perpL(a)
  const [rx, ry] = perpR(a)

  const innerR = R0 - CS * 0.5
  const outerR = R0 + (ROWS - 0.3) * CS

  const pts = [
    // Left side outer to inner
    pos(CX + outerR * dx + CS * 1.5 * lx, CY + outerR * dy + CS * 1.5 * ly),
    pos(CX + innerR * dx + CS * 1.5 * lx, CY + innerR * dy + CS * 1.5 * ly),
    // Right side inner to outer
    pos(CX + innerR * dx + CS * 1.5 * rx, CY + innerR * dy + CS * 1.5 * ry),
    pos(CX + outerR * dx + CS * 1.5 * rx, CY + outerR * dy + CS * 1.5 * ry),
  ]

  return pts.map(p => `${p.x},${p.y}`).join(' ')
}

export function getBoardLayout6P() {
  return {
    trackCells: TRACK_CELLS,
    homeCells: HOME_CELLS,
    baseCells: BASE_CELLS,
    baseAreas: BASE_AREAS,
    safeIndices: SAFE_INDICES_6P,
    startIndices: START_INDICES_6P,
    center: { x: CX, y: CY },
    cellSize: CS,
    innerRadius: R0 - 2,
    outerRadius: R0 + ROWS * CS,
    armAngles: ARM_ANGLES,
    pad: 3,
    boardSize: 94,
  }
}

export { TRACK_CELLS, HOME_CELLS, BASE_CELLS, BASE_AREAS, pathToTrackIndex6P }
