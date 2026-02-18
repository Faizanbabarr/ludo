import type { GameState, GameMode, PlayerId } from '../types/game'
import { PLAYER_COLORS, ARROW_SHORTCUTS } from '../types/game'
import { getTokenCoords, getTokenCellCenter, getBoardLayout, PADDING, BOARD_SIZE, CELL } from '../utils/boardCoords'
import { pathToTrackIndex } from '../utils/ludoPath'

interface BoardProps {
  state: GameState
  onTokenClick: (player: PlayerId, tokenIndex: number) => void
  validMoves: number[]
  currentPlayer: PlayerId
  gameMode?: GameMode
}

const COLORS = {
  frame: '#5D3A1A',
  board: '#FFFDE7',
  cellBorder: '#BCAAA4',
  red: '#E53935',
  green: '#43A047',
  yellow: '#FDD835',
  blue: '#1E88E5',
  white: '#FFFFFF',
  safe: '#9E9E9E',
}

const DARK_COLORS: Record<number, string> = {
  0: '#B71C1C',
  1: '#2E7D32',
  2: '#F9A825',
  3: '#1565C0',
}

const PLAYER_BASE_COLORS: Record<number, { fill: string }> = {
  0: { fill: COLORS.red },
  1: { fill: COLORS.green },
  2: { fill: COLORS.yellow },
  3: { fill: COLORS.blue },
}

function gridRect(col: number, row: number, w = 1, h = 1) {
  return {
    x: PADDING + col * CELL,
    y: PADDING + row * CELL,
    width: w * CELL,
    height: h * CELL,
  }
}

function StarIcon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const points: string[] = []
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * (Math.PI / 180)
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180)
    points.push(`${cx + r * Math.cos(outerAngle)},${cy + r * Math.sin(outerAngle)}`)
    points.push(`${cx + r * 0.4 * Math.cos(innerAngle)},${cy + r * 0.4 * Math.sin(innerAngle)}`)
  }
  return <polygon points={points.join(' ')} fill={COLORS.safe} opacity="0.35" />
}

export function Board({ state, onTokenClick, validMoves, currentPlayer, gameMode = 'classic' }: BoardProps) {
  const layout = getBoardLayout()
  const size = PADDING * 2 + BOARD_SIZE

  const centerX = PADDING + 7.5 * CELL
  const centerY = PADDING + 7.5 * CELL
  const center3x3 = gridRect(6, 6, 3, 3)

  return (
    <div className="board-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="board-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Frame gradient - richer wood */}
          <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A67C52" />
            <stop offset="25%" stopColor="#8B6914" />
            <stop offset="50%" stopColor="#5D3A1A" />
            <stop offset="75%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#3E2712" />
          </linearGradient>
          <linearGradient id="frameInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D4C2A" />
            <stop offset="100%" stopColor="#4A2F14" />
          </linearGradient>

          {/* Glass overlay */}
          <linearGradient id="glassOverlay" x1="0%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="40%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.04" />
          </linearGradient>

          {/* Board radial glow */}
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="100%" stopColor="#FFF8E1" />
          </radialGradient>

          {/* Token shadow */}
          <filter id="tokenShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.4" stdDeviation="0.5" floodColor="#000" floodOpacity="0.25" />
          </filter>
          <filter id="tokenGlowFilter" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#FFD700" floodOpacity="0.7" />
          </filter>

          {/* Center triangle gradients */}
          {[COLORS.red, COLORS.green, COLORS.yellow, COLORS.blue].map((c, i) => (
            <linearGradient key={`tri${i}`} id={`triGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c} stopOpacity="1" />
              <stop offset="100%" stopColor={c} stopOpacity="0.75" />
            </linearGradient>
          ))}

          {/* Pawn body gradient - 3D look */}
          {PLAYER_COLORS.map((c, i) => (
            <radialGradient key={`body${i}`} id={`token${i}`} cx="40%" cy="25%" r="65%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.65" />
              <stop offset="25%" stopColor={c} stopOpacity="0.95" />
              <stop offset="65%" stopColor={c} />
              <stop offset="100%" stopColor={DARK_COLORS[i]} />
            </radialGradient>
          ))}
          {/* Pawn head gradient */}
          {PLAYER_COLORS.map((c, i) => (
            <radialGradient key={`head${i}`} id={`pawnHead${i}`} cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="35%" stopColor={c} />
              <stop offset="100%" stopColor={DARK_COLORS[i]} />
            </radialGradient>
          ))}

          {/* Base glass shine */}
          <linearGradient id="baseShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* Outer frame shadow */}
        <rect
          x={PADDING - 4.5}
          y={PADDING - 4.5}
          width={BOARD_SIZE + 9}
          height={BOARD_SIZE + 9}
          rx="5"
          fill="rgba(0,0,0,0.3)"
        />

        {/* Wooden frame */}
        <rect
          x={PADDING - 3.5}
          y={PADDING - 3.5}
          width={BOARD_SIZE + 7}
          height={BOARD_SIZE + 7}
          rx="4.5"
          fill="url(#frameGrad)"
        />

        {/* Inner frame border */}
        <rect
          x={PADDING - 1.5}
          y={PADDING - 1.5}
          width={BOARD_SIZE + 3}
          height={BOARD_SIZE + 3}
          rx="2"
          fill="url(#frameInner)"
        />

        {/* Board background */}
        <rect x={PADDING} y={PADDING} width={BOARD_SIZE} height={BOARD_SIZE} rx="0.5" fill="url(#boardGlow)" />

        {/* Track corridors */}
        {renderTrackCorridors()}

        {/* Colored bases with glass shine */}
        {([0, 1, 2, 3] as PlayerId[]).map(pid => {
          const b = layout.bases[pid]
          const c = PLAYER_BASE_COLORS[pid]
          const r = gridRect(b.col, b.row, b.w, b.h)
          const innerPad = CELL * 0.75
          return (
            <g key={`base-${pid}`}>
              <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={c.fill} />
              <rect x={r.x} y={r.y} width={r.width} height={r.height} fill="url(#baseShine)" />
              {/* Inner white area */}
              <rect
                x={r.x + innerPad}
                y={r.y + innerPad}
                width={r.width - innerPad * 2}
                height={r.height - innerPad * 2}
                rx="4"
                fill={COLORS.white}
              />
              <rect
                x={r.x + innerPad}
                y={r.y + innerPad}
                width={r.width - innerPad * 2}
                height={r.height - innerPad * 2}
                rx="4"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="0.3"
              />
              {/* Pawn placeholder circles - FIXED: aligned with token positions */}
              {layout.baseCells[pid].map(([col, row], i) => (
                <circle
                  key={i}
                  cx={PADDING + (col + 0.5) * CELL}
                  cy={PADDING + (row + 0.5) * CELL}
                  r={CELL * 0.48}
                  fill="none"
                  stroke={c.fill}
                  strokeWidth="0.25"
                  opacity="0.3"
                />
              ))}
            </g>
          )
        })}

        {/* Track cells */}
        {layout.trackCells.map((cell, i) => {
          const r = gridRect(cell.col, cell.row)
          const isStart = layout.startTrackIndices.includes(i)
          const isSafe = layout.safeTrackIndices.includes(i) && !isStart
          const isArrowFrom = gameMode === 'arrow' && ARROW_SHORTCUTS.some(([from]) => from === i)

          let fill = COLORS.white
          if (isStart) {
            if (i === 0) fill = COLORS.red
            else if (i === 13) fill = COLORS.green
            else if (i === 26) fill = COLORS.yellow
            else if (i === 39) fill = COLORS.blue
          }
          if (isArrowFrom) fill = '#FFF3E0'

          return (
            <g key={`track-${i}`}>
              <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={fill} stroke={COLORS.cellBorder} strokeWidth="0.15" />
              {isStart && (
                <polygon
                  points={getArrowPoints(r.x, r.y, r.width, r.height, i)}
                  fill="white"
                  opacity="0.45"
                />
              )}
              {isSafe && gameMode !== 'blitz' && (
                <StarIcon cx={r.x + r.width / 2} cy={r.y + r.height / 2} r={CELL * 0.28} />
              )}
              {isArrowFrom && (
                <g>
                  {/* Arrow shortcut indicator */}
                  <polygon
                    points={getShortcutArrow(r.x + r.width / 2, r.y + r.height / 2, CELL * 0.3, i)}
                    fill="#FF9800"
                    opacity="0.7"
                  />
                  <polygon
                    points={getShortcutArrow(r.x + r.width / 2, r.y + r.height / 2, CELL * 0.18, i)}
                    fill="#FFD54F"
                    opacity="0.9"
                  />
                </g>
              )}
            </g>
          )
        })}

        {/* Home stretch cells */}
        {([0, 1, 2, 3] as PlayerId[]).map(pid =>
          layout.homeStretches[pid].map(([col, row], i) => {
            const r = gridRect(col, row)
            const intensity = 0.35 + (i + 1) * 0.12
            return (
              <g key={`home-${pid}-${i}`}>
                <rect
                  x={r.x} y={r.y} width={r.width} height={r.height}
                  fill={PLAYER_BASE_COLORS[pid].fill}
                  opacity={intensity}
                  stroke={COLORS.cellBorder}
                  strokeWidth="0.15"
                />
                <rect
                  x={r.x} y={r.y}
                  width={r.width * 0.45} height={r.height * 0.25}
                  rx="0.3"
                  fill="white"
                  opacity="0.08"
                />
              </g>
            )
          })
        )}

        {/* Center triangles */}
        <polygon
          points={`${center3x3.x},${center3x3.y} ${center3x3.x + center3x3.width},${center3x3.y} ${centerX},${centerY}`}
          fill="url(#triGrad1)"
        />
        <polygon
          points={`${center3x3.x + center3x3.width},${center3x3.y} ${center3x3.x + center3x3.width},${center3x3.y + center3x3.height} ${centerX},${centerY}`}
          fill="url(#triGrad2)"
        />
        <polygon
          points={`${center3x3.x + center3x3.width},${center3x3.y + center3x3.height} ${center3x3.x},${center3x3.y + center3x3.height} ${centerX},${centerY}`}
          fill="url(#triGrad3)"
        />
        <polygon
          points={`${center3x3.x},${center3x3.y + center3x3.height} ${center3x3.x},${center3x3.y} ${centerX},${centerY}`}
          fill="url(#triGrad0)"
        />
        <rect
          x={center3x3.x} y={center3x3.y}
          width={center3x3.width} height={center3x3.height}
          fill="none" stroke={COLORS.cellBorder} strokeWidth="0.25"
        />
        <circle cx={centerX} cy={centerY} r={CELL * 0.45} fill="white" opacity="0.12" />

        {/* Entry arrows */}
        {renderEntryArrows()}

        {/* Glass overlay on entire board */}
        <rect
          x={PADDING} y={PADDING}
          width={BOARD_SIZE} height={BOARD_SIZE}
          fill="url(#glassOverlay)"
          rx="0.5"
          pointerEvents="none"
        />

        {/* Tokens - Chess pawn design with stacking support */}
        {(() => {
          // Group track tokens by track cell index for stacking
          const trackGroups = new Map<number, Array<{ pid: PlayerId; tid: number }>>()
          state.players.forEach((player) => {
            player.tokens.forEach((token, tid) => {
              if (token.pathPosition >= 1 && token.pathPosition <= 52) {
                const ti = pathToTrackIndex(player.id, token.pathPosition)
                if (ti !== null) {
                  if (!trackGroups.has(ti)) trackGroups.set(ti, [])
                  trackGroups.get(ti)!.push({ pid: player.id, tid })
                }
              }
            })
          })

          const STACK_PATTERNS: [number, number][][] = [
            [[0, 0]],
            [[-0.8, 0], [0.8, 0]],
            [[-0.7, -0.5], [0.7, -0.5], [0, 0.6]],
            [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]],
          ]
          const STACK_SCALES = [1, 0.78, 0.7, 0.65]

          return state.players.map((player) =>
            player.tokens.map((token, tid) => {
              const pid = player.id
              let x: number, y: number
              let scale = 1

              if (token.pathPosition >= 1 && token.pathPosition <= 52) {
                const ti = pathToTrackIndex(pid, token.pathPosition)
                const group = ti !== null ? (trackGroups.get(ti) || []) : []
                const center = getTokenCellCenter(pid, token.pathPosition)

                if (center && group.length > 1) {
                  const idx = group.findIndex(g => g.pid === pid && g.tid === tid)
                  const patternIdx = Math.min(group.length, 4) - 1
                  const pattern = STACK_PATTERNS[patternIdx]
                  const off = pattern[idx % pattern.length]
                  x = center.x + off[0]
                  y = center.y + off[1]
                  scale = STACK_SCALES[patternIdx]
                } else if (center) {
                  x = center.x
                  y = center.y
                } else {
                  ({ x, y } = getTokenCoords(pid, token.pathPosition, tid))
                }
              } else {
                ({ x, y } = getTokenCoords(pid, token.pathPosition, tid))
                if (token.pathPosition === 58) scale = 0.55
              }

              const canMove = currentPlayer === pid && validMoves.includes(tid)
              const isCurrent = currentPlayer === pid
              const r = CELL * 0.42 * scale

              // Chess pawn proportions
              const baseW = r * 1.0        // base width
              const baseH = r * 0.22       // base thickness
              const neckW = r * 0.32       // neck width
              const bodyH = r * 0.7        // body height
              const headR = r * 0.38       // head radius
              const totalH = baseH + bodyH + headR * 2
              const topY = y - totalH * 0.42  // position: slightly higher than center
              const baseY = topY + totalH - baseH

              return (
                <g
                  key={`${pid}-${tid}`}
                  onClick={() => isCurrent && canMove && onTokenClick(pid, tid)}
                  style={{ cursor: canMove ? 'pointer' : 'default' }}
                  filter={canMove ? 'url(#tokenGlowFilter)' : 'url(#tokenShadow)'}
                >
                  {/* Glow ring for valid moves */}
                  {canMove && (
                    <ellipse
                      className="token-glow"
                      cx={x} cy={baseY + baseH * 0.5}
                      rx={r + 0.8} ry={r * 0.5}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="0.5"
                      opacity="0.8"
                    />
                  )}

                  {/* Drop shadow on ground */}
                  <ellipse
                    className="pawn-part"
                    cx={x + 0.1} cy={baseY + baseH + 0.3}
                    rx={baseW * 0.9} ry={r * 0.18}
                    fill="rgba(0,0,0,0.2)"
                  />

                  {/* === PAWN BODY: base -> neck -> head === */}

                  {/* Base pedestal - rounded rectangle */}
                  <rect
                    className="pawn-part"
                    x={x - baseW} y={baseY}
                    width={baseW * 2} height={baseH}
                    rx={baseH * 0.4}
                    fill={`url(#token${pid})`}
                    stroke={DARK_COLORS[pid]}
                    strokeWidth="0.15"
                  />
                  {/* Base shine */}
                  <rect
                    className="pawn-part"
                    x={x - baseW * 0.7} y={baseY + 0.1}
                    width={baseW * 1.4} height={baseH * 0.35}
                    rx={baseH * 0.15}
                    fill="rgba(255,255,255,0.25)"
                  />

                  {/* Body - tapered trapezoid from base to neck */}
                  <path
                    className="token"
                    d={`M${x - baseW * 0.8},${baseY}
                        Q${x - neckW * 1.3},${baseY - bodyH * 0.5} ${x - neckW},${baseY - bodyH}
                        L${x + neckW},${baseY - bodyH}
                        Q${x + neckW * 1.3},${baseY - bodyH * 0.5} ${x + baseW * 0.8},${baseY}
                        Z`}
                    fill={`url(#token${pid})`}
                    stroke={canMove ? '#FFD700' : DARK_COLORS[pid]}
                    strokeWidth={canMove ? '0.35' : '0.12'}
                  />

                  {/* Body shine streak */}
                  <path
                    className="pawn-part"
                    d={`M${x - baseW * 0.35},${baseY - bodyH * 0.15}
                        Q${x - neckW * 0.6},${baseY - bodyH * 0.55} ${x - neckW * 0.5},${baseY - bodyH * 0.85}
                        L${x - neckW * 0.15},${baseY - bodyH * 0.85}
                        Q${x - neckW * 0.2},${baseY - bodyH * 0.55} ${x - baseW * 0.15},${baseY - bodyH * 0.15}
                        Z`}
                    fill="rgba(255,255,255,0.2)"
                  />

                  {/* Collar ring at neck */}
                  <ellipse
                    className="pawn-part"
                    cx={x} cy={baseY - bodyH}
                    rx={neckW * 1.15} ry={neckW * 0.25}
                    fill={`url(#token${pid})`}
                    stroke={DARK_COLORS[pid]}
                    strokeWidth="0.1"
                  />

                  {/* Head sphere */}
                  <circle
                    className="pawn-part"
                    cx={x} cy={baseY - bodyH - headR * 0.85}
                    r={headR}
                    fill={`url(#pawnHead${pid})`}
                    stroke={canMove ? '#FFD700' : DARK_COLORS[pid]}
                    strokeWidth={canMove ? '0.3' : '0.12'}
                  />

                  {/* Head top shine */}
                  <ellipse
                    className="pawn-part"
                    cx={x - headR * 0.15} cy={baseY - bodyH - headR * 1.2}
                    rx={headR * 0.4} ry={headR * 0.25}
                    fill="rgba(255,255,255,0.45)"
                  />

                  {/* Specular dot on head */}
                  <circle
                    className="pawn-part"
                    cx={x - headR * 0.1} cy={baseY - bodyH - headR * 1.35}
                    r={headR * 0.1}
                    fill="rgba(255,255,255,0.65)"
                  />
                </g>
              )
            })
          )
        })()}
      </svg>
    </div>
  )
}

/** Arrow chevron for shortcut cells in Arrow mode - rotated based on track position */
function getShortcutArrow(cx: number, cy: number, size: number, trackIdx: number): string {
  // Direction based on which quadrant of the track this shortcut is in
  let angle = 0
  if (trackIdx === 4) angle = -90       // top area → points up
  else if (trackIdx === 17) angle = 0   // right area → points right
  else if (trackIdx === 30) angle = 90  // bottom area → points down
  else if (trackIdx === 43) angle = 180 // left area → points left

  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Right-pointing chevron shape (rotated by angle)
  const pts: [number, number][] = [
    [size, 0],
    [-size * 0.5, -size * 0.6],
    [-size * 0.2, 0],
    [-size * 0.5, size * 0.6],
  ]

  return pts
    .map(([px, py]) => `${px * cos - py * sin + cx},${px * sin + py * cos + cy}`)
    .join(' ')
}

function getArrowPoints(x: number, y: number, w: number, h: number, trackIdx: number): string {
  const cx = x + w / 2
  const cy = y + h / 2
  const s = Math.min(w, h) * 0.3
  if (trackIdx === 0) return `${cx + s},${cy} ${cx - s * 0.5},${cy - s * 0.5} ${cx - s * 0.5},${cy + s * 0.5}`
  if (trackIdx === 13) return `${cx},${cy + s} ${cx - s * 0.5},${cy - s * 0.5} ${cx + s * 0.5},${cy - s * 0.5}`
  if (trackIdx === 26) return `${cx - s},${cy} ${cx + s * 0.5},${cy - s * 0.5} ${cx + s * 0.5},${cy + s * 0.5}`
  if (trackIdx === 39) return `${cx},${cy - s} ${cx - s * 0.5},${cy + s * 0.5} ${cx + s * 0.5},${cy + s * 0.5}`
  return ''
}

function renderTrackCorridors() {
  const cells: { col: number; row: number }[] = []
  for (let c = 6; c <= 8; c++)
    for (let r = 0; r <= 5; r++) cells.push({ col: c, row: r })
  for (let c = 9; c <= 14; c++)
    for (let r = 6; r <= 8; r++) cells.push({ col: c, row: r })
  for (let c = 6; c <= 8; c++)
    for (let r = 9; r <= 14; r++) cells.push({ col: c, row: r })
  for (let c = 0; c <= 5; c++)
    for (let r = 6; r <= 8; r++) cells.push({ col: c, row: r })

  return (
    <>
      {cells.map((cell, i) => {
        const r = gridRect(cell.col, cell.row)
        return <rect key={`corr-${i}`} x={r.x} y={r.y} width={r.width} height={r.height} fill={COLORS.white} stroke={COLORS.cellBorder} strokeWidth="0.12" />
      })}
    </>
  )
}

function renderEntryArrows() {
  const arrows = [
    { cx: PADDING + 0.5 * CELL, cy: PADDING + 6.5 * CELL, rotation: 0, color: COLORS.red },
    { cx: PADDING + 8.5 * CELL, cy: PADDING + 0.5 * CELL, rotation: 90, color: COLORS.green },
    { cx: PADDING + 14.5 * CELL, cy: PADDING + 8.5 * CELL, rotation: 180, color: COLORS.yellow },
    { cx: PADDING + 6.5 * CELL, cy: PADDING + 14.5 * CELL, rotation: 270, color: COLORS.blue },
  ]

  return (
    <>
      {arrows.map((a, i) => {
        const s = CELL * 0.35
        return (
          <g key={`arrow-${i}`} transform={`translate(${a.cx},${a.cy}) rotate(${a.rotation})`}>
            <polygon points={`${s * 0.5},0 ${-s * 0.3},${-s * 0.3} ${-s * 0.3},${s * 0.3}`} fill={a.color} opacity="0.5" />
          </g>
        )
      })}
    </>
  )
}
