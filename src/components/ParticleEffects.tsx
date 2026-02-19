import { useEffect, useState } from 'react'

interface Particle {
  id: number
  tx: string
  ty: string
  color: string
  shape: 'circle' | 'star' | 'diamond'
  size: number
  delay: string
}

interface ParticleBurstProps {
  x: number
  y: number
  color: string
  onDone: () => void
}

export function ParticleBurst({ x, y, color, onDone }: ParticleBurstProps) {
  const [particles] = useState<Particle[]>(() => {
    const count = 14
    const colors = [color, '#FFD700', '#FF8C00', '#fff']
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const dist = 20 + Math.random() * 30
      return {
        id: i,
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist}px`,
        color: colors[i % colors.length],
        shape: (['circle', 'star', 'diamond'] as const)[i % 3],
        size: 3 + Math.random() * 4,
        delay: `${Math.random() * 0.1}s`,
      }
    })
  })

  useEffect(() => {
    const timer = setTimeout(onDone, 700)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="particle-container"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className={`particle particle-${p.shape}`}
          style={{
            '--tx': p.tx,
            '--ty': p.ty,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
