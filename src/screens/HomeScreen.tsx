import { useState } from 'react'
import { GameModeModal } from '../components/GameModeModal'
import type { GameMode } from '../types/game'

interface HomeScreenProps {
  onPlayLocal: (players: 2 | 4, gameMode: GameMode) => void
  onPlayOnline: () => void
}

export function HomeScreen({ onPlayLocal, onPlayOnline }: HomeScreenProps) {
  const [modal, setModal] = useState<'2-player' | '4-player' | null>(null)

  return (
    <>
      <div className="home-screen">
        {/* Animated BG particles */}
        <div className="home-bg-particles">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="home-bg-particle"
              style={{
                '--x': `${10 + Math.random() * 80}%`,
                '--delay': `${i * 0.7}s`,
                '--dur': `${6 + Math.random() * 4}s`,
                '--size': `${3 + Math.random() * 4}px`,
                background: ['#E53935', '#43A047', '#FDD835', '#1E88E5', '#FFD700', '#FF8C00', '#7B68EE', '#E91E63'][i],
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="xp-badge">
              <span className="xp-star">⭐</span>
              <span>438 / 500</span>
            </div>
          </div>
          <div className="top-bar-left">
            <div className="currency-badge">
              <span className="currency-icon">🪙</span>
              <span>700.1M</span>
            </div>
            <div className="currency-badge">
              <span className="currency-icon">💎</span>
              <span>12.98K</span>
            </div>
          </div>
          <button type="button" className="settings-btn">⚙️</button>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <circle cx="20" cy="14" r="9" fill="rgba(255,255,255,0.9)" />
              <ellipse cx="20" cy="34" rx="14" ry="10" fill="rgba(255,255,255,0.9)" />
            </svg>
          </div>
          <div className="profile-info">
            <span className="profile-name">Player</span>
            <span className="profile-level">
              <span className="level-badge">Level 9</span>
              <span className="level-xp-bar">
                <span className="level-xp-fill" style={{ width: '65%' }} />
              </span>
            </span>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-val">47</span>
              <span className="profile-stat-lbl">Wins</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-val">68%</span>
              <span className="profile-stat-lbl">Rate</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="home-content">
          {/* Hero banner with mini board */}
          <div className="home-hero">
            <div className="home-hero-board">
              <svg viewBox="0 0 60 60" width="48" height="48" className="home-mini-board">
                <rect x="0" y="0" width="60" height="60" rx="4" fill="#FFFDE7" stroke="#8B6914" strokeWidth="2" />
                <rect x="0" y="0" width="24" height="24" fill="#E53935" opacity="0.7" rx="2" />
                <rect x="36" y="0" width="24" height="24" fill="#43A047" opacity="0.7" rx="2" />
                <rect x="0" y="36" width="24" height="24" fill="#1E88E5" opacity="0.7" rx="2" />
                <rect x="36" y="36" width="24" height="24" fill="#FDD835" opacity="0.7" rx="2" />
                <rect x="24" y="24" width="12" height="12" fill="#FFD700" opacity="0.5" rx="1" />
              </svg>
            </div>
            <div className="home-hero-content">
              <span className="home-hero-text">Choose Your Battle</span>
              <div className="home-hero-pawns">
                {['#E53935', '#43A047', '#FDD835', '#1E88E5'].map((color, i) => (
                  <svg key={i} viewBox="0 0 24 34" width="18" height="24" className="home-hero-pawn" style={{ animationDelay: `${i * 0.15}s` }}>
                    <rect x="4" y="28" width="16" height="4" rx="2" fill={color} />
                    <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill={color} />
                    <circle cx="12" cy="9" r="6" fill={color} />
                    <circle cx="10.5" cy="7" r="1.8" fill="rgba(255,255,255,0.35)" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Main Mode Cards */}
          <div className="mode-cards-row">
            <button
              type="button"
              className="mode-card mode-card-2p"
              onClick={() => setModal('2-player')}
            >
              <div className="mode-card-glow" />
              <div className="mode-card-icon-row">
                <svg viewBox="0 0 24 34" width="16" height="22">
                  <rect x="4" y="28" width="16" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
                  <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill="rgba(255,255,255,0.6)" />
                  <circle cx="12" cy="9" r="6" fill="rgba(255,255,255,0.6)" />
                </svg>
                <span className="mode-card-vs">VS</span>
                <svg viewBox="0 0 24 34" width="16" height="22">
                  <rect x="4" y="28" width="16" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
                  <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill="rgba(255,255,255,0.6)" />
                  <circle cx="12" cy="9" r="6" fill="rgba(255,255,255,0.6)" />
                </svg>
              </div>
              <span className="mode-card-number">2</span>
              <span className="mode-card-label">Player</span>
              <span className="mode-card-desc">1 vs 1</span>
            </button>
            <button
              type="button"
              className="mode-card mode-card-4p"
              onClick={() => setModal('4-player')}
            >
              <div className="mode-card-glow" />
              <div className="mode-card-icon-row">
                {[0.5, 0.65, 0.5, 0.65].map((op, i) => (
                  <svg key={i} viewBox="0 0 24 34" width="12" height="16">
                    <rect x="4" y="28" width="16" height="4" rx="2" fill={`rgba(255,255,255,${op})`} />
                    <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill={`rgba(255,255,255,${op})`} />
                    <circle cx="12" cy="9" r="6" fill={`rgba(255,255,255,${op})`} />
                  </svg>
                ))}
              </div>
              <span className="mode-card-number">4</span>
              <span className="mode-card-label">Player</span>
              <span className="mode-card-desc">Free for All</span>
            </button>
          </div>

          {/* Secondary Cards */}
          <div className="secondary-cards-row">
            <button
              type="button"
              className="secondary-card secondary-card-online"
              onClick={onPlayOnline}
            >
              <span className="secondary-card-icon">🌐</span>
              <span className="secondary-card-label">Play Online</span>
              <span className="secondary-card-sub">Real Players</span>
            </button>
            <button
              type="button"
              className="secondary-card secondary-card-private"
              onClick={onPlayOnline}
            >
              <span className="secondary-card-icon">🔒</span>
              <span className="secondary-card-label">Private Table</span>
              <span className="secondary-card-sub">With Friends</span>
            </button>
            <button
              type="button"
              className="secondary-card secondary-card-streak"
              onClick={() => setModal('2-player')}
            >
              <span className="secondary-card-icon">🏆</span>
              <span className="secondary-card-label">Streak Stars</span>
              <span className="secondary-card-sub">Win Streak</span>
            </button>
          </div>

          {/* Daily Reward Banner */}
          <div className="daily-reward-banner">
            <div className="daily-reward-icon">🎁</div>
            <div className="daily-reward-info">
              <span className="daily-reward-title">Daily Reward Ready!</span>
              <span className="daily-reward-sub">Claim your free coins & gems</span>
            </div>
            <div className="daily-reward-btn">Claim</div>
          </div>

          {/* Quick Stats */}
          <div className="home-quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-icon">🔥</span>
              <span className="quick-stat-val">5</span>
              <span className="quick-stat-lbl">Streak</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-icon">⚡</span>
              <span className="quick-stat-val">12</span>
              <span className="quick-stat-lbl">Today</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-icon">👑</span>
              <span className="quick-stat-val">#42</span>
              <span className="quick-stat-lbl">Rank</span>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          <button type="button" className="nav-item">
            <span className="nav-item-icon">🛒</span>
            <span>Shop</span>
          </button>
          <button type="button" className="nav-item">
            <span className="nav-item-icon">👥</span>
            <span>Friends</span>
          </button>
          <button type="button" className="nav-item nav-item-home active">
            <span className="nav-item-icon">🏠</span>
            <span>Home</span>
          </button>
          <button type="button" className="nav-item">
            <span className="nav-item-icon">🎯</span>
            <span>Clubs</span>
          </button>
          <button type="button" className="nav-item">
            <span className="nav-item-icon">🎁</span>
            <span>Chest</span>
          </button>
        </nav>
      </div>

      {/* Game Mode Modal */}
      {modal && (
        <GameModeModal
          mode={modal}
          onClose={() => setModal(null)}
          onStart={(gameMode) => {
            const players = modal === '2-player' ? 2 : 4
            setModal(null)
            onPlayLocal(players, gameMode)
          }}
        />
      )}
    </>
  )
}
