import React, { useState } from 'react'
import { AUTH_HINT } from '../auth/accounts'
import LocationAutocomplete from './LocationAutocomplete'

export default function RegisterView({ onRegister, onBack, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState('MUNICIPAL')
  const [isPublicAppApiEnabled, setIsPublicAppApiEnabled] = useState(true)
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
        accountType,
        isPublicAppApiEnabled,
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
        <header className="auth-card-header">
          <span className="auth-kicker">Smart Village</span>
          <h1>Konto erstellen</h1>
          <p className="auth-subtitle">Registrieren Sie einen Gemeinde- oder Privat-Account.</p>
        </header>

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
            label="Ihr Dorf (PLZ oder Ort)"
            placeholder="12345 oder Musterstadt"
            onSelect={setSelectedLocation}
            selectedOption={selectedLocation}
            disabled={isLoading}
          />

          <label htmlFor="accountType">Account-Typ</label>
          <select
            id="accountType"
            value={accountType}
            onChange={(event) => {
              const nextType = event.target.value
              setAccountType(nextType)
              if (nextType === 'PRIVATE') {
                setIsPublicAppApiEnabled(false)
              }
            }}
            disabled={isLoading}
          >
            <option value="MUNICIPAL">Gemeinde / Organisation</option>
            <option value="PRIVATE">Privatperson</option>
          </select>

          <label className="checkbox-field" htmlFor="isPublicAppApiEnabled">
            <input
              id="isPublicAppApiEnabled"
              type="checkbox"
              checked={isPublicAppApiEnabled}
              onChange={(event) => setIsPublicAppApiEnabled(event.target.checked)}
              disabled={isLoading}
            />
            <span>Daten dürfen in der öffentlichen User-API sichtbar sein</span>
          </label>

          {errorMessage ? <p className="auth-error" role="alert">{errorMessage}</p> : null}

          <button type="submit" className="auth-submit-button" disabled={isLoading}>
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
