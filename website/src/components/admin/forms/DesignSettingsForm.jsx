import React from 'react'

export default function DesignSettingsForm({ values, onChange }) {
  return (
    <>
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

        <label>
          Icon-Set
          <select value={values.iconSet} onChange={(event) => onChange('iconSet', event.target.value)}>
            <option value="default">Standard</option>
            <option value="outlined">Outlined</option>
            <option value="rounded">Rounded</option>
          </select>
        </label>
      </div>
    </>
  )
}
