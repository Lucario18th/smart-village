import React from 'react'

function ModuleServiceRow({ title, description, isEnabled, sensorCount, onEnabledChange }) {
  return (
    <article className="service-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <p className="service-meta">
          Status: {isEnabled ? 'Aktiv' : 'Inaktiv'} · {sensorCount} Sensor{sensorCount !== 1 ? 'en' : ''}
        </p>
      </div>

      <label className="switch-control">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          aria-label={`${title} aktivieren`}
        />
        <span className="switch-slider" aria-hidden="true" />
      </label>
    </article>
  )
}

export default function ModulesSettingsForm({ values, onModuleEnabledChange }) {
  const modules = [
    {
      id: 'weather',
      title: 'Wetterdaten',
      description: 'Lokale Wetter- und Klimadaten anzeigen.',
    },
    {
      id: 'rideShareBench',
      title: 'Mitfahrbank',
      description: 'Digitale Mitfahrbank und freie Mitfahrplätze verwalten.',
    },
    {
      id: 'textileContainer',
      title: 'Altkleidercontainer',
      description: 'Füllstände und Leerungsbedarf von Containern erfassen.',
    },
    {
      id: 'wasteCalendar',
      title: 'Abfallkalender',
      description: 'Abholtermine und Erinnerungen für Bürger anzeigen.',
    },
  ]

  return (
    <section className="module-settings">
      <p className="module-settings-hint">
        Technische Datenquellen aktivieren. Sensoren und Messpunkte konfigurierst du im Tab „Sensoren“.
      </p>

      <div className="service-grid">
        {modules.map((module) => (
          <ModuleServiceRow
            key={module.id}
            title={module.title}
            description={module.description}
            isEnabled={values?.[module.id]?.enabled ?? false}
            sensorCount={values?.[module.id]?.sensors?.length ?? 0}
            onEnabledChange={(enabled) => onModuleEnabledChange(module.id, enabled)}
          />
        ))}
      </div>
    </section>
  )
}
