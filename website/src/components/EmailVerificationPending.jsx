import React from 'react'

const COUNTDOWN_SECONDS = 5 * 60

export default function EmailVerificationPending({ email, onBackToLogin }) {
  const [timeLeft, setTimeLeft] = React.useState(COUNTDOWN_SECONDS)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Bitte bestätige deine E-Mail</h1>
        <p>
          Wir haben einen Bestätigungslink an <strong>{email}</strong> geschickt. Der
          Link ist 5 Minuten gültig.
        </p>

        <div className="countdown">
          <span className="countdown-label">Verbleibende Zeit</span>
          <span className="countdown-value">
            {minutes}:{seconds}
          </span>
        </div>

        <p>Öffne dein Postfach oder den Spam-Ordner und klicke auf den Link.</p>

        <button type="button" onClick={onBackToLogin}>
          Zur Anmeldung
        </button>
      </section>
    </main>
  )
}
