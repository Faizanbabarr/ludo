import type { GameState, GameMode, PlayerId } from '../types/game'
import { PLAYER_COLORS, ARROW_SHORTCUTS, ARROW_SHORTCUTS_6P, SNAKES, LADDERS, getTrackLength } from '../types/game'
import { getTokenCoords, getTokenCellCenter, getBoardLayout, PADDING, BOARD_SIZE, CELL } from '../utils/boardCoords'
import { getTokenCoords6P, getTokenCellCenter6P, getBoardLayout6P, pathToTrackIndex6P, getDodecagonPoints, getArmPolygon } from '../utils/boardCoords6P'
import { pathToTrackIndex } from '../utils/ludoPath'

interface BoardProps {
  state: GameState
  onTokenClick: (player: PlayerId, tokenIndex: number) => void
  validMoves: number[]
  currentPlayer: PlayerId
  gameMode?: GameMode
  captures?: number[]
}

const COLORS = {
  frame: '#6D4C2A',
  board: '#FFFDE7',
  cellBorder: '#C0B8A0',
  red: '#E53935',
  green: '#43A047',
  yellow: '#FDD835',
  blue: '#1E88E5',
  purple: '#9C27B0',
  orange: '#FF9800',
  white: '#FFFFFF',
  safe: '#9E9E9E',
}

const DARK_COLORS: Record<number, string> = {
  0: '#B71C1C',
  1: '#2E7D32',
  2: '#F9A825',
  3: '#1565C0',
  4: '#6A1B9A',
  5: '#E65100',
}

const PLAYER_COLOR_LIST = [COLORS.red, COLORS.green, COLORS.yellow, COLORS.blue, COLORS.purple, COLORS.orange]

function gridRect(col: number, row: number, w = 1, h = 1) {
  return {
    x: PADDING + col * CELL,
    y: PADDING + row * CELL,
    width: w * CELL,
    height: h * CELL,
  }
}

/** Gray 5-pointed star for safe spots */
function StarIcon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (i * 36 - 90) * (Math.PI / 180)
    const radius = i % 2 === 0 ? r : r * 0.38
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`)
  }
  return <polygon points={pts.join(' ')} fill="#757575" opacity="0.7" />
}

/** Globe/earth icon for start positions */
function GlobeIcon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g opacity="0.75">
      <circle cx={cx} cy={cy} r={r} fill="#4CAF50" />
      <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r * 0.9} fill="none" stroke="white" strokeWidth={r * 0.12} />
      <line x1={cx - r * 0.85} y1={cy} x2={cx + r * 0.85} y2={cy} stroke="white" strokeWidth={r * 0.12} />
      <line x1={cx - r * 0.6} y1={cy - r * 0.45} x2={cx + r * 0.6} y2={cy - r * 0.45} stroke="white" strokeWidth={r * 0.08} opacity="0.7" />
      <line x1={cx - r * 0.6} y1={cy + r * 0.45} x2={cx + r * 0.6} y2={cy + r * 0.45} stroke="white" strokeWidth={r * 0.08} opacity="0.7" />
      <ellipse cx={cx - r * 0.2} cy={cy - r * 0.25} rx={r * 0.3} ry={r * 0.2} fill="white" opacity="0.2" />
    </g>
  )
}

/** Shared token defs */
function TokenDefs({ numPlayers }: { numPlayers: number }) {
  const count = Math.min(numPlayers, 6)
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <radialGradient key={`body${i}`} id={`token${i}`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="30%" stopColor={PLAYER_COLORS[i]} stopOpacity="0.95" />
          <stop offset="70%" stopColor={PLAYER_COLORS[i]} />
          <stop offset="100%" stopColor={DARK_COLORS[i]} />
        </radialGradient>
      ))}
      <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0D060" />
        <stop offset="40%" stopColor="#D4AF37" />
        <stop offset="70%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#F0D060" />
      </linearGradient>
      <filter id="tokenShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0.4" stdDeviation="0.5" floodColor="#000" floodOpacity="0.25" />
      </filter>
      <filter id="tokenGlowFilter" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#FFD700" floodOpacity="0.7" />
      </filter>
    </>
  )
}

/** Coin token SVG */
function CoinToken({ pid, r, canMove, isCurrent, onTokenClick, tid }: {
  pid: PlayerId; r: number; canMove: boolean; isCurrent: boolean
  onTokenClick: (pid: PlayerId, tid: number) => void; tid: number
}) {
  return (
    <g
      className="pawn-group"
      onClick={() => isCurrent && canMove && onTokenClick(pid, tid)}
      style={{ cursor: canMove ? 'pointer' : 'default' }}
      filter={canMove ? 'url(#tokenGlowFilter)' : 'url(#tokenShadow)'}
    >
      {canMove && (
        <circle className="token-glow" cx={0} cy={0} r={r + 0.8}
          fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.8" />
      )}
      <ellipse cx={0.15} cy={0.4} rx={r * 0.85} ry={r * 0.3} fill="rgba(0,0,0,0.2)" />
      <circle cx={0} cy={0} r={r} fill="url(#goldRing)" stroke="#8B6914" strokeWidth={r * 0.06} />
      <circle cx={0} cy={0} r={r * 0.88} fill="none" stroke="#F0D060" strokeWidth={r * 0.04} opacity="0.6" />
      <circle cx={0} cy={0} r={r * 0.78} fill={`url(#token${pid})`} />
      {/* Crown */}
      {(() => {
        const s = r * 0.48
        return (
          <g>
            <polygon
              points={`${-s * 0.65},${s * 0.22} ${-s * 0.45},${-s * 0.38} ${-s * 0.15},${-s * 0.08} ${0},${-s * 0.48} ${s * 0.15},${-s * 0.08} ${s * 0.45},${-s * 0.38} ${s * 0.65},${s * 0.22}`}
              fill="white" opacity="0.85"
            />
            <rect x={-s * 0.65} y={s * 0.22} width={s * 1.3} height={s * 0.16} rx={s * 0.04} fill="white" opacity="0.85" />
            <circle cx={-s * 0.45} cy={-s * 0.2} r={s * 0.06} fill="#FFD700" opacity="0.7" />
            <circle cx={0} cy={-s * 0.32} r={s * 0.06} fill="#FFD700" opacity="0.7" />
            <circle cx={s * 0.45} cy={-s * 0.2} r={s * 0.06} fill="#FFD700" opacity="0.7" />
          </g>
        )
      })()}
      <ellipse cx={-r * 0.18} cy={-r * 0.22} rx={r * 0.4} ry={r * 0.25} fill="white" opacity="0.12" />
      <circle cx={-r * 0.2} cy={-r * 0.35} r={r * 0.08} fill="white" opacity="0.35" />
    </g>
  )
}

export function Board({ state, onTokenClick, validMoves, currentPlayer, gameMode = 'classic', captures }: BoardProps) {
  if (state.numPlayers === 6) {
    return <Board6P state={state} onTokenClick={onTokenClick} validMoves={validMoves}
      currentPlayer={currentPlayer} gameMode={gameMode} captures={captures} />
  }
  return <Board4P state={state} onTokenClick={onTokenClick} validMoves={validMoves}
    currentPlayer={currentPlayer} gameMode={gameMode} captures={captures} />
}

// ─── 4-Player Board ───

function Board4P({ state, onTokenClick, validMoves, currentPlayer, gameMode = 'classic', captures }: BoardProps) {
  const layout = getBoardLayout()
  const size = PADDING * 2 + BOARD_SIZE
  const centerX = PADDING + 7.5 * CELL
  const centerY = PADDING + 7.5 * CELL
  const center3x3 = gridRect(6, 6, 3, 3)
  const showArrows = gameMode === 'arrow' || gameMode === 'blitz'
  const numPlayers = state.numPlayers

  return (
    <div className="board-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="board-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="25%" stopColor="#6D4C2A" />
            <stop offset="50%" stopColor="#8B6914" />
            <stop offset="75%" stopColor="#5D3A1A" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="100%" stopColor="#FFF8E1" />
          </radialGradient>
          <linearGradient id="cellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F4E8" />
          </linearGradient>
          {[COLORS.red, COLORS.green, COLORS.yellow, COLORS.blue].map((c, i) => (
            <linearGradient key={`tri${i}`} id={`triGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c} />
              <stop offset="100%" stopColor={DARK_COLORS[i]} />
            </linearGradient>
          ))}
          <TokenDefs numPlayers={numPlayers} />
          <filter id="baseInner" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodColor="#000" floodOpacity="0.15" />
          </filter>
          {['#4CAF50', '#E53935', '#FF9800', '#9C27B0'].map((c, i) => (
            <linearGradient key={`snakeG${i}`} id={`snakeGrad${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={c} stopOpacity="0.95" />
              <stop offset="50%" stopColor={['#388E3C', '#C62828', '#EF6C00', '#7B1FA2'][i]} />
              <stop offset="100%" stopColor={['#2E7D32', '#B71C1C', '#E65100', '#6A1B9A'][i]} stopOpacity="0.9" />
            </linearGradient>
          ))}
          <filter id="snakeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0.3" dy="0.5" stdDeviation="0.6" floodColor="#000" floodOpacity="0.25" />
          </filter>
          <filter id="ladderShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0.4" dy="0.6" stdDeviation="0.5" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Frame */}
        <rect x={PADDING - 3.5} y={PADDING - 3.5} width={BOARD_SIZE + 7} height={BOARD_SIZE + 7} rx="4" fill="rgba(0,0,0,0.3)" />
        <rect x={PADDING - 3} y={PADDING - 3} width={BOARD_SIZE + 6} height={BOARD_SIZE + 6} rx="3.5" fill="url(#frameGrad)" />
        <line x1={PADDING - 2.8} y1={PADDING - 2.8} x2={PADDING + BOARD_SIZE + 2.8} y2={PADDING - 2.8} stroke="white" strokeWidth="0.4" opacity="0.12" strokeLinecap="round" />
        <line x1={PADDING - 2.8} y1={PADDING - 2.8} x2={PADDING - 2.8} y2={PADDING + BOARD_SIZE + 2.8} stroke="white" strokeWidth="0.3" opacity="0.08" strokeLinecap="round" />
        <rect x={PADDING - 0.8} y={PADDING - 0.8} width={BOARD_SIZE + 1.6} height={BOARD_SIZE + 1.6} rx="1" fill="#5D3A1A" />
        <rect x={PADDING} y={PADDING} width={BOARD_SIZE} height={BOARD_SIZE} rx="0.5" fill="url(#boardGlow)" />

        {/* Track corridors */}
        {renderTrackCorridors()}

        {/* Colored bases — always show all 4 */}
        {([0, 1, 2, 3] as PlayerId[]).map(pid => {
          const b = layout.bases[pid]
          const c = PLAYER_COLOR_LIST[pid]
          const r = gridRect(b.col, b.row, b.w, b.h)
          const innerPad = CELL * 0.7
          return (
            <g key={`base-${pid}`}>
              <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={c} rx="1" />
              <rect x={r.x} y={r.y} width={r.width} height={r.height * 0.4} rx="1" fill="white" opacity="0.08" />
              <rect x={r.x + innerPad} y={r.y + innerPad} width={r.width - innerPad * 2} height={r.height - innerPad * 2} rx="3" fill={DARK_COLORS[pid]} opacity="0.25" filter="url(#baseInner)" />
              {layout.baseCells[pid].map(([col, row], i) => (
                <circle key={i} cx={PADDING + (col + 0.5) * CELL} cy={PADDING + (row + 0.5) * CELL} r={CELL * 0.52} fill={DARK_COLORS[pid]} opacity="0.35" />
              ))}
              {pid === currentPlayer && (
                <rect x={r.x - 0.8} y={r.y - 0.8} width={r.width + 1.6} height={r.height + 1.6} rx="2" fill="none" stroke={c} strokeWidth="0.8" className="active-base-glow" />
              )}
            </g>
          )
        })}

        {/* Track cells */}
        {layout.trackCells.map((cell, i) => {
          const r = gridRect(cell.col, cell.row)
          const isStart = layout.startTrackIndices.includes(i)
          const isSafe = layout.safeTrackIndices.includes(i) && !isStart
          const isArrowFrom = showArrows && ARROW_SHORTCUTS.some(([from]) => from === i)
          const isSnakeHead = gameMode === 'snakeladder' && SNAKES.some(([head]) => head === i)
          const isLadderBottom = gameMode === 'snakeladder' && LADDERS.some(([bottom]) => bottom === i)

          // Safe spot colors: index 8=Red, 21=Green, 34=Yellow, 47=Blue
          const SAFE_COLOR_MAP: Record<number, string> = {
            8: '#FFCDD2', 21: '#C8E6C9', 34: '#FFF9C4', 47: '#BBDEFB',
          }

          let fill = COLORS.white
          let cellFill: string | undefined
          if (isStart) {
            if (i === 0) fill = COLORS.red
            else if (i === 13) fill = COLORS.green
            else if (i === 26) fill = COLORS.yellow
            else if (i === 39) fill = COLORS.blue
            cellFill = fill
          } else if (isSafe) {
            cellFill = SAFE_COLOR_MAP[i] ?? '#E8E8E8'
          }
          if (isSnakeHead) cellFill = '#FFEBEE'
          if (isLadderBottom) cellFill = '#E8F5E9'

          return (
            <g key={`track-${i}`}>
              <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={cellFill ?? 'url(#cellGrad)'} stroke={COLORS.cellBorder} strokeWidth="0.18" />
              {isStart && <GlobeIcon cx={r.x + r.width / 2} cy={r.y + r.height / 2} r={CELL * 0.32} />}
              {isSafe && <StarIcon cx={r.x + r.width / 2} cy={r.y + r.height / 2} r={CELL * 0.38} />}
              {isArrowFrom && (
                <g>
                  <polygon points={getShortcutArrow(r.x + r.width / 2, r.y + r.height / 2, CELL * 0.3, i)} fill="#FF9800" opacity="0.7" />
                  <polygon points={getShortcutArrow(r.x + r.width / 2, r.y + r.height / 2, CELL * 0.18, i)} fill="#FFD54F" opacity="0.9" />
                </g>
              )}
              {isSnakeHead && <circle cx={r.x + r.width * 0.5} cy={r.y + r.height * 0.5} r={CELL * 0.12} fill="#E53935" opacity="0.25" />}
              {isLadderBottom && <circle cx={r.x + r.width * 0.5} cy={r.y + r.height * 0.5} r={CELL * 0.12} fill="#43A047" opacity="0.25" />}
            </g>
          )
        })}

        {/* Snake & Ladder visuals */}
        {gameMode === 'snakeladder' && renderSnakesAndLadders(layout)}

        {/* Home stretch cells — always show all 4 */}
        {([0, 1, 2, 3] as PlayerId[]).map(pid =>
          layout.homeStretches[pid].map(([col, row], i) => {
            const r = gridRect(col, row)
            return (
              <g key={`home-${pid}-${i}`}>
                <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={PLAYER_COLOR_LIST[pid]} opacity={0.4 + (i + 1) * 0.1} stroke={COLORS.cellBorder} strokeWidth="0.18" />
                <rect x={r.x} y={r.y} width={r.width * 0.4} height={r.height * 0.2} rx="0.3" fill="white" opacity="0.1" />
              </g>
            )
          })
        )}

        {/* Home blocked indicators - lock icon (Blitz mode only) */}
        {captures && gameMode === 'blitz' && ([0, 1, 2, 3] as PlayerId[]).map(pid => {
          if ((captures[pid] ?? 0) > 0) return null
          const homeCell = layout.homeStretches[pid][4]
          if (!homeCell) return null
          const [col, row] = homeCell
          const cx = PADDING + (col + 0.5) * CELL
          const cy = PADDING + (row + 0.5) * CELL
          const s = CELL * 0.3
          return (
            <g key={`lock-${pid}`} opacity="0.7">
              <rect x={cx - s * 0.6} y={cy - s * 0.1} width={s * 1.2} height={s * 0.9} rx={s * 0.12} fill="#FF5722" stroke="#BF360C" strokeWidth="0.2" />
              <path d={`M${cx - s * 0.35},${cy - s * 0.1} L${cx - s * 0.35},${cy - s * 0.45} A${s * 0.35},${s * 0.35} 0 0,1 ${cx + s * 0.35},${cy - s * 0.45} L${cx + s * 0.35},${cy - s * 0.1}`} fill="none" stroke="#BF360C" strokeWidth={s * 0.18} strokeLinecap="round" />
              <circle cx={cx} cy={cy + s * 0.15} r={s * 0.15} fill="#BF360C" />
            </g>
          )
        })}

        {/* Center triangles */}
        <polygon points={`${center3x3.x},${center3x3.y} ${center3x3.x + center3x3.width},${center3x3.y} ${centerX},${centerY}`} fill="url(#triGrad1)" />
        <polygon points={`${center3x3.x + center3x3.width},${center3x3.y} ${center3x3.x + center3x3.width},${center3x3.y + center3x3.height} ${centerX},${centerY}`} fill="url(#triGrad2)" />
        <polygon points={`${center3x3.x + center3x3.width},${center3x3.y + center3x3.height} ${center3x3.x},${center3x3.y + center3x3.height} ${centerX},${centerY}`} fill="url(#triGrad3)" />
        <polygon points={`${center3x3.x},${center3x3.y + center3x3.height} ${center3x3.x},${center3x3.y} ${centerX},${centerY}`} fill="url(#triGrad0)" />
        <rect x={center3x3.x} y={center3x3.y} width={center3x3.width} height={center3x3.height} fill="none" stroke={COLORS.cellBorder} strokeWidth="0.25" />

        {/* Tokens */}
        {renderTokens4P(state, onTokenClick, validMoves, currentPlayer)}
      </svg>
    </div>
  )
}

function renderTokens4P(state: GameState, onTokenClick: (p: PlayerId, t: number) => void, validMoves: number[], currentPlayer: PlayerId) {
  const tl = getTrackLength(state.numPlayers)
  const d = tl + 6

  const trackGroups = new Map<number, Array<{ pid: PlayerId; tid: number }>>()
  state.players.forEach((player) => {
    player.tokens.forEach((token, tid) => {
      if (token.pathPosition >= 1 && token.pathPosition <= tl) {
        const ti = pathToTrackIndex(player.id, token.pathPosition, state.numPlayers)
        if (ti !== null) {
          if (!trackGroups.has(ti)) trackGroups.set(ti, [])
          trackGroups.get(ti)!.push({ pid: player.id, tid })
        }
      }
    })
  })

  const STACK_PATTERNS: [number, number][][] = [
    [[0, 0]], [[-0.8, 0], [0.8, 0]], [[-0.7, -0.5], [0.7, -0.5], [0, 0.6]], [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]],
  ]
  const STACK_SCALES = [1, 0.78, 0.7, 0.65]

  return state.players.map((player) =>
    player.tokens.map((token, tid) => {
      const pid = player.id
      let x: number, y: number
      let scale = 1

      if (token.pathPosition >= 1 && token.pathPosition <= tl) {
        const ti = pathToTrackIndex(pid, token.pathPosition, state.numPlayers)
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
        if (token.pathPosition === d) scale = 0.55
      }

      const canMove = currentPlayer === pid && validMoves.includes(tid)
      const isCurrent = currentPlayer === pid
      const r = CELL * 0.44 * scale

      return (
        <g key={`${pid}-${tid}`} transform={`translate(${x}, ${y})`}>
          <CoinToken pid={pid} r={r} canMove={canMove} isCurrent={isCurrent} onTokenClick={onTokenClick} tid={tid} />
        </g>
      )
    })
  )
}

// ─── 6-Player Board ───

function Board6P({ state, onTokenClick, validMoves, currentPlayer, gameMode = 'classic', captures }: BoardProps) {
  const layout = getBoardLayout6P()
  const showArrows = gameMode === 'arrow' || gameMode === 'blitz'
  const cs = layout.cellSize
  const hcs = cs * 0.48

  return (
    <div className="board-wrap">
      <svg viewBox="0 0 100 100" className="board-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <TokenDefs numPlayers={6} />
          {Array.from({ length: 6 }, (_, i) => (
            <linearGradient key={`tri6-${i}`} id={`tri6Grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PLAYER_COLOR_LIST[i]} />
              <stop offset="100%" stopColor={DARK_COLORS[i]} />
            </linearGradient>
          ))}
          <linearGradient id="frameGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="25%" stopColor="#6D4C2A" />
            <stop offset="50%" stopColor="#8B6914" />
            <stop offset="75%" stopColor="#5D3A1A" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
          <radialGradient id="boardGlow6" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="100%" stopColor="#FFF8E1" />
          </radialGradient>
          <linearGradient id="cellGrad6" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F4E8" />
          </linearGradient>
        </defs>

        {/* Dodecagonal frame */}
        <polygon points={getDodecagonPoints(49)} fill="rgba(0,0,0,0.3)" />
        <polygon points={getDodecagonPoints(48)} fill="url(#frameGrad6)" />
        <polygon points={getDodecagonPoints(46.5)} fill="#5D3A1A" />
        <polygon points={getDodecagonPoints(46)} fill="url(#boardGlow6)" />

        {/* Arm corridor backgrounds */}
        {Array.from({ length: 6 }, (_, pid) => (
          <polygon key={`arm-bg-${pid}`}
            points={getArmPolygon(pid)}
            fill={PLAYER_COLOR_LIST[pid]} opacity="0.12" />
        ))}

        {/* Track cells */}
        {layout.trackCells.map((cell, i) => {
          const isStart = layout.startIndices.includes(i)
          const isSafe = layout.safeIndices.includes(i) && !isStart
          const isArrowFrom = showArrows && ARROW_SHORTCUTS_6P.some(([from]) => from === i)

          let fill = 'url(#cellGrad6)'
          let strokeColor = '#C0B8A0'
          if (isStart) {
            const pidIdx = layout.startIndices.indexOf(i)
            fill = PLAYER_COLOR_LIST[pidIdx]
            strokeColor = DARK_COLORS[pidIdx]
          }

          return (
            <g key={`track6-${i}`}>
              <rect x={cell.x - hcs} y={cell.y - hcs} width={cs * 0.96} height={cs * 0.96}
                rx="0.6" fill={fill} stroke={strokeColor} strokeWidth="0.2" />
              {isStart && <GlobeIcon cx={cell.x} cy={cell.y} r={cs * 0.28} />}
              {isSafe && <StarIcon cx={cell.x} cy={cell.y} r={cs * 0.26} />}
              {isArrowFrom && (
                <polygon points={getArrowTriangle(cell.x, cell.y, cs * 0.22, i)} fill="#FF9800" opacity="0.7" />
              )}
            </g>
          )
        })}

        {/* Home stretch cells */}
        {Array.from({ length: 6 }, (_, pid) =>
          layout.homeCells[pid]?.map((cell, i) => (
            <rect key={`home6-${pid}-${i}`}
              x={cell.x - hcs} y={cell.y - hcs} width={cs * 0.96} height={cs * 0.96}
              rx="0.6"
              fill={PLAYER_COLOR_LIST[pid]} opacity={0.4 + (i + 1) * 0.12}
              stroke={DARK_COLORS[pid]} strokeWidth="0.15" />
          ))
        )}

        {/* Center — colored triangles */}
        {(() => {
          const ir = layout.innerRadius
          const pts: string[] = []
          for (let i = 0; i < 6; i++) {
            const angle = (60 * i - 90) * (Math.PI / 180)
            pts.push(`${50 + ir * Math.cos(angle)},${50 + ir * Math.sin(angle)}`)
          }
          return (
            <g>
              <polygon points={pts.join(' ')} fill="#FFFDE7" stroke="#C0B8A0" strokeWidth="0.3" />
              {Array.from({ length: 6 }, (_, i) => {
                const a1 = (60 * i - 90) * (Math.PI / 180)
                const a2 = (60 * (i + 1) - 90) * (Math.PI / 180)
                return (
                  <polygon key={`ctri-${i}`}
                    points={`50,50 ${50 + ir * Math.cos(a1)},${50 + ir * Math.sin(a1)} ${50 + ir * Math.cos(a2)},${50 + ir * Math.sin(a2)}`}
                    fill={`url(#tri6Grad${i})`} opacity="0.85" />
                )
              })}
              <circle cx={50} cy={50} r={3} fill="#1A1A1A" opacity="0.6" />
            </g>
          )
        })()}

        {/* Player bases */}
        {Array.from({ length: 6 }, (_, pid) => {
          const area = layout.baseAreas[pid]
          const bSize = 10
          return (
            <g key={`base6-${pid}`}>
              <rect x={area.cx - bSize / 2} y={area.cy - bSize / 2} width={bSize} height={bSize}
                rx="1.5" fill={PLAYER_COLOR_LIST[pid]} stroke={DARK_COLORS[pid]} strokeWidth="0.3" />
              <rect x={area.cx - bSize / 2} y={area.cy - bSize / 2} width={bSize} height={bSize * 0.35}
                rx="1.5" fill="white" opacity="0.08" />
              <rect x={area.cx - bSize * 0.3} y={area.cy - bSize * 0.3} width={bSize * 0.6} height={bSize * 0.6}
                rx="2" fill={DARK_COLORS[pid]} opacity="0.2" />
              {layout.baseCells[pid].map((cell, i) => (
                <circle key={i} cx={cell.x} cy={cell.y} r={1.6}
                  fill={DARK_COLORS[pid]} opacity="0.35" />
              ))}
              {pid === currentPlayer && (
                <rect x={area.cx - bSize / 2 - 0.5} y={area.cy - bSize / 2 - 0.5}
                  width={bSize + 1} height={bSize + 1}
                  rx="2" fill="none" stroke={PLAYER_COLOR_LIST[pid]} strokeWidth="0.6"
                  className="active-base-glow" />
              )}
            </g>
          )
        })}

        {/* Blitz lock icons */}
        {captures && gameMode === 'blitz' && Array.from({ length: 6 }, (_, pid) => {
          if ((captures[pid] ?? 0) > 0) return null
          const homeCell = layout.homeCells[pid]?.[4]
          if (!homeCell) return null
          const s = 1.5
          return (
            <g key={`lock6-${pid}`} opacity="0.7">
              <rect x={homeCell.x - s * 0.6} y={homeCell.y - s * 0.1} width={s * 1.2} height={s * 0.9} rx={s * 0.12} fill="#FF5722" stroke="#BF360C" strokeWidth="0.15" />
              <path d={`M${homeCell.x - s * 0.35},${homeCell.y - s * 0.1} L${homeCell.x - s * 0.35},${homeCell.y - s * 0.45} A${s * 0.35},${s * 0.35} 0 0,1 ${homeCell.x + s * 0.35},${homeCell.y - s * 0.45} L${homeCell.x + s * 0.35},${homeCell.y - s * 0.1}`} fill="none" stroke="#BF360C" strokeWidth={s * 0.15} strokeLinecap="round" />
              <circle cx={homeCell.x} cy={homeCell.y + s * 0.15} r={s * 0.12} fill="#BF360C" />
            </g>
          )
        })}

        {/* Tokens */}
        {renderTokens6P(state, onTokenClick, validMoves, currentPlayer, layout)}
      </svg>
    </div>
  )
}

function renderTokens6P(state: GameState, onTokenClick: (p: PlayerId, t: number) => void, validMoves: number[], currentPlayer: PlayerId, layout: ReturnType<typeof getBoardLayout6P>) {
  const tl = getTrackLength(6)
  const d = tl + 6
  const tokenR = layout.cellSize * 0.38

  const trackGroups = new Map<number, Array<{ pid: PlayerId; tid: number }>>()
  state.players.forEach((player) => {
    player.tokens.forEach((token, tid) => {
      if (token.pathPosition >= 1 && token.pathPosition <= tl) {
        const ti = pathToTrackIndex6P(player.id, token.pathPosition)
        if (ti !== null) {
          if (!trackGroups.has(ti)) trackGroups.set(ti, [])
          trackGroups.get(ti)!.push({ pid: player.id, tid })
        }
      }
    })
  })

  const STACK_PATTERNS: [number, number][][] = [
    [[0, 0]], [[-0.6, 0], [0.6, 0]], [[-0.5, -0.4], [0.5, -0.4], [0, 0.5]], [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]],
  ]
  const STACK_SCALES = [1, 0.78, 0.7, 0.65]

  return state.players.map((player) =>
    player.tokens.map((token, tid) => {
      const pid = player.id
      let x: number, y: number
      let scale = 1

      if (token.pathPosition >= 1 && token.pathPosition <= tl) {
        const ti = pathToTrackIndex6P(pid, token.pathPosition)
        const group = ti !== null ? (trackGroups.get(ti) || []) : []
        const center = getTokenCellCenter6P(pid, token.pathPosition)

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
          ({ x, y } = getTokenCoords6P(pid, token.pathPosition, tid))
        }
      } else {
        ({ x, y } = getTokenCoords6P(pid, token.pathPosition, tid))
        if (token.pathPosition === d) scale = 0.55
      }

      const canMove = currentPlayer === pid && validMoves.includes(tid)
      const isCurrent = currentPlayer === pid
      const r = tokenR * scale

      return (
        <g key={`${pid}-${tid}`} transform={`translate(${x}, ${y})`}>
          <CoinToken pid={pid} r={r} canMove={canMove} isCurrent={isCurrent} onTokenClick={onTokenClick} tid={tid} />
        </g>
      )
    })
  )
}

// ─── Helpers ───

function getArrowTriangle(cx: number, cy: number, size: number, trackIdx: number): string {
  const angle = (trackIdx / 72) * 360 + 90
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const pts: [number, number][] = [
    [size, 0], [-size * 0.5, -size * 0.6], [-size * 0.5, size * 0.6],
  ]
  return pts.map(([px, py]) => `${px * cos - py * sin + cx},${px * sin + py * cos + cy}`).join(' ')
}

function getShortcutArrow(cx: number, cy: number, size: number, trackIdx: number): string {
  let angle = 0
  if (trackIdx === 8) angle = -90
  else if (trackIdx === 21) angle = 0
  else if (trackIdx === 34) angle = 90
  else if (trackIdx === 47) angle = 180
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const pts: [number, number][] = [
    [size, 0], [-size * 0.5, -size * 0.6], [-size * 0.2, 0], [-size * 0.5, size * 0.6],
  ]
  return pts.map(([px, py]) => `${px * cos - py * sin + cx},${px * sin + py * cos + cy}`).join(' ')
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
        return (
          <rect key={`corr-${i}`} x={r.x} y={r.y} width={r.width} height={r.height}
            fill="url(#cellGrad)" stroke="#C0B8A0" strokeWidth="0.18" />
        )
      })}
    </>
  )
}

function renderSnakesAndLadders(layout: ReturnType<typeof getBoardLayout>) {
  return (
    <g>
      {LADDERS.map(([bottom, top], li) => {
        const bCell = layout.trackCells[bottom]
        const tCell = layout.trackCells[top]
        if (!bCell || !tCell) return null
        const bx = PADDING + (bCell.col + 0.5) * CELL
        const by = PADDING + (bCell.row + 0.5) * CELL
        const tx = PADDING + (tCell.col + 0.5) * CELL
        const ty = PADDING + (tCell.row + 0.5) * CELL
        const dx = tx - bx, dy = ty - by
        const len = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / len, ny = dx / len
        const railW = CELL * 0.35
        const rungCount = Math.max(3, Math.round(len / (CELL * 0.7)))
        return (
          <g key={`ladder-${li}`} filter="url(#ladderShadow)">
            <line x1={bx + nx * railW} y1={by + ny * railW} x2={tx + nx * railW} y2={ty + ny * railW} stroke="#6D3A1A" strokeWidth="1.1" strokeLinecap="round" />
            <line x1={bx - nx * railW} y1={by - ny * railW} x2={tx - nx * railW} y2={ty - ny * railW} stroke="#6D3A1A" strokeWidth="1.1" strokeLinecap="round" />
            <line x1={bx + nx * railW} y1={by + ny * railW} x2={tx + nx * railW} y2={ty + ny * railW} stroke="#A0724A" strokeWidth="0.8" strokeLinecap="round" />
            <line x1={bx - nx * railW} y1={by - ny * railW} x2={tx - nx * railW} y2={ty - ny * railW} stroke="#A0724A" strokeWidth="0.8" strokeLinecap="round" />
            {Array.from({ length: rungCount }, (_, ri) => {
              const t = (ri + 1) / (rungCount + 1)
              return (
                <g key={`rung-${ri}`}>
                  <line x1={bx + dx * t + nx * railW} y1={by + dy * t + ny * railW} x2={bx + dx * t - nx * railW} y2={by + dy * t - ny * railW} stroke="#7A5230" strokeWidth="0.7" strokeLinecap="round" />
                  <line x1={bx + dx * t + nx * railW} y1={by + dy * t + ny * railW} x2={bx + dx * t - nx * railW} y2={by + dy * t - ny * railW} stroke="#C89A58" strokeWidth="0.25" strokeLinecap="round" />
                </g>
              )
            })}
          </g>
        )
      })}

      {SNAKES.map(([head, tail], si) => {
        const hCell = layout.trackCells[head]
        const tCell = layout.trackCells[tail]
        if (!hCell || !tCell) return null
        const hx = PADDING + (hCell.col + 0.5) * CELL
        const hy = PADDING + (hCell.row + 0.5) * CELL
        const tx = PADDING + (tCell.col + 0.5) * CELL
        const ty = PADDING + (tCell.row + 0.5) * CELL
        const dx = tx - hx, dy = ty - hy
        const len = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / len, ny = dx / len
        const waves = Math.max(3, Math.round(len / (CELL * 1.2)))
        const amp = CELL * 0.7
        let bodyPath = `M${hx},${hy}`
        for (let w = 0; w < waves; w++) {
          const dir = w % 2 === 0 ? 1 : -1
          const t1 = w / waves, t2 = (w + 1) / waves
          const taper = 1 - t2 * 0.35
          bodyPath += ` Q${hx + dx * ((t1 + t2) / 2) + nx * amp * dir * taper},${hy + dy * ((t1 + t2) / 2) + ny * amp * dir * taper} ${hx + dx * t2},${hy + dy * t2}`
        }
        const snakeColors = ['#4CAF50', '#E53935', '#FF9800', '#9C27B0']
        const snakeDarks = ['#2E7D32', '#B71C1C', '#E65100', '#6A1B9A']
        const snakeLights = ['#81C784', '#EF9A9A', '#FFB74D', '#CE93D8']
        const col = snakeColors[si % 4], dark = snakeDarks[si % 4], light = snakeLights[si % 4]
        const headR = CELL * 0.38, hdx = dx / len, hdy = dy / len
        return (
          <g key={`snake-${si}`} filter="url(#snakeShadow)">
            <path d={bodyPath} fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d={bodyPath} fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={bodyPath} fill="none" stroke={light} strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />
            <ellipse cx={hx} cy={hy} rx={headR * 1.1} ry={headR * 0.85} fill={col} stroke={dark} strokeWidth="0.3" />
            <circle cx={hx - hdx * headR * 0.3 + nx * headR * 0.35} cy={hy - hdy * headR * 0.3 + ny * headR * 0.35} r={CELL * 0.1} fill="white" />
            <circle cx={hx - hdx * headR * 0.3 - nx * headR * 0.35} cy={hy - hdy * headR * 0.3 - ny * headR * 0.35} r={CELL * 0.1} fill="white" />
            <circle cx={hx - hdx * headR * 0.35 + nx * headR * 0.35} cy={hy - hdy * headR * 0.35 + ny * headR * 0.35} r={CELL * 0.055} fill="#1A1A1A" />
            <circle cx={hx - hdx * headR * 0.35 - nx * headR * 0.35} cy={hy - hdy * headR * 0.35 - ny * headR * 0.35} r={CELL * 0.055} fill="#1A1A1A" />
            <path d={`M${hx - hdx * headR * 0.9},${hy - hdy * headR * 0.9} L${hx - hdx * headR * 1.6 + nx * headR * 0.25},${hy - hdy * headR * 1.6 + ny * headR * 0.25} M${hx - hdx * headR * 0.9},${hy - hdy * headR * 0.9} L${hx - hdx * headR * 1.6 - nx * headR * 0.25},${hy - hdy * headR * 1.6 - ny * headR * 0.25}`} fill="none" stroke="#E53935" strokeWidth="0.35" strokeLinecap="round" />
            <circle cx={tx} cy={ty} r={CELL * 0.15} fill={col} stroke={dark} strokeWidth="0.2" />
          </g>
        )
      })}
    </g>
  )
}
