import { useState } from 'react'
import {
  AVATARS, getOwnedItems, getSelectedAvatar, setSelectedAvatar, getAvatarEmoji,
  getSoundEnabled, setSoundEnabled, getVibrationEnabled, setVibrationEnabled,
  getRankTitle, getRankIcon, formatNum,
} from '../utils/shop'
import type { Profile } from '../types/database'

interface ProfileModalProps {
  profile: Profile | null
  onClose: () => void
  onUpdateProfile?: (updates: Partial<Profile>) => void
  onSignOut: () => void
  onSignIn: () => void
  isMusicPlaying: boolean
  onMusicToggle: () => void
}

export function ProfileModal({ profile, onClose, onUpdateProfile, onSignOut, onSignIn, isMusicPlaying, onMusicToggle }: ProfileModalProps) {
  const p = profile
  const [username, setUsername] = useState(p?.username || localStorage.getItem('guest_username') || '')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [selectedAv, setSelectedAv] = useState(getSelectedAvatar())
  const [soundOn, setSoundOnState] = useState(getSoundEnabled())
  const [vibrationOn, setVibrationOnState] = useState(getVibrationEnabled())

  const owned = getOwnedItems()
  const ownedAvatars = AVATARS.filter(a => owned.includes(a.id) || a.price === 0)

  const level = p?.level ?? 1
  const rank = getRankTitle(level)
  const rankIcon = getRankIcon(level)
  const wins = p?.wins ?? 0
  const losses = p?.losses ?? 0
  const games = p?.games_played ?? 0
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0
  const coins = p?.coins ?? 0
  const gems = p?.gems ?? 0

  function handleSave() {
    const trimmed = username.trim()
    if (trimmed.length >= 3) {
      if (p && onUpdateProfile) {
        onUpdateProfile({ username: trimmed, avatar_url: selectedAv })
      }
      localStorage.setItem('guest_username', trimmed)
    }
    setSelectedAvatar(selectedAv)
    onClose()
  }

  function handleAvatarSelect(id: string) {
    setSelectedAv(id)
    setShowAvatarPicker(false)
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="pm-header">
          <button type="button" className="pm-avatar-btn" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            <span className="pm-avatar-emoji">{getAvatarEmoji(selectedAv)}</span>
            <span className="pm-avatar-change">Change</span>
          </button>
          <div className="pm-header-info">
            <span className="pm-username">{p?.username || localStorage.getItem('guest_username') || 'Guest'}</span>
            <span className="pm-rank">{rankIcon} {rank} - Level {level}</span>
          </div>
        </div>

        {/* Avatar Picker */}
        {showAvatarPicker && (
          <div className="pm-avatar-picker">
            {ownedAvatars.map(a => (
              <button
                key={a.id}
                type="button"
                className={`pm-avatar-option ${selectedAv === a.id ? 'active' : ''}`}
                onClick={() => handleAvatarSelect(a.id)}
              >
                {a.emoji}
              </button>
            ))}
            {ownedAvatars.length < AVATARS.length && (
              <span className="pm-avatar-hint">Buy more in Shop!</span>
            )}
          </div>
        )}

        {/* Username */}
        <div className="pm-field">
          <label className="pm-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
            className="pm-input"
            placeholder="Enter username"
          />
        </div>

        {/* Currencies */}
        {p && (
          <div className="pm-currencies">
            <div className="pm-currency">
              <span>🪙</span>
              <span>{formatNum(coins)} Coins</span>
            </div>
            <div className="pm-currency">
              <span>💎</span>
              <span>{formatNum(gems)} Gems</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="pm-stats">
          <div className="pm-stat">
            <span className="pm-stat-val">{wins}</span>
            <span className="pm-stat-lbl">Wins</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-val">{losses}</span>
            <span className="pm-stat-lbl">Losses</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-val">{winRate}%</span>
            <span className="pm-stat-lbl">Rate</span>
          </div>
          <div className="pm-stat">
            <span className="pm-stat-val">{p?.best_streak ?? 0}</span>
            <span className="pm-stat-lbl">Best</span>
          </div>
        </div>

        {/* Settings */}
        <div className="pm-settings">
          <h4 className="pm-settings-title">Settings</h4>
          <div className="pm-setting">
            <span>🎵 Music</span>
            <button type="button" className={`pm-toggle ${isMusicPlaying ? 'on' : ''}`} onClick={onMusicToggle}>
              {isMusicPlaying ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="pm-setting">
            <span>🔊 Sound Effects</span>
            <button type="button" className={`pm-toggle ${soundOn ? 'on' : ''}`} onClick={() => { setSoundEnabled(!soundOn); setSoundOnState(!soundOn) }}>
              {soundOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="pm-setting">
            <span>📳 Vibration</span>
            <button type="button" className={`pm-toggle ${vibrationOn ? 'on' : ''}`} onClick={() => { setVibrationEnabled(!vibrationOn); setVibrationOnState(!vibrationOn) }}>
              {vibrationOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pm-actions">
          <button type="button" className="pm-btn save" onClick={handleSave}>Save Changes</button>
          {p ? (
            <button type="button" className="pm-btn danger" onClick={() => { onSignOut(); onClose() }}>Sign Out</button>
          ) : (
            <button type="button" className="pm-btn primary" onClick={() => { onSignIn(); onClose() }}>Sign In</button>
          )}
        </div>
      </div>
    </div>
  )
}
