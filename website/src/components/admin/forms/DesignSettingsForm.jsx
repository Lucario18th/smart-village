import React, { useEffect, useState } from 'react'
import { apiClient } from '../../../api/client'

const ADMIN_PREFS_KEY = 'smart-village-admin-preferences'

const I18N = {
  de: {
    languageTitle: 'Sprache',
    languageLabel: 'Anzeigesprache',
  },
  en: {
    languageTitle: 'Language',
    languageLabel: 'Display language',
  },
  fr: {
    languageTitle: 'Langue',
    languageLabel: "Langue d'affichage",
  },
}

const DEFAULT_ADMIN_PREFS = {
  language: 'de',
}

function loadAdminPrefs() {
  try {
    const raw = localStorage.getItem(ADMIN_PREFS_KEY)
    if (!raw) return DEFAULT_ADMIN_PREFS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_ADMIN_PREFS,
      ...parsed,
    }
  } catch {
    return DEFAULT_ADMIN_PREFS
  }
}

function persistAdminPrefs(prefs) {
  localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(prefs))
}

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
  const [adminPrefs, setAdminPrefs] = useState(() => loadAdminPrefs())
  const locale = adminPrefs.language || 'de'
  const text = I18N[locale]

  useEffect(() => {
    persistAdminPrefs(adminPrefs)
  }, [adminPrefs])
  return (
    <>
      <section className="design-card">
        <div className="design-card-header">
          <h3 className="design-card-title">Farbschema</h3>
          <p className="design-card-hint">Änderungen werden sofort angewendet.</p>
        </div>
        <div className="design-card-fields">
          <div className="design-select-field">
            <span className="design-select-label">Theme-Modus</span>
            <div className="design-toggle-group" role="group" aria-label="Theme-Modus">
              <button
                type="button"
                className={`design-toggle-btn${values.themeMode === 'light' ? ' is-active' : ''}`}
                onClick={() => onChange('themeMode', 'light')}
                aria-pressed={values.themeMode === 'light'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l.7.7a1 1 0 1 1-1.41 1.42l-.71-.71a1 1 0 0 1 0-1.41Zm13.44 13.44a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41ZM3 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm15 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM4.22 19.78a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.7.71a1 1 0 0 1-1.42 0Zm13.44-13.44a1 1 0 0 1 0-1.41l.71-.7a1 1 0 1 1 1.41 1.41l-.71.7a1 1 0 0 1-1.41 0Z" />
                </svg>
                Hell
              </button>
              <button
                type="button"
                className={`design-toggle-btn${values.themeMode === 'dark' ? ' is-active' : ''}`}
                onClick={() => onChange('themeMode', 'dark')}
                aria-pressed={values.themeMode === 'dark'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1Z" />
                </svg>
                Dunkel
              </button>
            </div>
          </div>
          <div className="design-select-field">
            <span className="design-select-label">Kontrast</span>
            <div className="design-toggle-group" role="group" aria-label="Kontrast">
              <button
                type="button"
                className={`design-toggle-btn${values.contrast === 'standard' ? ' is-active' : ''}`}
                onClick={() => onChange('contrast', 'standard')}
                aria-pressed={values.contrast === 'standard'}
              >
                Standard
              </button>
              <button
                type="button"
                className={`design-toggle-btn${values.contrast === 'high' ? ' is-active' : ''}`}
                onClick={() => onChange('contrast', 'high')}
                aria-pressed={values.contrast === 'high'}
              >
                Hoch
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="design-card">
        <h3 className="design-card-title">{text.languageTitle}</h3>
        <div className="design-card-fields">
          <div className="design-select-field">
            <label htmlFor="admin-design-language-select" className="design-select-label">{text.languageLabel}</label>
            <select
              id="admin-design-language-select"
              value={locale}
              onChange={(event) =>
                setAdminPrefs((current) => ({
                  ...current,
                  language: event.target.value,
                }))
              }
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </section>

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
