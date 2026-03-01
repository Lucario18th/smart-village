import React, { useState } from 'react'

export default function GeneralSettingsForm({ values, onChange }) {
  const [isEditing, setIsEditing] = useState(false)

  const toggleEditing = () => {
    setIsEditing((current) => !current)
  }

  return (
    <>
      <div className="general-form-header">
        <button type="button" className="edit-toggle-button" onClick={toggleEditing}>
          ✎ {isEditing ? 'Bearbeitung beenden' : 'Bearbeiten'}
        </button>
      </div>

      <div className="admin-form-grid">
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
          placeholder="+49 ..."
          disabled={!isEditing}
        />
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

        {!isEditing ? <p className="edit-hint">Felder sind gesperrt. Zum Bearbeiten auf den Stift klicken.</p> : null}
      </div>
    </>
  )
}
