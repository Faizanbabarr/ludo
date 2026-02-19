import { useState, useCallback, useRef } from 'react'
import { GameModeModal } from '../components/GameModeModal'
import { DiceSelector } from '../components/DiceSelector'
import { ProfileModal } from '../components/ProfileModal'
import { ShopTab } from '../components/ShopTab'
import { LeaderboardTab } from '../components/LeaderboardTab'
import { RewardsTab } from '../components/RewardsTab'
import { FriendsTab } from '../components/FriendsTab'
import { Dice } from '../components/Dice'
import { getAvatarEmoji, formatNum, getGuestCoins, getGuestGems, getStreakInfo } from '../utils/shop'
import type { DiceStyle } from '../components/Dice'
import type { GameMode } from '../types/game'
import type { Profile } from '../types/database'

type Tab = 'home' | 'shop' | 'friends' | 'leaderboard' | 'rewards'

interface HomeScreenProps {
  onPlayLocal: (players: 2 | 4 | 6, gameMode: GameMode, entryFee: number) => void
  onPlayAI: (players: 2 | 4 | 6, gameMode: GameMode, entryFee: number) => void
  onPlayOnline: () => void
  diceStyle: DiceStyle
  onDiceStyleChange: (style: DiceStyle) => void
  profile: Profile | null
  isSignedIn: boolean
  onSignOut: () => void
  onSignIn: () => void
  onUpdateProfile?: (updates: Partial<Profile>) => void
  isMusicPlaying: boolean
  onMusicToggle: () => void
}

export function HomeScreen({
  onPlayLocal, onPlayAI, onPlayOnline, diceStyle, onDiceStyleChange,
  profile, isSignedIn, onSignOut, onSignIn, onUpdateProfile,
  isMusicPlaying, onMusicToggle,
}: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [modal, setModal] = useState<'2-player' | '4-player' | '6-player' | null>(null)
  const [aiModal, setAiModal] = useState<'2-player' | '4-player' | '6-player' | null>(null)
  const [showDicePicker, setShowDicePicker] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [coinError, setCoinError] = useState('')
  const [guestCoins, setGuestCoins] = useState(getGuestCoins)
  const [guestGems, setGuestGems] = useState(getGuestGems)

  const p = profile
  const coins = p ? p.coins : guestCoins
  const gems = p ? p.gems : guestGems
  const xpPerLevel = 100
  const currentXpInLevel = p ? p.xp % xpPerLevel : 0
  const xpProgress = p ? (currentXpInLevel / xpPerLevel) * 100 : 0
  const avatarEmoji = getAvatarEmoji(p?.avatar_url)
  const streakInfo = getStreakInfo()

  const tiltRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, key: string) => {
    const el = tiltRefs.current.get(key)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) / rect.width - 0.5
    const y = (clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`
  }, [])

  const handleTiltLeave = useCallback((key: string) => {
    const el = tiltRefs.current.get(key)
    if (el) el.style.transform = ''
  }, [])

  const setTiltRef = useCallback((key: string) => (node: HTMLButtonElement | null) => {
    if (node) tiltRefs.current.set(key, node)
    else tiltRefs.current.delete(key)
  }, [])

  function handleSpendCoins(amount: number) {
    if (p && onUpdateProfile) {
      onUpdateProfile({ coins: p.coins - amount })
    } else {
      const newCoins = getGuestCoins() - amount
      localStorage.setItem('guest_coins', String(newCoins))
      setGuestCoins(newCoins)
    }
  }

  function handleRewardClaimed(coinReward: number, gemReward: number) {
    if (p && onUpdateProfile) {
      onUpdateProfile({ coins: p.coins + coinReward, gems: p.gems + gemReward })
    } else {
      const nc = getGuestCoins() + coinReward
      const ng = getGuestGems() + gemReward
      localStorage.setItem('guest_coins', String(nc))
      localStorage.setItem('guest_gems', String(ng))
      setGuestCoins(nc)
      setGuestGems(ng)
    }
  }

  function handleStartGame(isAI: boolean, modalKey: '2-player' | '4-player' | '6-player', gameMode: GameMode, entryFee: number) {
    if (coins < entryFee) {
      setCoinError(`Not enough coins! Need ${formatNum(entryFee)}`)
      setTimeout(() => setCoinError(''), 3000)
      return
    }
    if (entryFee > 0) handleSpendCoins(entryFee)
    const players = modalKey === '2-player' ? 2 : modalKey === '4-player' ? 4 : 6
    if (isAI) {
      setAiModal(null)
      onPlayAI(players as 2 | 4 | 6, gameMode, entryFee)
    } else {
      setModal(null)
      onPlayLocal(players as 2 | 4 | 6, gameMode, entryFee)
    }
  }

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

        {/* V1 Beta Badge */}
        <div className="beta-badge">v1.0 BETA</div>

        {/* Profile Header */}
        <div className="profile-header">
          <button type="button" className="ph-avatar-btn" onClick={() => setShowProfile(true)}>
            <span className="ph-avatar-emoji">{avatarEmoji}</span>
            <span className="ph-avatar-ring" />
          </button>
          <div className="ph-info">
            <span className="ph-name">{p ? p.username : (localStorage.getItem('guest_username') || 'Guest')}</span>
            <div className="ph-level-row">
              <span className="ph-level-badge">Lv.{p ? p.level : 1}</span>
              <div className="ph-xp-bar">
                <div className="ph-xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
          <div className="ph-currencies">
            <div className="ph-currency" onClick={() => setActiveTab('shop')}>
              <span>🪙</span>
              <span>{formatNum(coins)}</span>
            </div>
            <div className="ph-currency" onClick={() => setActiveTab('shop')}>
              <span>💎</span>
              <span>{formatNum(gems)}</span>
            </div>
          </div>
        </div>

        {/* Coin Error Toast */}
        {coinError && (
          <div className="coin-error-toast">{coinError}</div>
        )}

        {/* Tab Content */}
        {activeTab === 'home' && (
          <div className="home-content">
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

            {/* Mode Cards */}
            <div className="mode-cards-row">
              {([['2p', '2-player', 2, '1 vs 1'] as const, ['4p', '4-player', 4, 'Free for All'] as const, ['6p', '6-player', 6, 'Hex Battle'] as const]).map(([key, modalKey, num, desc]) => (
                <button
                  key={key}
                  type="button"
                  className={`mode-card mode-card-${key}`}
                  ref={setTiltRef(key)}
                  onClick={() => setModal(modalKey as '2-player' | '4-player' | '6-player')}
                  onMouseMove={e => handleTiltMove(e, key)}
                  onMouseLeave={() => handleTiltLeave(key)}
                  onTouchMove={e => handleTiltMove(e, key)}
                  onTouchEnd={() => handleTiltLeave(key)}
                >
                  <div className="mode-card-glow" />
                  <div className="mode-card-icon-row">
                    {Array.from({ length: num === 2 ? 2 : num }, (_, i) => (
                      <svg key={i} viewBox="0 0 24 34" width={num === 6 ? 10 : num === 4 ? 12 : 16} height={num === 6 ? 14 : num === 4 ? 16 : 22}>
                        <rect x="4" y="28" width="16" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
                        <path d="M6,28 Q8,18 9,14 L15,14 Q16,18 18,28 Z" fill="rgba(255,255,255,0.6)" />
                        <circle cx="12" cy="9" r="6" fill="rgba(255,255,255,0.6)" />
                      </svg>
                    ))}
                    {num === 2 && <span className="mode-card-vs">VS</span>}
                  </div>
                  <span className="mode-card-number">{num}</span>
                  <span className="mode-card-label">Player</span>
                  <span className="mode-card-desc">{desc}</span>
                </button>
              ))}
            </div>

            {/* Secondary Cards */}
            <div className="secondary-cards-row">
              <button type="button" className="secondary-card secondary-card-ai" onClick={() => setAiModal('2-player')}>
                <span className="secondary-card-icon">&#129302;</span>
                <span className="secondary-card-label">Play vs AI</span>
                <span className="secondary-card-sub">Practice</span>
              </button>
              <button type="button" className="secondary-card secondary-card-online" onClick={onPlayOnline}>
                <span className="secondary-card-icon">&#127760;</span>
                <span className="secondary-card-label">Play Online</span>
                <span className="secondary-card-sub">Real Players</span>
              </button>
              <button type="button" className="secondary-card secondary-card-streak" onClick={() => setActiveTab('rewards')}>
                <span className="secondary-card-icon">&#127942;</span>
                <span className="secondary-card-label">Rewards</span>
                <span className="secondary-card-sub">Earn Prizes</span>
              </button>
            </div>

            {/* Daily Reward Banner */}
            {streakInfo.canClaim && (
              <div className="daily-reward-banner" onClick={() => setActiveTab('rewards')} style={{ cursor: 'pointer' }}>
                <div className="daily-reward-icon">&#127873;</div>
                <div className="daily-reward-info">
                  <span className="daily-reward-title">Daily Reward Ready!</span>
                  <span className="daily-reward-sub">Day {streakInfo.currentDay} - Tap to claim</span>
                </div>
                <div className="daily-reward-btn">Claim</div>
              </div>
            )}

            {/* Dice Selector */}
            <button type="button" className="dice-select-banner" onClick={() => setShowDicePicker(true)}>
              <div className="dice-select-preview">
                <Dice value={5} size={40} style={diceStyle} instanceId="home-preview" />
              </div>
              <div className="dice-select-info">
                <span className="dice-select-title">My Dice: {diceStyle.name}</span>
                <span className="dice-select-sub">Tap to change dice style</span>
              </div>
              <span className="dice-select-arrow">&#8250;</span>
            </button>

            {/* Quick Stats */}
            <div className="home-quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-icon">&#128293;</span>
                <span className="quick-stat-val">{p ? p.win_streak : 0}</span>
                <span className="quick-stat-lbl">Streak</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">&#9889;</span>
                <span className="quick-stat-val">{p ? p.games_played : 0}</span>
                <span className="quick-stat-lbl">Played</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">&#128081;</span>
                <span className="quick-stat-val">{p ? p.best_streak : 0}</span>
                <span className="quick-stat-lbl">Best</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <ShopTab
            coins={coins}
            onSpendCoins={handleSpendCoins}
            diceStyle={diceStyle}
            onDiceStyleChange={onDiceStyleChange}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsTab
            onPlayOnline={onPlayOnline}
            isSignedIn={isSignedIn}
            onSignIn={onSignIn}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab profile={p} onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'rewards' && (
          <RewardsTab profile={p} onRewardClaimed={handleRewardClaimed} onBack={() => setActiveTab('home')} />
        )}

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          <button type="button" className={`nav-item ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
            <span className="nav-item-icon">&#128722;</span>
            <span>Shop</span>
          </button>
          <button type="button" className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
            <span className="nav-item-icon">&#128101;</span>
            <span>Friends</span>
          </button>
          <button type="button" className={`nav-item nav-item-home ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <span className="nav-item-icon">&#127968;</span>
            <span>Home</span>
          </button>
          <button type="button" className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            <span className="nav-item-icon">&#127942;</span>
            <span>Ranks</span>
          </button>
          <button type="button" className={`nav-item ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
            <span className="nav-item-icon">&#127873;</span>
            <span>Rewards</span>
          </button>
        </nav>
      </div>

      {/* Local Game Mode Modal */}
      {modal && (
        <GameModeModal
          mode={modal}
          onClose={() => setModal(null)}
          onStart={(gameMode, entryFee) => handleStartGame(false, modal, gameMode, entryFee)}
          coins={coins}
        />
      )}

      {/* AI Mode Modal */}
      {aiModal && (
        <GameModeModal
          mode={aiModal}
          onClose={() => setAiModal(null)}
          onStart={(gameMode, entryFee) => handleStartGame(true, aiModal, gameMode, entryFee)}
          title="Play vs AI"
          coins={coins}
        />
      )}

      {showDicePicker && (
        <DiceSelector
          selected={diceStyle}
          onSelect={onDiceStyleChange}
          onClose={() => setShowDicePicker(false)}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          profile={p}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={onUpdateProfile}
          onSignOut={onSignOut}
          onSignIn={onSignIn}
          isMusicPlaying={isMusicPlaying}
          onMusicToggle={onMusicToggle}
        />
      )}
    </>
  )
}
