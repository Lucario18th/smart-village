import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'
import LocationAutocomplete from './LocationAutocomplete'

export default function RegisterView({ onRegister, onBack, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    // Validation
    if (!email) {
      setErrorMessage('E-Mail ist erforderlich')
      return
    }

    if (!password) {
      setErrorMessage('Passwort ist erforderlich')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwörter stimmen nicht überein')
      return
    }

    if (!selectedLocation?.id) {
      setErrorMessage('Bitte wähle ein gültiges Dorf (PLZ oder Ort) aus')
      return
    }

    setIsLoading(true)

    try {
      const result = await onRegister({
        email,
        password,
        postalCodeId: selectedLocation.id,
      })

      if (!result.success) {
        setErrorMessage(result.error)
        return
      }

      setPassword('')
      setConfirmPassword('')
      setErrorMessage('')
      setSelectedLocation(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Smart Village Admin</h1>
        <p>Erstellen Sie ein neues Benutzerkonto</p>

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
            autoComplete="new-password"
            required
            disabled={isLoading}
            minLength="8"
          />

          <label htmlFor="confirmPassword">Passwort wiederholen</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            disabled={isLoading}
            minLength="8"
          />

          <LocationAutocomplete
            label="Dein Dorf (PLZ oder Ort)"
            placeholder="12345 oder Musterstadt"
            onSelect={setSelectedLocation}
            selectedOption={selectedLocation}
            disabled={isLoading}
          />

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Wird registriert...' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-hint">
          Bereits ein Konto? <button type="button" onClick={onBack} className="link-button">Hier anmelden</button>
        </p>
      </section>
    </main>
  )
}
