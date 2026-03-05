import React from 'react'

export default function EnergySettingsForm({ values, onModuleEnabledChange }) {
  const isEnabled = values?.energyMonitor?.enabled ?? false
  const sensorCount = values?.energyMonitor?.sensors?.length ?? 0

  return (
    <section className="module-settings">
      <div className="service-grid">
        <article className="service-card">
          <div>
            <h3>Strommonitoring</h3>
            <p>Stromverbrauch und Lastspitzen für die Gemeinde erfassen.</p>
            <p className="service-meta">
              Status: {isEnabled ? 'Aktiv' : 'Inaktiv'} · {sensorCount} Sensor{sensorCount !== 1 ? 'en' : ''}
            </p>
          </div>

          <label className="switch-control">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => onModuleEnabledChange('energyMonitor', event.target.checked)}
              aria-label="Strommonitoring aktivieren"
            />
            <span className="switch-slider" aria-hidden="true" />
          </label>
        </article>
      </div>

      <p className="module-settings-hint">Messpunkte und Sensoren verwaltest du im Tab „Sensoren“.</p>
    </section>
  )
}
