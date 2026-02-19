import { useEffect, useState } from 'react'

export interface DiceStyle {
  id: string
  name: string
  bodyColor: string
  bodyGradient: [string, string, string]
  edgeColor: string
  dotColor: string
  dotHighlight: string
  shineOpacity: number
}

export const DICE_STYLES: DiceStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    bodyColor: '#FFFDF5',
    bodyGradient: ['#FFFFFF', '#FFF8E1', '#F5E6C8'],
    edgeColor: '#C9A96E',
    dotColor: '#B71C1C',
    dotHighlight: '#F44336',
    shineOpacity: 0.55,
  },
  {
    id: 'royal-red',
    name: 'Royal Red',
    bodyColor: '#D32F2F',
    bodyGradient: ['#EF5350', '#D32F2F', '#B71C1C'],
    edgeColor: '#8B0000',
    dotColor: '#FFFFFF',
    dotHighlight: '#FFFDE7',
    shineOpacity: 0.4,
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    bodyColor: '#1565C0',
    bodyGradient: ['#42A5F5', '#1E88E5', '#0D47A1'],
    edgeColor: '#0D47A1',
    dotColor: '#FFFFFF',
    dotHighlight: '#E3F2FD',
    shineOpacity: 0.45,
  },
  {
    id: 'shadow-black',
    name: 'Shadow',
    bodyColor: '#2C2C2C',
    bodyGradient: ['#555555', '#333333', '#1A1A1A'],
    edgeColor: '#111111',
    dotColor: '#FFD700',
    dotHighlight: '#FFF8E1',
    shineOpacity: 0.3,
  },
  {
    id: 'golden',
    name: 'Golden',
    bodyColor: '#F9A825',
    bodyGradient: ['#FFD54F', '#F9A825', '#F57F17'],
    edgeColor: '#E65100',
    dotColor: '#FFFFFF',
    dotHighlight: '#FFF8E1',
    shineOpacity: 0.5,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    bodyColor: '#2E7D32',
    bodyGradient: ['#66BB6A', '#43A047', '#1B5E20'],
    edgeColor: '#1B5E20',
    dotColor: '#FFFFFF',
    dotHighlight: '#E8F5E9',
    shineOpacity: 0.4,
  },
]

interface DiceProps {
  value: number
  rolling?: boolean
  size?: number
  canRoll?: boolean
  onRoll?: () => void
  style?: DiceStyle
  instanceId?: string
}

const DOTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]],
}

export function Dice({ value, rolling = false, size = 48, canRoll = false, onRoll, style: diceStyle, instanceId }: DiceProps) {
  const [cycleValue, setCycleValue] = useState(value || 1)
  const s = diceStyle ?? DICE_STYLES[0]

  useEffect(() => {
    if (!rolling) {
      setCycleValue(value || 1)
      return
    }
    const id = setInterval(() => {
      setCycleValue((d) => {
        let next = d
        while (next === d) next = Math.floor(Math.random() * 6) + 1
        return next
      })
    }, 80)
    // Settle on the actual value before rolling animation ends
    const settleTimer = setTimeout(() => {
      clearInterval(id)
      setCycleValue(value || 1)
    }, 420)
    return () => {
      clearInterval(id)
      clearTimeout(settleTimer)
    }
  }, [rolling, value])

  const shownValue = cycleValue
  const dots = DOTS[shownValue] ?? DOTS[1]
  const uid = instanceId ? `${s.id}-${instanceId}` : s.id

  return (
    <div
      className={`dice ${rolling ? 'dice-rolling' : ''} ${canRoll ? 'dice-clickable' : ''}`}
      style={{ width: size, height: size }}
      onClick={canRoll && onRoll ? onRoll : undefined}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          {/* 3D body gradient */}
          <linearGradient id={`dBody-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={s.bodyGradient[0]} />
            <stop offset="45%" stopColor={s.bodyGradient[1]} />
            <stop offset="100%" stopColor={s.bodyGradient[2]} />
          </linearGradient>

          {/* Edge depth gradient */}
          <linearGradient id={`dEdge-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={s.edgeColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={s.edgeColor} />
          </linearGradient>

          {/* Top face highlight */}
          <linearGradient id={`dShine-${uid}`} x1="0%" y1="0%" x2="60%" y2="60%">
            <stop offset="0%" stopColor="white" stopOpacity={s.shineOpacity} />
            <stop offset="50%" stopColor="white" stopOpacity={s.shineOpacity * 0.2} />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Dot indentation shadow */}
          <radialGradient id={`dDot-${uid}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={s.dotHighlight} />
            <stop offset="50%" stopColor={s.dotColor} />
            <stop offset="100%" stopColor={s.dotColor} stopOpacity="0.8" />
          </radialGradient>

          {/* Drop shadow filter */}
          <filter id={`dShadow-${uid}`} x="-20%" y="-10%" width="140%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
          </filter>

          {/* Inner shadow for 3D depth */}
          <filter id={`dInner-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dx="1.5" dy="2" result="offset" />
            <feComposite in="SourceGraphic" in2="offset" operator="over" />
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="52" cy="94" rx="36" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* 3D depth — bottom-right edge */}
        <rect x="6" y="8" width="88" height="88" rx="18" fill={`url(#dEdge-${uid})`} />

        {/* Main dice body */}
        <rect
          x="4" y="4"
          width="86" height="86"
          rx="17"
          fill={`url(#dBody-${uid})`}
          filter={`url(#dShadow-${uid})`}
        />

        {/* Beveled inner face */}
        <rect
          x="8" y="8"
          width="78" height="78"
          rx="14"
          fill={`url(#dBody-${uid})`}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />

        {/* Top-left glossy shine */}
        <rect
          x="8" y="8"
          width="78" height="78"
          rx="14"
          fill={`url(#dShine-${uid})`}
        />

        {/* Specular highlight — top edge */}
        <rect
          x="14" y="10"
          width="42" height="12"
          rx="6"
          fill="rgba(255,255,255,0.35)"
        />

        {/* Left edge specular */}
        <rect
          x="8" y="14"
          width="6" height="40"
          rx="3"
          fill="rgba(255,255,255,0.15)"
        />

        {/* Bottom-right subtle shadow on face */}
        <rect
          x="40" y="50"
          width="48" height="38"
          rx="12"
          fill="rgba(0,0,0,0.04)"
        />

        {/* Dots with 3D indentation effect */}
        {dots.map(([dx, dy], i) => {
          const cx = dx * 78 + 8
          const cy = dy * 78 + 8
          const dotR = 7.5
          return (
            <g key={i}>
              {/* Dot socket shadow */}
              <circle cx={cx + 0.5} cy={cy + 0.8} r={dotR + 0.5} fill="rgba(0,0,0,0.12)" />
              {/* Dot body */}
              <circle cx={cx} cy={cy} r={dotR} fill={`url(#dDot-${uid})`} />
              {/* Dot inner specular */}
              <circle cx={cx - 2} cy={cy - 2.2} r={dotR * 0.32} fill="rgba(255,255,255,0.4)" />
            </g>
          )
        })}

        {/* Edge rim highlight */}
        <rect
          x="4" y="4"
          width="86" height="86"
          rx="17"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
