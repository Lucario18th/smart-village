import React, { useState } from 'react'

const SESSION_KEY = 'smart-village-admin-session'

const ACCOUNTS = {
  dorf1: 'dorf1',
  dorf2: 'dorf2',
}

function getStoredSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY)
    if (!rawSession) {
      return null
    }

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.username || !ACCOUNTS[parsedSession.username]) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return parsedSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export default function App() {
  const [session, setSession] = useState(() => getStoredSession())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = (event) => {
    event.preventDefault()

    const normalizedUsername = username.trim().toLowerCase()
    const expectedPassword = ACCOUNTS[normalizedUsername]

    if (!expectedPassword || password !== expectedPassword) {
      setErrorMessage('Ungültiger Benutzername oder Passwort.')
      return
    }

    const nextSession = { username: normalizedUsername }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setPassword('')
    setErrorMessage('')
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setUsername('')
    setPassword('')
    setErrorMessage('')
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Smart Village Admin</h1>
          <p>Bitte melde dich an, um die Gemeindekonfiguration zu bearbeiten.</p>

          <form className="auth-form" onSubmit={handleLogin}>
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

          <p className="auth-hint">Testzugänge: dorf1/dorf1 und dorf2/dorf2</p>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Smart Village Admin</h1>
          <p>Angemeldet als: {session.username}</p>
        </div>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="admin-cards">
        <article className="card">
          <h2>Allgemein</h2>
          <p>Ortsname, Kontaktinformationen und Basisdaten konfigurieren.</p>
        </article>
        <article className="card">
          <h2>Module</h2>
          <p>Dienste wie Mitfahrbank, Sensorik und Stromdaten aktivieren.</p>
        </article>
        <article className="card">
          <h2>Design</h2>
          <p>Theme und Darstellung für die Gemeinde festlegen.</p>
        </article>
      </section>

      <footer className="app-footer">MVP-Stand: Login, Session und Logout aktiv</footer>
    </main>
  )
}

