import React from 'react'

const COUNTDOWN_SECONDS = 5 * 60
const extractDigits = (value) => value.replace(/\D/g, '')

export default function EmailVerificationPending({
  email,
  onBackToLogin,
  onVerifyCode,
  onResendCode,
}) {
  const [timeLeft, setTimeLeft] = React.useState(COUNTDOWN_SECONDS)
  const [code, setCode] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [infoMessage, setInfoMessage] = React.useState('')

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    setTimeLeft(COUNTDOWN_SECONDS)
    setCode('')
    setErrorMessage('')
    setInfoMessage('')
  }, [email])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setInfoMessage('')

    const result = await onVerifyCode(code.trim())
    setIsSubmitting(false)

    if (!result?.success) {
      const friendlyMessage =
        {
          EMAIL_VERIFICATION_CODE_EXPIRED:
            'Der Code ist abgelaufen. Bitte fordere einen neuen Code an.',
          EMAIL_VERIFICATION_CODE_INVALID: 'Der eingegebene Code ist ungültig.',
          EMAIL_VERIFICATION_CODE_MISSING:
            'Es liegt kein gültiger Code vor. Bitte fordere einen neuen Code an.',
          USER_NOT_FOUND: 'Wir konnten kein Konto für diese E-Mail finden.',
        }[result?.code] || result?.message || 'Die Verifizierung ist fehlgeschlagen.'

      setErrorMessage(friendlyMessage)
      return
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setErrorMessage('')
    setInfoMessage('')

    const result = await onResendCode()
    setIsResending(false)

    if (result?.success) {
      setInfoMessage('Neuer Code wurde gesendet.')
      setTimeLeft(COUNTDOWN_SECONDS)
      setCode('')
      return
    }

    setErrorMessage(
      result?.message ||
        'Der Code konnte nicht erneut gesendet werden. Bitte versuche es später noch einmal.',
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Bitte bestätige deine E-Mail</h1>
        <p>
          Wir haben einen 6-stelligen Bestätigungscode an <strong>{email}</strong> geschickt.
          Gib ihn innerhalb von 5 Minuten unten ein.
        </p>

        <div className="countdown">
          <span className="countdown-label">Verbleibende Zeit</span>
          <span className="countdown-value">
            {minutes}:{seconds}
          </span>
        </div>

        {infoMessage ? <p className="auth-info">{infoMessage}</p> : null}
        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="verificationCode">Bestätigungscode</label>
          <input
            id="verificationCode"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(extractDigits(event.target.value))}
          placeholder="123456"
          aria-label="6-stelliger Bestätigungscode"
          autoComplete="one-time-code"
          required
          disabled={isSubmitting}
        />

          <button type="submit" disabled={isSubmitting || code.length !== 6}>
            {isSubmitting ? 'Prüfe Code…' : 'Code bestätigen'}
          </button>
        </form>

        <div className="auth-hint">
          <button
            type="button"
            className="logout-button"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? 'Sende erneut…' : 'Code erneut senden'}
          </button>
        </div>

        <button type="button" className="logout-button" onClick={onBackToLogin}>
          Zur Anmeldung
        </button>
      </section>
    </main>
  )
}
