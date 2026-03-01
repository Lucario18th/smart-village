import React from 'react'

function ModuleRow({ title, description, moduleId, isEnabled, sensorCount, onEnabledChange, onManageSensors }) {
  return (
    <article className="module-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="module-sensors-info">{sensorCount} Sensor{sensorCount !== 1 ? 'en' : ''}</p>
      </div>

      <div className="module-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          Aktiv
        </label>

        <button type="button" className="sensor-button" onClick={onManageSensors}>
          Sensoren verwalten →
        </button>
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({ values, onModuleEnabledChange, onNavigateToSensors }) {
  return (
    <div className="module-list">
      <ModuleRow
        title="Mitfahrbank"
        description="Digitale Mitfahrbank mit Status-/Anfrage-Informationen"
        moduleId="rideShareBench"
        isEnabled={values.rideShareBench.enabled}
        sensorCount={values.rideShareBench.sensors?.length ?? 0}
        onEnabledChange={(enabled) => onModuleEnabledChange('rideShareBench', enabled)}
        onManageSensors={() => onNavigateToSensors('rideShareBench')}
      />

      <ModuleRow
        title="Altkleidercontainer"
        description="Sensorische Füllstandserfassung für Entleerungsplanung"
        moduleId="textileContainer"
        isEnabled={values.textileContainer.enabled}
        sensorCount={values.textileContainer.sensors?.length ?? 0}
        onEnabledChange={(enabled) => onModuleEnabledChange('textileContainer', enabled)}
        onManageSensors={() => onNavigateToSensors('textileContainer')}
      />

      <ModuleRow
        title="Strommonitoring"
        description="Lokale Energie- und Verbrauchsdaten visualisieren"
        moduleId="energyMonitor"
        isEnabled={values.energyMonitor.enabled}
        sensorCount={values.energyMonitor.sensors?.length ?? 0}
        onEnabledChange={(enabled) => onModuleEnabledChange('energyMonitor', enabled)}
        onManageSensors={() => onNavigateToSensors('energyMonitor')}
      />
    </div>
  )
}
