import React, { useRef, useState } from 'react'

const SENSOR_FIELD_TOGGLES = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Typ' },
  { id: 'description', label: 'Beschreibung' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'coordinates', label: 'Koordinaten' },
  { id: 'status', label: 'Aktueller Status' },
]

const DEFAULT_SENSOR_FIELDS = {
  name: true,
  type: true,
  description: true,
  gateway: true,
  coordinates: true,
  status: true,
}

function ServiceCard({
  title,
  description,
  placement,
  category,
  isEnabled,
  onEnabledChange,
  isEditing,
  secondaryControl,
  isExpanded = false,
  children,
}) {
  return (
    <article className={`service-card${isExpanded ? ' service-card--expanded' : ''}`}>
      <div className="service-card-content">
        <div className="service-card-head">
          <h3>{title}</h3>
          <span className="service-badge">{category}</span>
        </div>
        <p>{description}</p>
        <div className="service-meta-row">
          <p className="service-meta">Sichtbar in: {placement}</p>
        </div>
        {children}
      </div>

      <div className="service-card-controls">
        <label className="switch-control">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            aria-label={`${title} aktivieren`}
            disabled={!isEditing}
          />
          <span className="switch-slider" aria-hidden="true" />
        </label>
        {secondaryControl}
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({
  values,
  onModuleEnabledChange,
  onModuleFieldEnabledChange,
  onSave,
  isSaving = false,
  canSave = false,
}) {
  const safeValues = values && typeof values === 'object' ? values : {}
  const [isEditing, setIsEditing] = useState(false)
  const [isSensorOptionsOpen, setIsSensorOptionsOpen] = useState(false)
  const editSnapshotRef = useRef(null)
  const sensorFields = {
    ...DEFAULT_SENSOR_FIELDS,
    ...(safeValues.sensors?.fields || {}),
  }

  const modules = [
    {
      id: 'sensors',
      title: 'Sensordaten',
      description: 'Sensor-basierte Datenerfassung und -visualisierung',
      placement: 'Startseite und Detailansichten',
      category: 'Daten',
    },
    {
      id: 'weather',
      title: 'Wetterdaten',
      description: 'Lokale Wetter- und Klimainformationen',
      placement: 'Startseite und Wetterbereich',
      category: 'Umwelt',
    },
    {
      id: 'news',
      title: 'Nachrichten',
      description: 'Lokale Informationen und Ankündigungen',
      placement: 'Startseite und News-Feed',
      category: 'Info',
    },
    {
      id: 'events',
      title: 'Veranstaltungen',
      description: 'Lokale Termine und Veranstaltungen',
      placement: 'Kalender und Startseite',
      category: 'Community',
    },
    {
      id: 'map',
      title: 'Karte',
      description: 'Interaktive Karte mit Orten, Sensoren und relevanten Punkten',
      placement: 'Tab-Navigation und Detailseiten',
      category: 'Navigation',
    },
    {
      id: 'rideSharingBench',
      title: 'Mitfahrbank',
      description: 'Digitale Anzeige und Status zur Mitfahrbank im Ort',
      placement: 'Startseite und Mobilitaetsbereich',
      category: 'Mobilitaet',
    },
    {
      id: 'oldClothesContainer',
      title: 'Altkleidercontainer',
      description: 'Standorte, Fuellstand und Hinweise zu Sammelstellen',
      placement: 'Karte und Service-Bereich',
      category: 'Service',
    },
  ]

  const toggleEditing = () => {
    if (!isEditing) {
      editSnapshotRef.current = {
        modules: Object.fromEntries(
          modules.map((module) => [module.id, safeValues[module.id]?.enabled ?? false])
        ),
        sensorFields: { ...sensorFields },
      }
      setIsEditing(true)
      return
    }

    if (editSnapshotRef.current) {
      Object.entries(editSnapshotRef.current.modules || {}).forEach(([moduleId, enabled]) => {
        onModuleEnabledChange(moduleId, enabled)
      })
      Object.entries(editSnapshotRef.current.sensorFields || {}).forEach(([fieldId, enabled]) => {
        onModuleFieldEnabledChange?.('sensors', fieldId, enabled)
      })
    }

    editSnapshotRef.current = null
    setIsEditing(false)
  }

  const handleSave = () => {
    onSave?.()
    editSnapshotRef.current = null
    setIsEditing(false)
  }

  const handleModuleEnabledChange = (moduleId, enabled) => {
    onModuleEnabledChange(moduleId, enabled)

    if (moduleId === 'sensors' && !enabled) {
      SENSOR_FIELD_TOGGLES.forEach((field) => {
        onModuleFieldEnabledChange?.('sensors', field.id, false)
      })
      setIsSensorOptionsOpen(false)
    }
  }

  const isSensorsModuleEnabled = safeValues.sensors?.enabled ?? false

  return (
    <section className="module-settings">
      <div className="module-settings-head">
        <p className="module-settings-hint">
          Hier steuern Sie, welche Module und Dienste in der App sichtbar sind.
        </p>

        <div className="general-form-actions">
          {isEditing ? (
            <button
              type="button"
              className="general-save-button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm3-10H5V5h10v4Z"
                />
              </svg>
              <span>{isSaving ? 'Speichern...' : 'Speichern'}</span>
            </button>
          ) : null}

          <button type="button" className="edit-toggle-button" onClick={toggleEditing}>
            {isEditing ? (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3 1.42 1.41Z"
                  />
                </svg>
                <span>Abbrechen</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z"
                  />
                </svg>
                <span>Bearbeiten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!values && (
        <p className="auth-hint">Moduldaten konnten nicht geladen werden. Standardwerte werden angezeigt.</p>
      )}

      <div className="service-grid">
        {modules.map((module) => (
          <ServiceCard
            key={module.id}
            title={module.title}
            description={module.description}
            placement={module.placement}
            category={module.category}
            isEnabled={safeValues[module.id]?.enabled ?? false}
            onEnabledChange={(enabled) => handleModuleEnabledChange(module.id, enabled)}
            isEditing={isEditing}
            isExpanded={module.id === 'sensors' && isSensorOptionsOpen}
            secondaryControl={
              module.id === 'sensors' ? (
                <button
                  type="button"
                  className="service-module-expand service-module-expand--icon"
                  onClick={() => setIsSensorOptionsOpen((prev) => !prev)}
                  aria-expanded={isSensorOptionsOpen}
                  aria-label={isSensorOptionsOpen ? 'Optionen einklappen' : 'Optionen ausklappen'}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {isSensorOptionsOpen ? (
                      <path fill="currentColor" d="m7.41 15.59 4.59-4.58 4.59 4.58L18 14.17l-6-6-6 6 1.41 1.42Z" />
                    ) : (
                      <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
                    )}
                  </svg>
                </button>
              ) : null
            }
          >
            {module.id === 'sensors' ? (
              <div className="service-module-details">
                {isSensorOptionsOpen ? (
                  <ul className="service-module-options" aria-label="Sensor-Anzeigeoptionen">
                    {SENSOR_FIELD_TOGGLES.map((field) => (
                      <li key={field.id}>
                        <span>{field.label}</span>
                        <label className="switch-control">
                          <input
                            type="checkbox"
                            checked={sensorFields[field.id] ?? false}
                            onChange={(event) =>
                              onModuleFieldEnabledChange?.('sensors', field.id, event.target.checked)
                            }
                            disabled={!isEditing || !isSensorsModuleEnabled}
                            aria-label={`${field.label} anzeigen`}
                          />
                          <span className="switch-slider" aria-hidden="true" />
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </ServiceCard>
        ))}
      </div>
    </section>
  )
}
