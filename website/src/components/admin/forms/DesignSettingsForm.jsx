import React, { useState } from 'react'
import { apiClient } from '../../../api/client'

function ChangePasswordSection() {
  const [fields, setFields] = useState({ current: '', next: '', confirm: '' })
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | string (error)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (fields.next !== fields.confirm) {
      setStatus('Die neuen Passwörter stimmen nicht überein.')
      return
    }
    if (fields.next.length < 8) {
      setStatus('Das neue Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    setStatus('loading')
    try {
      await apiClient.auth.changePassword(fields.current, fields.next)
      setStatus('success')
      setFields({ current: '', next: '', confirm: '' })
    } catch (err) {
      setStatus(
        err.code === 'INVALID_PASSWORD'
          ? 'Das aktuelle Passwort ist falsch.'
          : err.message || 'Passwort konnte nicht geändert werden.'
      )
    }
  }

  return (
    <section className="pw-change-section">
      <h3 className="pw-change-title">Passwort ändern</h3>
      <form className="pw-change-form" onSubmit={handleSubmit} noValidate>
        <label className="pw-change-field">
          <span>Aktuelles Passwort</span>
          <input
            type="password"
            name="current"
            value={fields.current}
            onChange={handleChange}
            autoComplete="current-password"
            required
            disabled={status === 'loading'}
          />
        </label>
        <label className="pw-change-field">
          <span>Neues Passwort</span>
          <input
            type="password"
            name="next"
            value={fields.next}
            onChange={handleChange}
            autoComplete="new-password"
            required
            disabled={status === 'loading'}
          />
        </label>
        <label className="pw-change-field">
          <span>Neues Passwort bestätigen</span>
          <input
            type="password"
            name="confirm"
            value={fields.confirm}
            onChange={handleChange}
            autoComplete="new-password"
            required
            disabled={status === 'loading'}
          />
        </label>
        {status && status !== 'loading' && status !== 'success' && (
          <p className="pw-change-error" role="alert">{status}</p>
        )}
        {status === 'success' && (
          <p className="pw-change-success" role="status">Passwort erfolgreich geändert.</p>
        )}
        <button type="submit" className="pw-change-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Speichern...' : 'Passwort ändern'}
        </button>
      </form>
    </section>
  )
}

export default function DesignSettingsForm({
  values,
  onChange,
  onDeleteAccount,
  isDeleteLoading = false,
}) {
  return (
    <>
      <h3 className="design-subtitle">Farbshema</h3>
      <p className="design-hint">Die Änderungen werden sofort angewendet und sind in dieser Ansicht sichtbar.</p>

      <div className="admin-form-grid">
        <label>
          Theme-Modus
          <select value={values.themeMode} onChange={(event) => onChange('themeMode', event.target.value)}>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </label>

        <label>
          Kontrast
          <select value={values.contrast} onChange={(event) => onChange('contrast', event.target.value)}>
            <option value="standard">Standard</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </label>
      </div>

      <ChangePasswordSection />

      <section className="settings-danger-zone" aria-label="Kontoverwaltung">
        <h3 className="settings-danger-title">Kontoverwaltung</h3>
        <p className="settings-danger-hint">Dieser Schritt ist endgültig und kann nicht rückgängig gemacht werden.</p>
        <button
          type="button"
          className="settings-danger-button"
          onClick={onDeleteAccount}
          disabled={isDeleteLoading}
        >
          Konto löschen
        </button>
      </section>
    </>
  )
}
