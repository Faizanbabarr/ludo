import { useEffect, useState } from 'react'

interface DiceProps {
  value: number
  rolling?: boolean
  size?: number
  canRoll?: boolean
  onRoll?: () => void
}

const DOTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]],
}

export function Dice({ value, rolling = false, size = 48, canRoll = false, onRoll }: DiceProps) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!rolling) setDisplay(value)
  }, [value, rolling])

  useEffect(() => {
    if (!rolling) return
    const id = setInterval(() => setDisplay((d) => (d % 6) + 1), 70)
    return () => clearInterval(id)
  }, [rolling])

  const dots = DOTS[display] ?? DOTS[1]

  return (
    <div
      className={`dice ${rolling ? 'dice-rolling' : ''} ${canRoll ? 'dice-clickable' : ''}`}
      style={{ width: size, height: size }}
      onClick={canRoll && onRoll ? onRoll : undefined}
    >
      <svg viewBox="0 0 1 1" width={size} height={size}>
        <defs>
          <linearGradient id="diceBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="40%" stopColor="#FFF8E1" />
            <stop offset="100%" stopColor="#FFE0B2" />
          </linearGradient>
          <linearGradient id="diceEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8D5B0" />
            <stop offset="100%" stopColor="#C9A96E" />
          </linearGradient>
          <radialGradient id="dotGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#D32F2F" />
            <stop offset="100%" stopColor="#8B0000" />
          </radialGradient>
          <filter id="diceShadow" x="-20%" y="-10%" width="140%" height="150%">
            <feDropShadow dx="0" dy="0.03" stdDeviation="0.025" floodColor="#000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Shadow base */}
        <rect x="0.04" y="0.06" width="0.96" height="0.96" rx="0.18" fill="rgba(0,0,0,0.12)" />

        {/* Edge depth */}
        <rect x="0.02" y="0.03" width="0.96" height="0.96" rx="0.17" fill="url(#diceEdge)" />

        {/* Main face */}
        <rect width="0.95" height="0.93" rx="0.16" fill="url(#diceBody)" filter="url(#diceShadow)" />

        {/* Top shine */}
        <rect x="0.06" y="0.04" width="0.38" height="0.14" rx="0.06" fill="rgba(255,255,255,0.6)" />

        {/* Side highlight */}
        <rect x="0.03" y="0.03" width="0.06" height="0.5" rx="0.03" fill="rgba(255,255,255,0.25)" />

        {/* Dots */}
        {dots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x + 0.008} cy={y + 0.008} r="0.088" fill="rgba(0,0,0,0.1)" />
            <circle cx={x} cy={y} r="0.085" fill="url(#dotGrad)" />
            <circle cx={x - 0.025} cy={y - 0.025} r="0.028" fill="rgba(255,255,255,0.35)" />
          </g>
        ))}
      </svg>
    </div>
  )
}
