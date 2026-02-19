import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [showDice, setShowDice] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setShowDice(true), 300)
    const t1 = setTimeout(() => setShowTitle(true), 900)
    const t2 = setTimeout(() => setShowSubtitle(true), 1500)
    const t3 = setTimeout(() => setFadeOut(true), 2800)
    const t4 = setTimeout(onComplete, 3400)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated background with hue shift */}
      <div className="splash-bg-shift" />

      {/* Animated rings with 3D perspective */}
      <div className="splash-3d-stage">
        <div className="splash-rings">
          <div className="splash-ring splash-ring-1" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-ring splash-ring-3" />
        </div>
      </div>

      {/* Floating colored particles */}
      <div className="splash-particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              '--delay': `${i * 0.2}s`,
              '--x': `${8 + (i * 7.5) % 84}%`,
              '--size': `${5 + (i % 4) * 3}px`,
              '--drift': `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
              background: ['#E53935', '#43A047', '#FDD835', '#1E88E5'][i % 4],
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Rolling dice animation */}
      <div className={`splash-dice-roll ${showDice ? 'splash-dice-visible' : ''}`}>
        <svg viewBox="0 0 60 60" width="56" height="56">
          <defs>
            <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E8E0F0" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="56" height="56" rx="10" fill="url(#diceGrad)" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="15" cy="15" r="4.5" fill="#4A1A6B" />
          <circle cx="45" cy="15" r="4.5" fill="#4A1A6B" />
          <circle cx="30" cy="30" r="4.5" fill="#E53935" />
          <circle cx="15" cy="45" r="4.5" fill="#4A1A6B" />
          <circle cx="45" cy="45" r="4.5" fill="#4A1A6B" />
        </svg>
      </div>

      {/* Crown icon with 3D entrance */}
      <div className={`splash-crown ${showTitle ? 'splash-crown-visible' : ''}`}>
        <svg viewBox="0 0 80 70" width="72" height="62">
          <defs>
            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0D060" />
              <stop offset="40%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
            <linearGradient id="crownDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
          </defs>
          <polygon points="8,52 16,22 28,38 40,14 52,38 64,22 72,52" fill="url(#crownGrad)" />
          <rect x="8" y="52" width="64" height="10" rx="3" fill="url(#crownDark)" />
          <polygon points="12,50 18,26 28,38 40,18 52,38 62,26 68,50" fill="none" stroke="#FFF8E1" strokeWidth="1" opacity="0.35" />
          <circle cx="40" cy="20" r="4" fill="#E53935" />
          <circle cx="40" cy="20" r="2" fill="#FF6659" opacity="0.6" />
          <circle cx="20" cy="32" r="3" fill="#1E88E5" />
          <circle cx="60" cy="32" r="3" fill="#43A047" />
          <circle cx="28" cy="57" r="2.5" fill="#FDD835" opacity="0.7" />
          <circle cx="40" cy="57" r="2.5" fill="#E53935" opacity="0.7" />
          <circle cx="52" cy="57" r="2.5" fill="#1E88E5" opacity="0.7" />
        </svg>
      </div>

      {/* Title with 3D flip entrance */}
      <h1 className={`splash-logo ${showTitle ? 'splash-logo-visible' : ''}`}>
        <span className="splash-logo-ludo">ROLL</span>
        <span className="splash-logo-star">HOME</span>
      </h1>

      <p className={`splash-subtitle ${showSubtitle ? 'splash-subtitle-visible' : ''}`}>
        The Classic Board Game
      </p>

      {/* Bottom colored bar */}
      <div className={`splash-color-bar ${showSubtitle ? 'splash-bar-visible' : ''}`}>
        <div className="splash-bar-segment" style={{ background: '#E53935' }} />
        <div className="splash-bar-segment" style={{ background: '#43A047' }} />
        <div className="splash-bar-segment" style={{ background: '#FDD835' }} />
        <div className="splash-bar-segment" style={{ background: '#1E88E5' }} />
      </div>
    </div>
  )
}
