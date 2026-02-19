import { useState } from 'react'
import { getStreakInfo, claimStreak, ACHIEVEMENTS } from '../utils/shop'
import type { Profile } from '../types/database'

interface RewardsTabProps {
  profile: Profile | null
  onRewardClaimed: (coins: number, gems: number) => void
  onBack: () => void
}

export function RewardsTab({ profile, onRewardClaimed, onBack }: RewardsTabProps) {
  const [streakInfo, setStreakInfo] = useState(getStreakInfo)
  const p = profile
  const stats = {
    wins: p?.wins ?? 0,
    games_played: p?.games_played ?? 0,
    best_streak: p?.best_streak ?? 0,
    level: p?.level ?? 1,
    coins: p?.coins ?? 0,
  }

  function handleClaim() {
    const reward = claimStreak()
    if (reward.coins > 0 || reward.gems > 0) {
      onRewardClaimed(reward.coins, reward.gems)
      setStreakInfo(getStreakInfo())
    }
  }

  const unlockedCount = ACHIEVEMENTS.filter(a => a.check(stats)).length

  return (
    <div className="tab-content rewards-tab">
      <div className="tab-header">
        <button type="button" className="tab-back-btn" onClick={onBack}>&larr;</button>
        <h2 className="tab-title">Rewards</h2>
      </div>
      {/* Login Streak */}
      <h3 className="tab-section-title">Daily Login Streak</h3>
      <div className="streak-card">
        <div className="streak-days">
          {streakInfo.rewards.map((r, i) => {
            const day = i + 1
            const claimedDay = streakInfo.canClaim ? streakInfo.currentDay - 1 : streakInfo.currentDay
            const isPast = day <= claimedDay && !streakInfo.canClaim ? day <= streakInfo.currentDay : day < streakInfo.currentDay
            const isCurrent = day === streakInfo.currentDay && streakInfo.canClaim
            return (
              <div
                key={day}
                className={`streak-day ${isPast && !isCurrent ? 'past' : ''} ${isCurrent ? 'current' : ''} ${!isPast && !isCurrent ? 'future' : ''}`}
              >
                <span className="streak-day-num">D{day}</span>
                <span className="streak-day-coins">🪙{r.coins}</span>
                {r.gems > 0 && <span className="streak-day-gems">💎{r.gems}</span>}
                {isPast && !isCurrent && <span className="streak-day-check">✓</span>}
              </div>
            )
          })}
        </div>
        {streakInfo.canClaim ? (
          <button type="button" className="streak-claim-btn" onClick={handleClaim}>
            Claim Day {streakInfo.currentDay} Reward
          </button>
        ) : (
          <p className="streak-claimed-text">Today's reward claimed! Come back tomorrow.</p>
        )}
      </div>

      {/* Achievements */}
      <h3 className="tab-section-title">Achievements ({unlockedCount}/{ACHIEVEMENTS.length})</h3>
      <div className="achievements-grid">
        {ACHIEVEMENTS.map(ach => {
          const unlocked = ach.check(stats)
          const prog = ach.progress(stats)
          return (
            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">{ach.icon}</span>
              <div className="achievement-info">
                <span className="achievement-name">{ach.name}</span>
                <span className="achievement-desc">{ach.desc}</span>
                {!unlocked && (
                  <div className="achievement-bar">
                    <div className="achievement-fill" style={{ width: `${prog * 100}%` }} />
                  </div>
                )}
              </div>
              {unlocked && <span className="achievement-check">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
