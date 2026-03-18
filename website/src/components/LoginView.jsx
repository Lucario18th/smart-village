import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AUTH_HINT } from '../auth/accounts'

export default function LoginView({ onLogin, onRegister, noticeMessage = null }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorCode, setErrorCode] = useState(null)
  const [retryAt, setRetryAt] = useState(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isLoading, setIsLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerEmail, setRegisterEmail] = useState('')
  // Safety: if the parent removes the registration flow after initial render,
  // ensure we return to the login view.
  React.useEffect(() => {
    if (!onRegister) {
      setShowRegister(false)
    }
  }, [onRegister])

  React.useEffect(() => {
    if (!retryAt) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [retryAt])

  const retryAtMs = retryAt ? Date.parse(retryAt) : Number.NaN
  const hasValidRetryAt = Number.isFinite(retryAtMs)
  const isTemporarilyBlocked = hasValidRetryAt && retryAtMs > nowMs

  const formatRemainingTime = (targetMs) => {
    const remainingMs = Math.max(0, targetMs - nowMs)
    const totalSeconds = Math.ceil(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isTemporarilyBlocked) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setErrorCode(null)
    setRetryAt(null)

    try {
      const result = await onLogin({ email, password })

      if (!result.success) {
        setErrorMessage(result.error)
        setErrorCode(result.code || null)
        setRetryAt(result.retryAt || null)

        if (result.code === 'USER_NOT_FOUND' && onRegister) {
          setRegisterEmail(email)
        }
        return
      }

      setPassword('')
      setErrorMessage('')
      setErrorCode(null)
      setRetryAt(null)
      setRegisterEmail('')
    } finally {
      setIsLoading(false)
    }
  }

  if (showRegister) {
    return onRegister({
      onBack: () => setShowRegister(false),
      initialEmail: registerEmail,
    })
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-card-header">
          <span className="auth-kicker">Smart Village</span>
          <h1>Admin Login</h1>
          <p className="auth-subtitle">Bitte melden Sie sich an, um die Gemeindekonfiguration zu bearbeiten.</p>
        </header>

        {noticeMessage ? <div className="auth-info">{noticeMessage}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={isLoading}
          />

          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          {errorMessage ? (
            <div className="auth-error" role="alert">
              <p>{errorMessage}</p>
              {errorCode === 'USER_NOT_FOUND' && onRegister ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setRegisterEmail(email)
                    setShowRegister(true)
                  }}
                  disabled={isLoading}
                >
                  Konto erstellen
                </button>
              ) : null}
              {(errorCode === 'ADMIN_ACCOUNT_LOCKED' || errorCode === 'ADMIN_SESSION_ACTIVE') &&
              isTemporarilyBlocked ? (
                <p>
                  Bitte in {formatRemainingTime(retryAtMs)} erneut versuchen.
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading || isTemporarilyBlocked}
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <p className="auth-hint">
          {onRegister ? (
            <>
              Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterEmail(email)
                    setShowRegister(true)
                  }}
                  className="link-button"
                >
                  Hier registrieren
                </button>
              <br />
              <br />
            </>
          ) : null}
          <Link className="link-button" to="/">
            Zur Startseite
          </Link>
          <br />
          <br />
          {AUTH_HINT}
        </p>
      </section>
    </main>
  )
}
