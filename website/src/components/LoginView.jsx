import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'

export default function LoginView({ onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorCode, setErrorCode] = useState(null)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setErrorCode(null)

    try {
      const result = await onLogin({ email, password })

      if (!result.success) {
        setErrorMessage(result.error)
        setErrorCode(result.code || null)

        if (result.code === 'USER_NOT_FOUND' && onRegister) {
          setRegisterEmail(email)
        }
        return
      }

      setPassword('')
      setErrorMessage('')
      setErrorCode(null)
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
        <h1>Smart Village Admin</h1>
        <p>Bitte melde dich an, um die Gemeindekonfiguration zu bearbeiten.</p>

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
            <div className="auth-error">
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
            </div>
          ) : null}

          <button type="submit" disabled={isLoading}>
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
          {AUTH_HINT}
        </p>
      </section>
    </main>
  )
}
