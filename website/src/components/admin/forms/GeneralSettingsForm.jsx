import React, { useEffect, useRef, useState } from 'react'
import LocationAutocomplete from '../../LocationAutocomplete'

const ADMIN_PREFS_KEY = 'smart-village-admin-preferences'

const I18N = {
  de: {
    languageLabel: 'Sprache',
  },
  en: {
    languageLabel: 'Language',
  },
  fr: {
    languageLabel: 'Langue',
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

export default function GeneralSettingsForm({
  values,
  onChange,
  internalVillageId = '—',
  onEditingChange,
  onSave,
  isSaving = false,
  canSave = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [locationResetKey, setLocationResetKey] = useState(0)
  const [adminPrefs, setAdminPrefs] = useState(() => loadAdminPrefs())
  const editSnapshotRef = useRef(null)
  const locale = adminPrefs.language || 'de'
  const text = I18N[locale]

  useEffect(() => {
    persistAdminPrefs(adminPrefs)
  }, [adminPrefs])

  const toggleEditing = () => {
    if (!isEditing) {
      // Enter edit mode: keep a snapshot so cancel can restore prior values.
      editSnapshotRef.current = { ...values }
      setIsEditing(true)
      onEditingChange?.(true)
      return
    }

    // Leave edit mode via cancel: restore snapshot values.
    if (editSnapshotRef.current) {
      Object.entries(editSnapshotRef.current).forEach(([field, snapshotValue]) => {
        onChange(field, snapshotValue)
      })
    }

    editSnapshotRef.current = null
    setIsEditing(false)
    // Force-reset local autocomplete query state on cancel.
    setLocationResetKey((current) => current + 1)
    onEditingChange?.(false)
  }

  const isValidPhone = (phone) => {
    if (!phone) return true
    // Simple validation: must start with + and contain only digits, spaces, hyphens
    const phoneRegex = /^\+?[\d\s\-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const sanitizePhoneInput = (rawValue) => {
    const onlyPhoneChars = rawValue.replace(/[^\d+\s\-()]/g, '')
    const startsWithPlus = onlyPhoneChars.startsWith('+')
    const withoutExtraPlus = onlyPhoneChars.replace(/\+/g, '')
    return `${startsWithPlus ? '+' : ''}${withoutExtraPlus}`
  }

  const handleSave = async () => {
    try {
      await onSave?.()
      editSnapshotRef.current = null
      setIsEditing(false)
      onEditingChange?.(false)
    } catch (error) {
      // Keep edit mode active when save fails.
    }
  }

  return (
    <section className="general-settings">
      <div className="general-form-header">
        <div className="general-form-actions">
          {isEditing ? (
            <button
              type="button"
              className="general-save-button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm3-10H5V5h10v4Z"
                />
              </svg>
              <span>{isSaving ? 'Speichern...' : 'Speichern'}</span>
            </button>
          ) : null}

          <button type="button" className="edit-toggle-button" onClick={toggleEditing}>
            {isEditing ? (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3 1.42 1.41Z"
                  />
                </svg>
                <span>Abbrechen</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z"
                  />
                </svg>
                <span>Bearbeiten</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="admin-form-grid general-form-grid general-form-grid-grouped">
        <div className="general-field-stack">
          <label className="general-outlined-field">
            <span className="general-field-label">Interne ID</span>
            <input type="text" value={internalVillageId} disabled readOnly />
          </label>

          <label className="general-outlined-field">
            <span className="general-field-label">Gemeinde-ID</span>
            <input
              type="text"
              value={values.municipalityCode}
              onChange={(event) => onChange('municipalityCode', event.target.value)}
              placeholder="z. B. SV-MH"
              disabled={!isEditing}
            />
          </label>
        </div>

        <div className="general-field-stack">
          <LocationAutocomplete
            key={locationResetKey}
            className="general-outlined-field"
            labelClassName="general-field-label"
            label="Standort (PLZ und Ort)"
            placeholder="z. B. 10115 Berlin"
            disabled={!isEditing}
            selectedOption={
              values.postalCodeId
                ? {
                    id: values.postalCodeId,
                    zipCode: values.zipCode,
                    city: values.city,
                  }
                : null
            }
            onSelect={(option) => {
              if (!option) {
                onChange('postalCodeId', null)
                onChange('zipCode', '')
                onChange('city', '')
                return
              }
              onChange('postalCodeId', option.id)
              onChange('zipCode', option.zipCode)
              onChange('city', option.city)
            }}
          />

          <label className="general-outlined-field">
            <span className="general-field-label">Ortsname</span>
            <input
              type="text"
              value={values.villageName}
              onChange={(event) => onChange('villageName', event.target.value)}
              placeholder="z. B. Musterhausen"
              disabled={!isEditing}
            />
          </label>
        </div>

        <div className="general-field-stack">
          <label className="general-outlined-field">
            <span className="general-field-label">E-Mail</span>
            <input
              type="email"
              value={values.contactEmail}
              onChange={(event) => onChange('contactEmail', event.target.value)}
              placeholder="verwaltung@gemeinde.de"
              disabled={!isEditing}
            />
          </label>

          <label className="general-outlined-field">
            <span className="general-field-label">Telefon</span>
            <input
              type="tel"
              value={values.contactPhone}
              onChange={(event) => onChange('contactPhone', sanitizePhoneInput(event.target.value))}
              placeholder="+49 ... (mind. 10 Ziffern)"
              disabled={!isEditing}
              inputMode="tel"
              autoComplete="tel"
              pattern="^\+?[0-9\s\-()]+$"
              className={isEditing && values.contactPhone && !isValidPhone(values.contactPhone) ? 'input-invalid' : ''}
            />
            {isEditing && values.contactPhone && !isValidPhone(values.contactPhone) ? (
              <small className="field-error">Ungültige Telefonnummer</small>
            ) : null}
          </label>
        </div>

        <label className="general-outlined-field general-api-field">
          <span className="general-field-label">Bürger-API</span>
          <div className="general-status-segment" role="group" aria-label="Sichtbarkeit der User-API">
            <button
              type="button"
              className={`general-status-option ${(values.isPublicAppApiEnabled ?? true) ? 'is-active is-public' : ''}`}
              onClick={() => onChange('isPublicAppApiEnabled', true)}
              disabled={!isEditing}
              aria-pressed={values.isPublicAppApiEnabled ?? true}
            >
              Öffentlich
            </button>
            <button
              type="button"
              className={`general-status-option ${!(values.isPublicAppApiEnabled ?? true) ? 'is-active is-protected' : ''}`}
              onClick={() => onChange('isPublicAppApiEnabled', false)}
              disabled={!isEditing}
              aria-pressed={!(values.isPublicAppApiEnabled ?? true)}
            >
              Geschützt
            </button>
          </div>
        </label>

        <label className="full-width general-outlined-field">
          <span className="general-field-label">Status-Text</span>
          <textarea
            value={values.statusText || ''}
            onChange={(event) => onChange('statusText', event.target.value)}
            rows={3}
            placeholder="z. B. Wartungsarbeiten am Dorfplatz bis 18:00 Uhr"
            disabled={!isEditing}
          />
        </label>

        <label className="full-width general-outlined-field">
          <span className="general-field-label">Info-Text</span>
          <textarea
            value={values.infoText}
            onChange={(event) => onChange('infoText', event.target.value)}
            rows={4}
            placeholder="Kurzer Informationstext für Bürgerinnen und Bürger"
            disabled={!isEditing}
          />
        </label>
      </div>
    </section>
  )
}
