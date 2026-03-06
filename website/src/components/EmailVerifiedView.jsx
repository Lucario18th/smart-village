import React from 'react'

export default function EmailVerifiedView({ onGoToLogin }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>E-Mail bestätigt</h1>
        <p>
          Deine E-Mail wurde erfolgreich verifiziert. Du kannst dich jetzt anmelden und
          fortfahren.
        </p>

        <button type="button" onClick={onGoToLogin}>
          Zur Anmeldung
        </button>
      </section>
    </main>
  )
}
