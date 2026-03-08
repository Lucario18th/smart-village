import React from 'react'

export default function EmailVerifiedView({ onGoToLogin }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-card-header">
          <span className="auth-kicker">Smart Village</span>
          <h1>E-Mail bestätigt</h1>
          <p className="auth-subtitle">
            Ihre E-Mail wurde erfolgreich verifiziert. Sie können sich jetzt anmelden und
            fortfahren.
          </p>
        </header>

        <button type="button" className="auth-submit-button" onClick={onGoToLogin}>
          Zur Anmeldung
        </button>
      </section>
    </main>
  )
}
