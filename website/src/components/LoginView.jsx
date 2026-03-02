import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'

export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const result = onLogin({ username, password })

    if (!result.success) {
      setErrorMessage(result.error)
      return
    }

    setPassword('')
    setErrorMessage('')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Smart Village Admin</h1>
        <p>Bitte melde dich an, um die Gemeindekonfiguration zu bearbeiten.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Benutzername</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit">Anmelden</button>
        </form>

        <p className="auth-hint">{AUTH_HINT}</p>
      </section>
    </main>
  )
}