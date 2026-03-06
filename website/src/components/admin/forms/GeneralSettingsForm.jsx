import React, { useState } from 'react'
import LocationAutocomplete from '../../LocationAutocomplete'

export default function GeneralSettingsForm({ values, onChange }) {
  const [isEditing, setIsEditing] = useState(false)

  const toggleEditing = () => {
    setIsEditing((current) => !current)
  }

  const isValidPhone = (phone) => {
    if (!phone) return true
    // Simple validation: must start with + and contain only digits, spaces, hyphens
    const phoneRegex = /^\+?[\d\s\-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  return (
    <section className="general-settings">
      <div className="general-form-header">
        <button type="button" className="edit-toggle-button" onClick={toggleEditing}>
          ✎ {isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}
        </button>
      </div>

      <div className="admin-form-grid general-form-grid">
        <LocationAutocomplete
          label="PLZ oder Ort"
          placeholder="z. B. 10115 oder Berlin"
          disabled={!isEditing}
          selectedOption={
            values.postalCodeId
              ? {
                  id: values.postalCodeId,
                  postalCode: values.postalCode,
                  city: values.city,
                }
              : null
          }
          onSelect={(option) => {
            if (!option) {
              onChange('postalCodeId', null)
              onChange('postalCode', '')
              onChange('city', '')
              return
            }
            onChange('postalCodeId', option.id)
            onChange('postalCode', option.postalCode)
            onChange('city', option.city)
          }}
        />

        <label>
          Ortsname
          <input
            type="text"
            value={values.villageName}
            onChange={(event) => onChange('villageName', event.target.value)}
            placeholder="z. B. Musterhausen"
            disabled={!isEditing}
          />
        </label>

        <label>
          Gemeinde-ID
          <input
            type="text"
            value={values.municipalityCode}
            onChange={(event) => onChange('municipalityCode', event.target.value)}
            placeholder="z. B. SV-MH"
            disabled={!isEditing}
          />
        </label>

        <label>
          Kontakt E-Mail
          <input
            type="email"
            value={values.contactEmail}
            onChange={(event) => onChange('contactEmail', event.target.value)}
            placeholder="verwaltung@gemeinde.de"
            disabled={!isEditing}
          />
        </label>

        <label>
          Kontakt Telefon
          <input
            type="text"
            value={values.contactPhone}
            onChange={(event) => onChange('contactPhone', event.target.value)}
            placeholder="+49 ... (mind. 10 Ziffern)"
            disabled={!isEditing}
            className={isEditing && values.contactPhone && !isValidPhone(values.contactPhone) ? 'input-invalid' : ''}
          />
          {isEditing && values.contactPhone && !isValidPhone(values.contactPhone) ? (
            <small className="field-error">Ungültige Telefonnummer</small>
          ) : null}
        </label>

        <label className="full-width">
          Info-Text
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
