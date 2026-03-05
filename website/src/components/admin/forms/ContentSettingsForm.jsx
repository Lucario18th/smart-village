import React from 'react'

function ContentServiceRow({ title, description, isEnabled, onEnabledChange }) {
  return (
    <article className="service-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
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

export default function ContentSettingsForm({ values, onContentEnabledChange }) {
  const contentServices = [
    {
      id: 'news',
      title: 'Nachrichten',
      description: 'Aktuelle Meldungen und Mitteilungen für die Gemeinde-App anzeigen.',
    },
    {
      id: 'events',
      title: 'Veranstaltungen',
      description: 'Lokale Termine und Veranstaltungen im Kalender bereitstellen.',
    },
  ]

  return (
    <section className="module-settings">
      <p className="module-settings-hint">Diese Inhalte erscheinen direkt in der Bürger-App.</p>

      <div className="service-grid">
        {contentServices.map((service) => (
          <ContentServiceRow
            key={service.id}
            title={service.title}
            description={service.description}
            isEnabled={values?.[service.id]?.enabled ?? false}
            onEnabledChange={(enabled) => onContentEnabledChange(service.id, enabled)}
          />
        ))}
      </div>
    </section>
  )
}
