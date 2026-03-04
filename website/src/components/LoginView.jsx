import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await onLogin({ email, password })

      if (!result.success) {
        setErrorMessage(result.error)
        return
      }

      setPassword('')
      setErrorMessage('')
    } finally {
      setIsLoading(false)
    }
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

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <p className="auth-hint">{AUTH_HINT}</p>
      </section>
    </main>
  )
}