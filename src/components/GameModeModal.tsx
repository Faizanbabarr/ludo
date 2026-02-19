import { useState, useRef, useEffect } from 'react'
import { parseTierEntry, formatNum } from '../utils/shop'
import type { GameMode } from '../types/game'

interface GameModeModalProps {
  mode: '2-player' | '4-player' | '6-player'
  onClose: () => void
  onStart: (gameMode: GameMode, entryFee: number) => void
  title?: string
  coins?: number
}

const TIERS = [
  { name: 'Trainee', icon: '🎓', color: '#78909C', win: '1K', entry: '500', stars: 5, xp: 7 },
  { name: 'Bronze', icon: '🥉', color: '#CD7F32', win: '5K', entry: '2.5K', stars: 10, xp: 14 },
  { name: 'Silver', icon: '🥈', color: '#C0C0C0', win: '20K', entry: '10K', stars: 40, xp: 56 },
  { name: 'Gold', icon: '🥇', color: '#FFD700', win: '100K', entry: '50K', stars: 100, xp: 140 },
]

const MODE_INFO: Record<GameMode, { icon: string; label: string; desc: string }> = {
  classic: {
    icon: '🛡️',
    label: 'CLASSIC',
    desc: 'Standard Ludo rules. Roll 6 to enter. Get all 4 tokens home to win!',
  },
  arrow: {
    icon: '🏹',
    label: 'ARROW',
    desc: 'Classic rules + arrow shortcuts! Land on arrow to leap forward + extra turn.',
  },
  blitz: {
    icon: '⚡',
    label: 'BLITZ',
    desc: 'First to get 1 token home wins! Has arrows. Must kill to enter home.',
  },
  snakeladder: {
    icon: '🐍',
    label: 'S&L',
    desc: 'Snakes pull you back, ladders push you forward!',
  },
}

const MODE_TABS: GameMode[] = ['classic', 'arrow', 'blitz', 'snakeladder']

export function GameModeModal({ mode, onClose, onStart, title, coins }: GameModeModalProps) {
  const [activeTab, setActiveTab] = useState<GameMode>('classic')
  const [activeTier, setActiveTier] = useState(0)
  const tierRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = tierRef.current
    if (!container) return
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const cardWidth = container.scrollWidth / TIERS.length
      const idx = Math.round(scrollLeft / cardWidth)
      setActiveTier(Math.max(0, Math.min(TIERS.length - 1, idx)))
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const numP = mode === '2-player' ? 2 : mode === '4-player' ? 4 : 6
  const modeEmoji = numP === 2 ? '⚔️' : numP === 4 ? '🎯' : '🌟'
  const tabIndex = MODE_TABS.indexOf(activeTab)

  const [descVisible, setDescVisible] = useState(true)
  const [displayedTab, setDisplayedTab] = useState<GameMode>(activeTab)

  const prevTab = useRef(activeTab)
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      setDescVisible(false)
      const t = setTimeout(() => {
        setDisplayedTab(activeTab)
        setDescVisible(true)
      }, 200)
      prevTab.current = activeTab
      return () => clearTimeout(t)
    }
  }, [activeTab])

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content gm-modal">
        <button type="button" className="modal-close" onClick={onClose}>✕</button>

        <div className="gm-header">
          <span className="gm-header-icon">{modeEmoji}</span>
          <h2 className="gm-title">{title || `${numP} PLAYERS`}</h2>
        </div>

        {coins !== undefined && (
          <div className="gm-coins-display">
            <span>🪙</span>
            <span>{formatNum(coins)}</span>
          </div>
        )}

        <div className="gm-mode-tabs">
          <div
            className="gm-tab-indicator"
            style={{ left: `calc(${tabIndex} * 25% + 0.2rem)`, width: `calc(25% - 0.2rem)` }}
          />
          {MODE_TABS.map(tab => {
            const info = MODE_INFO[tab]
            return (
              <button
                key={tab}
                type="button"
                className={`gm-mode-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="gm-mode-tab-icon">{info.icon}</span>
                <span>{info.label}</span>
              </button>
            )
          })}
        </div>

        <p className={`gm-mode-desc ${descVisible ? 'gm-desc-show' : 'gm-desc-hide'}`}>
          {MODE_INFO[displayedTab].desc}
        </p>

        <div className="gm-tier-scroll" ref={tierRef}>
          {TIERS.map((tier, idx) => {
            const fee = parseTierEntry(tier.entry)
            const canAfford = coins === undefined || coins >= fee
            return (
              <div key={tier.name} className={`gm-tier-card ${idx === activeTier ? 'active' : ''}`}>
                <div className="gm-tier-badge">
                  <span className="gm-tier-icon">{tier.icon}</span>
                  <span className="gm-tier-name" style={{ color: tier.color }}>{tier.name.toUpperCase()}</span>
                </div>

                <div className="gm-tier-win-label">WIN!</div>
                <div className="gm-tier-rewards">
                  <div className="gm-tier-reward">
                    <span className="gm-tier-reward-icon">🪙</span>
                    <span className="gm-tier-reward-val">{tier.win}</span>
                  </div>
                  <div className="gm-tier-reward">
                    <span className="gm-tier-reward-icon">📦</span>
                    <span className="gm-tier-reward-val">1x</span>
                  </div>
                </div>

                <div className="gm-tier-info">
                  <div className="gm-tier-info-item">
                    <span>⭐</span>
                    <span>{tier.stars}</span>
                  </div>
                  <div className="gm-tier-info-item">
                    <span>🎖️</span>
                    <span>{tier.xp}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`gm-play-btn ${!canAfford ? 'gm-play-btn-disabled' : ''}`}
                  onClick={() => canAfford && onStart(activeTab, fee)}
                  disabled={!canAfford}
                >
                  <span>🪙</span>
                  <span>{tier.entry}</span>
                  {!canAfford && <span className="gm-insufficient">Low</span>}
                </button>
              </div>
            )
          })}
        </div>

        <div className="gm-tier-dots">
          {TIERS.map((_, idx) => (
            <span key={idx} className={`gm-tier-dot ${idx === activeTier ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
