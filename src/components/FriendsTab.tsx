import { useState } from 'react'

interface FriendsTabProps {
  onPlayOnline: () => void
  isSignedIn: boolean
  onSignIn: () => void
  onBack: () => void
}

export function FriendsTab({ onPlayOnline, isSignedIn, onSignIn, onBack }: FriendsTabProps) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const text = 'Play Ludo with me! Download the app and join my game. 🎲'
    if (navigator.share) {
      navigator.share({ title: 'Ludo - Roll Home', text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="tab-content friends-tab">
      <div className="tab-header">
        <button type="button" className="tab-back-btn" onClick={onBack}>&larr;</button>
        <h2 className="tab-title">Friends</h2>
      </div>
      <div className="friends-hero">
        <span className="friends-hero-icon">👥</span>
        <h3 className="friends-hero-title">Play with Friends</h3>
        <p className="friends-hero-sub">Challenge your friends to a game of Ludo!</p>
      </div>

      <div className="friends-actions">
        <button type="button" className="friends-action-btn primary" onClick={onPlayOnline}>
          <span className="friends-btn-icon">🌍</span>
          <div className="friends-btn-text">
            <span className="friends-btn-title">Create Online Room</span>
            <span className="friends-btn-sub">Start a new game room</span>
          </div>
        </button>

        <button type="button" className="friends-action-btn" onClick={handleShare}>
          <span className="friends-btn-icon">📤</span>
          <div className="friends-btn-text">
            <span className="friends-btn-title">{copied ? 'Copied!' : 'Share Invite'}</span>
            <span className="friends-btn-sub">Invite friends to play</span>
          </div>
        </button>

        <button type="button" className="friends-action-btn" onClick={onPlayOnline}>
          <span className="friends-btn-icon">🔗</span>
          <div className="friends-btn-text">
            <span className="friends-btn-title">Join Room</span>
            <span className="friends-btn-sub">Enter a room code to join</span>
          </div>
        </button>

        {!isSignedIn && (
          <button type="button" className="friends-action-btn accent" onClick={onSignIn}>
            <span className="friends-btn-icon">🔑</span>
            <div className="friends-btn-text">
              <span className="friends-btn-title">Sign In</span>
              <span className="friends-btn-sub">Required for online play</span>
            </div>
          </button>
        )}
      </div>

      <div className="friends-tip">
        <span className="friends-tip-icon">💡</span>
        <p>Create a room and share the 6-letter code with friends. They can join using the room code!</p>
      </div>
    </div>
  )
}
