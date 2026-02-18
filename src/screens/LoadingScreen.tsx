import { useEffect, useState, useMemo } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

const FUN_FACTS = [
  'The longest Ludo battle lasted for a whopping 3 hours!',
  'Ludo originated from an ancient Indian game called Pachisi.',
  'Rolling a 6 three times in a row is a 1 in 216 chance!',
  'Ludo was patented in England in 1896.',
  'The word "Ludo" comes from Latin meaning "I play".',
  'A standard Ludo board has 52 common track squares.',
]

const PAWN_COLORS = ['#E53935', '#43A047', '#FDD835', '#1E88E5']

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [factIndex, setFactIndex] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  const floatingPawns = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      color: PAWN_COLORS[i % 4],
      left: `${8 + (i * 13) % 84}%`,
      delay: `${i * 0.5}s`,
      duration: `${3 + (i % 3)}s`,
      size: 18 + (i % 3) * 6,
    })), [])

  const sparkles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
      size: `${2 + Math.random() * 3}px`,
    })), [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 6 + 2
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(() => setFadeOut(true), 300)
          setTimeout(onComplete, 800)
          return 100
        }
        return next
      })
    }, 80)
    return () => clearInterval(interval)
  }, [onComplete])

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(i => (i + 1) % FUN_FACTS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Sparkles */}
      <div className="loading-sparkles">
        {sparkles.map(s => (
          <div
            key={s.id}
            className="sparkle"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              animationDuration: s.duration,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </div>

      {/* Floating pawn silhouettes */}
      <div className="loading-pawns-bg">
        {floatingPawns.map(p => (
          <div
            key={p.id}
            className="loading-floating-pawn"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          >
            <svg viewBox="0 0 32 44" width={p.size} height={p.size * 1.375}>
              <ellipse cx="16" cy="41" rx="12" ry="3" fill={p.color} opacity="0.15" />
              <rect x="4" y="36" width="24" height="5" rx="2.5" fill={p.color} opacity="0.5" />
              <path
                d={`M7,36 Q10,22 12,18 L20,18 Q22,22 25,36 Z`}
                fill={p.color}
                opacity="0.6"
              />
              <circle cx="16" cy="12" r="8" fill={p.color} opacity="0.7" />
              <circle cx="14" cy="9" r="2.5" fill="rgba(255,255,255,0.3)" />
            </svg>
          </div>
        ))}
      </div>

      {/* Logo */}
      <h1 className="loading-logo">
        <span className="splash-logo-ludo">ROLL</span>
        <span className="splash-logo-star">HOME</span>
      </h1>

      {/* Animated pawns circle */}
      <div className="loading-pawn-orbit">
        {PAWN_COLORS.map((color, i) => (
          <div
            key={i}
            className="loading-orbit-pawn"
            style={{
              '--orbit-angle': `${i * 90}deg`,
              '--orbit-color': color,
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 24 34" width="28" height="38">
              <rect x="4" y="28" width="16" height="4" rx="2" fill={color} />
              <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill={color} />
              <circle cx="12" cy="9" r="6" fill={color} />
              <circle cx="10.5" cy="7" r="1.8" fill="rgba(255,255,255,0.35)" />
            </svg>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="loading-progress-container">
        <div className="loading-bar-bg">
          <div
            className="loading-bar-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <span className="loading-percent">{Math.round(Math.min(progress, 100))}%</span>
        </div>
        <p className="loading-text-below">
          {progress < 100 ? 'Preparing the board...' : 'Ready!'}
        </p>
      </div>

      {/* Branding */}
      <p className="loading-brand">By MarketingBuckle</p>

      {/* Fun fact */}
      <p className="loading-fact" key={factIndex}>{FUN_FACTS[factIndex]}</p>
    </div>
  )
}
