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
  const [showFact, setShowFact] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

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

  // Crossfade fun facts
  useEffect(() => {
    const interval = setInterval(() => {
      setShowFact(false)
      setTimeout(() => {
        setFactIndex(i => (i + 1) % FUN_FACTS.length)
        setShowFact(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const p = Math.min(progress, 100)
  // Ring progress: circumference of r=62 circle
  const circumference = 2 * Math.PI * 62
  const strokeOffset = circumference - (p / 100) * circumference

  // Color transitions through player colors based on progress
  const ringColor = p < 25 ? PAWN_COLORS[0]
    : p < 50 ? PAWN_COLORS[1]
    : p < 75 ? PAWN_COLORS[2]
    : PAWN_COLORS[3]

  return (
    <div className={`loading-screen ${fadeOut ? 'loading-exit' : ''}`}>
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

      {/* Logo */}
      <h1 className="loading-logo">
        <span className="splash-logo-ludo">ROLL</span>
        <span className="splash-logo-star">HOME</span>
      </h1>

      {/* 3D rotating board with circular progress ring */}
      <div className="loading-3d-container">
        {/* SVG progress ring */}
        <svg className="loading-ring" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          {/* Progress ring */}
          <circle
            cx="70" cy="70" r="62"
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="loading-ring-progress"
            transform="rotate(-90 70 70)"
          />
          {/* Glow dot at progress end */}
          <circle
            cx="70" cy="8"
            r="4"
            fill={ringColor}
            className="loading-ring-dot"
            transform={`rotate(${(p / 100) * 360 - 90} 70 70)`}
            opacity={p > 2 ? 1 : 0}
          >
            <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* 3D spinning mini board */}
        <div className="loading-3d-board">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <rect x="0" y="0" width="80" height="80" rx="6" fill="#FFFDE7" stroke="#8B6914" strokeWidth="2.5" />
            <rect x="0" y="0" width="32" height="32" rx="3" fill="#E53935" opacity="0.75" />
            <rect x="48" y="0" width="32" height="32" rx="3" fill="#43A047" opacity="0.75" />
            <rect x="0" y="48" width="32" height="32" rx="3" fill="#1E88E5" opacity="0.75" />
            <rect x="48" y="48" width="32" height="32" rx="3" fill="#FDD835" opacity="0.75" />
            <rect x="32" y="32" width="16" height="16" rx="2" fill="#FFD700" opacity="0.6" />
            {/* Mini pawns */}
            <circle cx="16" cy="16" r="4" fill="white" opacity="0.7" />
            <circle cx="64" cy="16" r="4" fill="white" opacity="0.7" />
            <circle cx="16" cy="64" r="4" fill="white" opacity="0.7" />
            <circle cx="64" cy="64" r="4" fill="white" opacity="0.7" />
          </svg>
        </div>

        {/* Percentage text */}
        <span className="loading-percent-center">{Math.round(p)}%</span>
      </div>

      {/* Status text */}
      <p className="loading-status">
        {p < 100 ? 'Preparing the board...' : 'Ready!'}
      </p>

      {/* Fun fact with crossfade */}
      <p className={`loading-fact ${showFact ? 'loading-fact-show' : 'loading-fact-hide'}`}>
        {FUN_FACTS[factIndex]}
      </p>

      {/* Branding */}
      <p className="loading-brand">By MarketingBuckle</p>
    </div>
  )
}
