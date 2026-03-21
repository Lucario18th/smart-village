import React from 'react'

const COUNTDOWN_SECONDS = 5 * 60
const CODE_LENGTH = 6
const getDefaultMailhogUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:8025'
  return `${window.location.protocol}//${window.location.hostname}:8025`
}
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
  const mailhogUrl = import.meta.env?.VITE_MAILHOG_URL || getDefaultMailhogUrl()
  const codeInputRefs = React.useRef([])
  const codeDigits = React.useMemo(
    () => Array.from({ length: CODE_LENGTH }, (_, index) => code[index] || ''),
    [code]
  )

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

  const setCodeAt = (index, value) => {
    const nextDigits = [...codeDigits]
    nextDigits[index] = value
    setCode(nextDigits.join('').slice(0, CODE_LENGTH))
  }

  const handleDigitChange = (index, rawValue) => {
    const digits = extractDigits(rawValue)

    if (!digits) {
      setCodeAt(index, '')
      return
    }

    const nextDigits = [...codeDigits]
    let cursor = index

    for (const digit of digits) {
      if (cursor >= CODE_LENGTH) break
      nextDigits[cursor] = digit
      cursor += 1
    }

    setCode(nextDigits.join('').slice(0, CODE_LENGTH))

    const nextFocusIndex = Math.min(cursor, CODE_LENGTH - 1)
    codeInputRefs.current[nextFocusIndex]?.focus()
  }

  const handleDigitKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (codeDigits[index]) {
        setCodeAt(index, '')
        return
      }

      if (index > 0) {
        setCodeAt(index - 1, '')
        codeInputRefs.current[index - 1]?.focus()
      }
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
      return
    }

    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleDigitPaste = (index, event) => {
    const pasted = extractDigits(event.clipboardData.getData('text'))
    if (!pasted) return

    event.preventDefault()
    handleDigitChange(index, pasted)
  }

  const handleOpenMailhog = () => {
    window.open(mailhogUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-card-header">
          <span className="auth-kicker">Smart Village</span>
          <h1>E-Mail bestätigen</h1>
          <p className="auth-subtitle">
            Wir haben einen 6-stelligen Bestätigungscode an <strong>{email}</strong> geschickt.
            Gib ihn innerhalb von 5 Minuten unten ein.
          </p>
        </header>

        <div className="countdown">
          <span className="countdown-label">Verbleibende Zeit</span>
          <span className="countdown-value">
            {minutes}:{seconds}
          </span>
        </div>

        {infoMessage ? <p className="auth-info">{infoMessage}</p> : null}
        {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Bestätigungscode</label>
          <div className="auth-code-grid" role="group" aria-label="6-stelliger Bestätigungscode">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  codeInputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleDigitKeyDown(index, event)}
                onPaste={(event) => handleDigitPaste(index, event)}
                aria-label={`Code-Ziffer ${index + 1}`}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                required
                disabled={isSubmitting}
                className="auth-code-input"
              />
            ))}
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? 'Prüfe Code…' : 'Code bestätigen'}
          </button>
        </form>

        <div className="auth-actions">
          <button
            type="button"
            className="auth-secondary-button"
            onClick={handleOpenMailhog}
          >
            MailHog öffnen (neuer Tab)
          </button>
          <button
            type="button"
            className="auth-secondary-button"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? 'Sende erneut…' : 'Code erneut senden'}
          </button>
          <button
            type="button"
            className="auth-secondary-button"
            onClick={onBackToLogin}
          >
            Zur Anmeldung
          </button>
        </div>
      </section>
    </main>
  )
}
