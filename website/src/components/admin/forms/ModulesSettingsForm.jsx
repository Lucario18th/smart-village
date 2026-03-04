import React from 'react'

function ModuleRow({ title, description, moduleId, isEnabled, onEnabledChange, onManageSensors }) {
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
            checked={isEnabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          Aktiv
        </label>

        <button type="button" className="sensor-button" onClick={onManageSensors} disabled={!isEnabled}>
          Sensoren verwalten →
        </button>
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({ values, onModuleEnabledChange, onNavigateToSensors }) {
  const modules = [
    {
      id: 'sensors',
      title: 'Sensoren',
      description: 'Sensor-basierte Datenerfassung und -visualisierung',
    },
    {
      id: 'weather',
      title: 'Wetterdaten',
      description: 'Lokale Wetter- und Klimainformationen',
    },
    {
      id: 'news',
      title: 'Nachrichten',
      description: 'Lokale Informationen und Ankündigungen',
    },
    {
      id: 'events',
      title: 'Veranstaltungen',
      description: 'Lokale Termine und Veranstaltungen',
    },
  ]

  return (
    <div className="module-list">
      {modules.map((module) => (
        <ModuleRow
          key={module.id}
          title={module.title}
          description={module.description}
          moduleId={module.id}
          isEnabled={values[module.id]?.enabled ?? false}
          onEnabledChange={(enabled) => onModuleEnabledChange(module.id, enabled)}
          onManageSensors={() => onNavigateToSensors(module.id)}
        />
      ))}

      <div className="module-info-box">
        <p>
          <strong>Hinweis:</strong> Aktivierte Module können in den Sensor-Einstellungen konfiguriert werden.
          Die verfügbaren Sensoren werden dann für die ausgewählten Module angezeigt.
        </p>
      </div>
    </div>
  )
}
