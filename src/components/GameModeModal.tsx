import { useState } from 'react'
import type { GameMode } from '../types/game'

interface GameModeModalProps {
  mode: '2-player' | '4-player'
  onClose: () => void
  onStart: (gameMode: GameMode) => void
}

const TIERS = [
  { name: 'Bronze', icon: '🥉', color: '#CD7F32', win: '5K', entry: '2.5K', stars: 10, xp: 14 },
  { name: 'Silver', icon: '🥈', color: '#C0C0C0', win: '20K', entry: '10K', stars: 40, xp: 56 },
  { name: 'Gold', icon: '🥇', color: '#FFD700', win: '100K', entry: '50K', stars: 100, xp: 140 },
]

const MODE_DESC: Record<GameMode, string> = {
  classic: 'Standard Ludo rules. Roll a 6 to enter.',
  arrow: 'Arrow shortcuts on the board! Leap forward.',
  blitz: 'Fast mode! Enter on ANY roll. No safe spots.',
}

export function GameModeModal({ mode, onClose, onStart }: GameModeModalProps) {
  const [activeTab, setActiveTab] = useState<GameMode>('classic')

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content">
        <div className="modal-header">
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
          <span className="modal-header-icon">
            {mode === '2-player' ? '🎲' : '🎯'}
          </span>
          <h2 className="modal-title">
            {mode === '2-player' ? '2 PLAYERS' : '4 PLAYERS'}
          </h2>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          {(['classic', 'arrow', 'blitz'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={`mode-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="mode-tab-icon">
                {tab === 'classic' ? '🛡️' : tab === 'arrow' ? '🏹' : '⚡'}
              </span>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className="mode-desc">{MODE_DESC[activeTab]}</p>

        {/* Tier Cards */}
        <div className="tier-container">
          {TIERS.map(tier => (
            <div key={tier.name} className="tier-card">
              <div className="tier-badge">
                <span className="tier-badge-icon">{tier.icon}</span>
                <span style={{ color: tier.color }}>{tier.name.toUpperCase()}</span>
              </div>

              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.75rem' }}>WIN!</div>

              <div className="tier-rewards">
                <div className="tier-reward-item">
                  <span className="tier-reward-icon">🪙</span>
                  <span className="tier-reward-value">{tier.win}</span>
                </div>
                <div className="tier-reward-item">
                  <span className="tier-reward-icon">📦</span>
                  <span className="tier-reward-value">1x</span>
                </div>
              </div>

              <div className="tier-info">
                <div className="tier-info-item">
                  <span>⭐</span>
                  <span>{tier.stars}</span>
                </div>
                <div className="tier-info-item">
                  <span>🎖️</span>
                  <span>{tier.xp}</span>
                </div>
              </div>

              <button type="button" className="tier-play-btn" onClick={() => onStart(activeTab)}>
                <span>🪙</span>
                <span>{tier.entry}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
