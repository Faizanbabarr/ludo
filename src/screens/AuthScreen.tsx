import { useState } from 'react'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  onSignUp: (email: string, password: string, username: string) => Promise<{ error: { message: string } | null }>
  onSkip: () => void
}

export function AuthScreen({ onSignIn, onSignUp, onSkip }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      if (!username.trim()) {
        setError('Username is required')
        setLoading(false)
        return
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters')
        setLoading(false)
        return
      }
      const { error } = await onSignUp(email, password, username.trim())
      if (error) setError(error.message)
      else setSignupSuccess(true)
    } else {
      const { error } = await onSignIn(email, password)
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-bg-particles">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="home-bg-particle"
            style={{
              '--x': `${15 + Math.random() * 70}%`,
              '--delay': `${i * 0.8}s`,
              '--dur': `${5 + Math.random() * 3}s`,
              '--size': `${3 + Math.random() * 3}px`,
              background: ['#E53935', '#43A047', '#FDD835', '#1E88E5', '#FFD700', '#FF8C00'][i],
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="auth-header">
        <div className="auth-logo">
          <svg viewBox="0 0 60 60" width="56" height="56">
            <rect x="0" y="0" width="60" height="60" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <rect x="2" y="2" width="24" height="24" rx="4" fill="#E53935" opacity="0.8" />
            <rect x="34" y="2" width="24" height="24" rx="4" fill="#43A047" opacity="0.8" />
            <rect x="2" y="34" width="24" height="24" rx="4" fill="#1E88E5" opacity="0.8" />
            <rect x="34" y="34" width="24" height="24" rx="4" fill="#FDD835" opacity="0.8" />
            <circle cx="30" cy="30" r="8" fill="white" opacity="0.3" />
          </svg>
        </div>
        <h1 className="auth-title">LUDO</h1>
        <p className="auth-subtitle">Roll Home</p>
      </div>

      {signupSuccess ? (
        <div className="auth-card">
          <div className="auth-success">
            <span className="auth-success-icon">&#10003;</span>
            <h3>Account Created!</h3>
            <p>Check your email to confirm your account, then sign in.</p>
            <button
              type="button"
              className="auth-btn auth-btn-primary"
              onClick={() => { setSignupSuccess(false); setMode('login') }}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={20}
                  autoComplete="username"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="auth-btn auth-btn-guest"
            onClick={onSkip}
          >
            Play as Guest
          </button>
        </div>
      )}
    </div>
  )
}
