import React from 'react'

const formatSensorCount = (count) => `${count} Sensor${count === 1 ? '' : 'en'}`

function ServiceCard({ title, description, moduleId, isEnabled, sensorCount, onEnabledChange, onManageSensors }) {
  return (
    <article className="service-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="service-meta">
          Status: {isEnabled ? 'Aktiv' : 'Inaktiv'}
          {typeof sensorCount === 'number' ? ` · ${formatSensorCount(sensorCount)}` : ''}
        </p>
      </div>

      <div className="service-card-controls">
        <label className="switch-control">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            aria-label={`${title} aktivieren`}
          />
          <span className="switch-slider" aria-hidden="true" />
        </label>

        {onManageSensors ? (
          <button
            type="button"
            className="sensor-button"
            onClick={() => onManageSensors(moduleId)}
            disabled={!isEnabled}
          >
            Sensoren verwalten →
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({ values, onModuleEnabledChange, onNavigateToSensors }) {
  const safeValues = values && typeof values === 'object' ? values : {}

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

  const getSensorCount = (moduleId) => {
    const sensors = safeValues[moduleId]?.sensors
    return Array.isArray(sensors) ? sensors.length : 0
  }

  return (
    <section className="module-settings">
      <p className="module-settings-hint">
        Technische Datenquellen aktivieren. Sensoren und Messpunkte konfigurierst du im Navigationspunkt „Sensoren“.
      </p>

      {!values ? (
        <p className="auth-hint">Moduldaten konnten nicht geladen werden. Standardwerte werden angezeigt.</p>
      ) : null}

      <div className="service-grid">
        {modules.map((module) => (
          <ServiceCard
            key={module.id}
            title={module.title}
            description={module.description}
            moduleId={module.id}
            isEnabled={safeValues[module.id]?.enabled ?? false}
            sensorCount={getSensorCount(module.id)}
            onEnabledChange={(enabled) => onModuleEnabledChange(module.id, enabled)}
            onManageSensors={onNavigateToSensors}
          />
        ))}
      </div>
    </section>
  )
}
