import { useEffect, useState } from 'react'

interface DiceProps {
  value: number
  rolling?: boolean
  size?: number
}

const DOTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
}

export function Dice({ value, rolling = false, size = 48 }: DiceProps) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    if (!rolling) setDisplay(value)
  }, [value, rolling])
  useEffect(() => {
    if (!rolling) return
    const id = setInterval(() => setDisplay((d) => (d % 6) + 1), 80)
    return () => clearInterval(id)
  }, [rolling])

  const dots = DOTS[display] ?? DOTS[1]
  return (
    <div
      className={`dice ${rolling ? 'dice-rolling' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 1 1" width={size} height={size}>
        <rect width="1" height="1" rx="0.15" fill="rgba(255,255,255,0.95)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.04" />
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.12" fill="#1e293b" />
        ))}
      </svg>
    </div>
  )
}
