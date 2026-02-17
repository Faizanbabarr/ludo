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
      <svg viewBox={`0 0 ${size} ${size}`} className="board-svg">
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d5016" />
            <stop offset="100%" stopColor="#1a3009" />
          </linearGradient>
          {PLAYER_COLORS.map((c, i) => (
            <linearGradient key={i} id={`player${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c} />
              <stop offset="100%" stopColor={c} style={{ stopOpacity: 0.7 }} />
            </linearGradient>
          ))}
        </defs>
        <rect width={size} height={size} fill="#1a472a" />
        <rect x="15" y="15" width="70" height="70" rx="4" fill="url(#trackGrad)" stroke="#4a7c59" strokeWidth="0.8" />
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
        {/* Home bases */}
        {[
          { x: 17, y: 52, color: PLAYER_COLORS[0] },
          { x: 52, y: 52, color: PLAYER_COLORS[1] },
          { x: 52, y: 17, color: PLAYER_COLORS[2] },
          { x: 17, y: 17, color: PLAYER_COLORS[3] },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width="14" height="14" rx="2" fill={b.color} opacity="0.5" />
        ))}
        {/* Tokens */}
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
                  cx={x}
                  cy={y}
                  r="3.2"
                  fill={`url(#player${pid})`}
                  stroke={canMove ? '#fff' : '#333'}
                  strokeWidth={canMove ? '0.6' : '0.25'}
                />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}
