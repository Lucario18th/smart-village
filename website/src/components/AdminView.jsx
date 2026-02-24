import React from 'react'

export default function AdminView({ username, onLogout }) {
  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Smart Village Admin</h1>
          <p>Angemeldet als: {username}</p>
        </div>
        <button type="button" onClick={onLogout}>
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
