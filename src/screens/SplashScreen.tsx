import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300)
    const t2 = setTimeout(() => setShowSubtitle(true), 800)
    const t3 = setTimeout(() => setFadeOut(true), 2200)
    const t4 = setTimeout(onComplete, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated background rings */}
      <div className="splash-rings">
        <div className="splash-ring splash-ring-1" />
        <div className="splash-ring splash-ring-2" />
        <div className="splash-ring splash-ring-3" />
      </div>

      {/* Floating colored dots */}
      <div className="splash-particles">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div
            key={i}
            className="splash-particle"
            style={{
              '--delay': `${i * 0.3}s`,
              '--x': `${15 + (i * 11) % 70}%`,
              '--size': `${6 + (i % 3) * 4}px`,
              background: ['#E53935', '#43A047', '#FDD835', '#1E88E5'][i % 4],
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Dice icon with bounce */}
      <div className={`splash-dice-icon ${showTitle ? 'splash-dice-visible' : ''}`}>
        <svg viewBox="0 0 60 60" width="64" height="64">
          <defs>
            <linearGradient id="splashDice" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E1" />
              <stop offset="100%" stopColor="#FFE0B2" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="52" height="52" rx="10" fill="url(#splashDice)" />
          <rect x="4" y="4" width="52" height="52" rx="10" fill="none" stroke="#C9A96E" strokeWidth="2" />
          <circle cx="18" cy="18" r="4.5" fill="#D32F2F" />
          <circle cx="42" cy="18" r="4.5" fill="#D32F2F" />
          <circle cx="30" cy="30" r="4.5" fill="#D32F2F" />
          <circle cx="18" cy="42" r="4.5" fill="#D32F2F" />
          <circle cx="42" cy="42" r="4.5" fill="#D32F2F" />
        </svg>
      </div>

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
