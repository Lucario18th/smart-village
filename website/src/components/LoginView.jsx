import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'
import { useNavigate } from 'react-router-dom'

export default function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Login fehlgeschlagen.')
        return
      }

      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken)
      }

      setPassword('')
      setErrorMessage('')

      // zurück auf die "alte" Seite (z.B. Admin-Dashboard)
      navigate('/admin') // Pfad anpassen auf deine frühere Seite[web:233][web:239]
    } catch (error) {
      setErrorMessage('Server nicht erreichbar.')
    }
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
            type="email"
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
