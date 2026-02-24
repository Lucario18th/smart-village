import React from 'react'

function ModuleRow({ title, description, value, onEnabledChange, onSourceChange }) {
  return (
    <article className="module-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="module-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          Aktiv
        </label>

        <label>
          Datenquelle
          <select value={value.source} onChange={(event) => onSourceChange(event.target.value)}>
            <option value="simulated">Simuliert</option>
            <option value="mqtt">MQTT</option>
            <option value="rest">REST</option>
            <option value="lora">LoRa</option>
          </select>
        </label>
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({ values, onModuleEnabledChange, onModuleSourceChange }) {
  return (
    <div className="module-list">
      <ModuleRow
        title="Mitfahrbank"
        description="Digitale Mitfahrbank mit Status-/Anfrage-Informationen"
        value={values.rideShareBench}
        onEnabledChange={(enabled) => onModuleEnabledChange('rideShareBench', enabled)}
        onSourceChange={(source) => onModuleSourceChange('rideShareBench', source)}
      />

      <ModuleRow
        title="Altkleidercontainer"
        description="Sensorische Füllstandserfassung für Entleerungsplanung"
        value={values.textileContainer}
        onEnabledChange={(enabled) => onModuleEnabledChange('textileContainer', enabled)}
        onSourceChange={(source) => onModuleSourceChange('textileContainer', source)}
      />

      <ModuleRow
        title="Strommonitoring"
        description="Lokale Energie- und Verbrauchsdaten visualisieren"
        value={values.energyMonitor}
        onEnabledChange={(enabled) => onModuleEnabledChange('energyMonitor', enabled)}
        onSourceChange={(source) => onModuleSourceChange('energyMonitor', source)}
      />
    </div>
  )
}
