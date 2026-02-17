import type { GameState, PlayerId } from '../types/game'
import { PLAYER_COLORS } from '../types/game'
import { getTokenCoords } from '../utils/boardCoords'
import { getTrackPath } from '../utils/boardCoords'

interface BoardProps {
  state: GameState
  onTokenClick: (player: PlayerId, tokenIndex: number) => void
  validMoves: number[]
  currentPlayer: PlayerId
}

export function Board({ state, onTokenClick, validMoves }: BoardProps) {
  const size = 100
  const trackPath = getTrackPath()

  return (
    <div className="board-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="board-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#234a1a" />
            <stop offset="100%" stopColor="#162d0f" />
          </linearGradient>
          <filter id="boardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.25" />
          </filter>
          {PLAYER_COLORS.map((c, i) => (
            <linearGradient key={i} id={`player${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c} />
              <stop offset="100%" stopColor={c} style={{ stopOpacity: 0.75 }} />
            </linearGradient>
          ))}
        </defs>
        <rect width={size} height={size} fill="#1a3d28" />
        <rect x="14" y="14" width="72" height="72" rx="5" fill="url(#trackGrad)" stroke="rgba(74, 222, 128, 0.25)" strokeWidth="1" filter="url(#boardShadow)" />
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        {/* Home bases - corners */}
        {[
          { x: 16, y: 51, color: PLAYER_COLORS[0] },
          { x: 51, y: 51, color: PLAYER_COLORS[1] },
          { x: 51, y: 16, color: PLAYER_COLORS[2] },
          { x: 16, y: 16, color: PLAYER_COLORS[3] },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width="15" height="15" rx="3" fill={b.color} opacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
        ))}
        {/* Tokens - with transition for smooth movement */}
        {state.players.map((player, pid) =>
          player.tokens.map((token, tid) => {
            const { x, y } = getTokenCoords(pid as PlayerId, token.pathPosition, tid)
            const canMove = state.currentPlayer === pid && validMoves.includes(tid)
            const isCurrent = state.currentPlayer === pid
            return (
              <g
                key={`${pid}-${tid}`}
                onClick={() => isCurrent && canMove && onTokenClick(pid as PlayerId, tid)}
                style={{ cursor: isCurrent ? (canMove ? 'pointer' : 'default') : 'default' }}
              >
                <circle
                  className="token"
                  cx={x}
                  cy={y}
                  r="3.25"
                  fill={`url(#player${pid})`}
                  stroke={canMove ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.25)'}
                  strokeWidth={canMove ? '0.7' : '0.3'}
                />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}
