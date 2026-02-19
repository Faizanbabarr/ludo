import { getRankTitle, getRankIcon, ACHIEVEMENTS } from '../utils/shop'
import type { Profile } from '../types/database'

interface LeaderboardTabProps {
  profile: Profile | null
  onBack: () => void
}

export function LeaderboardTab({ profile, onBack }: LeaderboardTabProps) {
  const p = profile
  const level = p?.level ?? 1
  const wins = p?.wins ?? 0
  const losses = p?.losses ?? 0
  const games = p?.games_played ?? 0
  const streak = p?.win_streak ?? 0
  const bestStreak = p?.best_streak ?? 0
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0
  const rank = getRankTitle(level)
  const rankIcon = getRankIcon(level)
  const xpInLevel = p ? p.xp % 100 : 0

  const unlockedAchievements = ACHIEVEMENTS.filter(a =>
    a.check({ wins, games_played: games, best_streak: bestStreak, level, coins: p?.coins ?? 0 })
  ).length

  const milestones = [
    { label: 'Bronze Player', target: 10, current: wins, unit: 'wins' },
    { label: 'Silver Player', target: 50, current: wins, unit: 'wins' },
    { label: 'Gold Player', target: 100, current: wins, unit: 'wins' },
    { label: 'Level 10', target: 10, current: level, unit: 'levels' },
    { label: 'Level 25', target: 25, current: level, unit: 'levels' },
  ].filter(m => m.current < m.target)

  return (
    <div className="tab-content leaderboard-tab">
      <div className="tab-header">
        <button type="button" className="tab-back-btn" onClick={onBack}>&larr;</button>
        <h2 className="tab-title">Ranks</h2>
      </div>
      {/* Rank Card */}
      <div className="rank-card">
        <div className="rank-badge">
          <span className="rank-badge-icon">{rankIcon}</span>
        </div>
        <div className="rank-details">
          <span className="rank-name">{rank}</span>
          <span className="rank-level-text">Level {level}</span>
        </div>
        <div className="rank-xp">
          <div className="rank-xp-bar">
            <div className="rank-xp-fill" style={{ width: `${xpInLevel}%` }} />
          </div>
          <span className="rank-xp-label">{xpInLevel}/100 XP</span>
        </div>
      </div>

      {/* Stats Grid */}
      <h3 className="tab-section-title">Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-icon">🏆</span>
          <span className="stat-card-val">{wins}</span>
          <span className="stat-card-lbl">Wins</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">💔</span>
          <span className="stat-card-val">{losses}</span>
          <span className="stat-card-lbl">Losses</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">🎮</span>
          <span className="stat-card-val">{games}</span>
          <span className="stat-card-lbl">Played</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">📊</span>
          <span className="stat-card-val">{winRate}%</span>
          <span className="stat-card-lbl">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">🔥</span>
          <span className="stat-card-val">{streak}</span>
          <span className="stat-card-lbl">Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-icon">💪</span>
          <span className="stat-card-val">{bestStreak}</span>
          <span className="stat-card-lbl">Best</span>
        </div>
      </div>

      {/* Achievements summary */}
      <div className="achievements-summary">
        <span className="achievements-summary-icon">🎖️</span>
        <span>{unlockedAchievements}/{ACHIEVEMENTS.length} Achievements Unlocked</span>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <>
          <h3 className="tab-section-title">Next Milestones</h3>
          <div className="milestones-list">
            {milestones.slice(0, 3).map(m => (
              <div key={m.label} className="milestone-item">
                <div className="milestone-info">
                  <span className="milestone-name">{m.label}</span>
                  <span className="milestone-progress-text">{m.current} / {m.target} {m.unit}</span>
                </div>
                <div className="milestone-bar">
                  <div className="milestone-fill" style={{ width: `${Math.min((m.current / m.target) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
