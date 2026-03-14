import React, { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../api/client'
import { applyThemeToDOM, getThemeClass } from '../../config/themeManager'
import PublicMapPanel from './PublicMapPanel'

const PUBLIC_PREFS_KEY = 'smart-village-public-preferences'

const DEFAULT_PREFS = {
  themeMode: 'light',
  contrast: 'standard',
  iconSet: 'default',
}

const USER_SECTIONS = [
  { id: 'map', label: 'Home', title: 'Startseite' },
  { id: 'sensors', label: 'Sensoren', title: 'Sensoren' },
  { id: 'info', label: 'Infos', title: 'Informationen' },
  { id: 'departures', label: 'Abfahrplaene', title: 'Abfahrplaene' },
  { id: 'settings', label: 'Einstellungen', title: 'Einstellungen' },
]

const DEPARTURE_PLACEHOLDERS = [
  {
    id: 'dep-1',
    line: 'RE 7',
    destination: 'Freiburg (Breisgau) Hbf',
    time: 'In 6 min',
    platform: 'Gleis 2',
  },
  {
    id: 'dep-2',
    line: 'RB 26',
    destination: 'Basel Bad Bf',
    time: 'In 14 min',
    platform: 'Gleis 1',
  },
  {
    id: 'dep-3',
    line: 'S5',
    destination: 'Lahr (Schwarzwald)',
    time: 'In 21 min',
    platform: 'Gleis 3',
  },
]

function loadPublicPrefs() {
  try {
    const raw = localStorage.getItem(PUBLIC_PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function persistPublicPrefs(prefs) {
  localStorage.setItem(PUBLIC_PREFS_KEY, JSON.stringify(prefs))
}

function SectionNotice({ text }) {
  return (
    <section className="village-section village-section-disabled">
      <p className="disabled-message">{text}</p>
    </section>
  )
}

function UserNavIcon({ sectionId }) {
  const icons = {
    map: 'M3 6.6 9 4l6 2.4L21 4v13.4L15 20l-6-2.4L3 20V6.6Zm12 11.2V8.2l-6-2.4v9.6l6 2.4Z',
    sensors: 'M12 2a6 6 0 0 1 6 6h-2a4 4 0 1 0-8 0H6a6 6 0 0 1 6-6Zm0 5a1.5 1.5 0 0 1 1.5 1.5h2a3.5 3.5 0 1 0-7 0h2A1.5 1.5 0 0 1 12 7Zm0 4.5a3 3 0 0 1 3 3V20h-6v-5.5a3 3 0 0 1 3-3Z',
    info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4a1.4 1.4 0 1 0 0 2.8A1.4 1.4 0 0 0 12 7Zm-2 5v5h4v-1.8h-1.1v-3.2H10Z',
    departures: 'M4 20V10h3v10H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z',
    settings: 'm12 3 2 3.5 4 .8-2.8 2.7.7 4-3.9-2-3.8 2 .7-4L6 7.3l4-.8L12 3Zm-7 14h14v2H5v-2Z',
  }

  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={icons[sectionId] || icons.info} />
    </svg>
  )
}

export default function PublicDashboardView({ initialVillageId = null }) {
  const [villages, setVillages] = useState([])
  const [isVillagesLoading, setIsVillagesLoading] = useState(true)
  const [villagesError, setVillagesError] = useState(null)

  const [selectedVillageId, setSelectedVillageId] = useState(() =>
    initialVillageId ? String(initialVillageId) : ''
  )
  const [activeSectionId, setActiveSectionId] = useState('map')

  const [config, setConfig] = useState(null)
  const [initialData, setInitialData] = useState(null)
  const [isVillageLoading, setIsVillageLoading] = useState(false)
  const [villageError, setVillageError] = useState(null)

  const [prefs, setPrefs] = useState(() => loadPublicPrefs())

  useEffect(() => {
    applyThemeToDOM(getThemeClass(prefs.themeMode, prefs.contrast))
    persistPublicPrefs(prefs)
  }, [prefs])

  useEffect(() => {
    let cancelled = false

    async function loadVillages() {
      try {
        const response = await apiClient.appApi.getVillages()
        if (!cancelled) {
          setVillages(response.data || [])
        }
      } catch (error) {
        if (!cancelled) {
          setVillagesError(error.message || 'Gemeinden konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsVillagesLoading(false)
        }
      }
    }

    loadVillages()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedVillageId) {
      setConfig(null)
      setInitialData(null)
      setVillageError(null)
      return
    }

    let cancelled = false

    async function loadVillageData() {
      setIsVillageLoading(true)
      setVillageError(null)
      try {
        const [configRes, dataRes] = await Promise.all([
          apiClient.appApi.getVillageConfig(selectedVillageId),
          apiClient.appApi.getVillageInitialData(selectedVillageId),
        ])

        if (!cancelled) {
          setConfig(configRes.data || null)
          setInitialData(dataRes.data || null)
        }
      } catch (error) {
        if (!cancelled) {
          setVillageError(error.message || 'Gemeindedaten konnten nicht geladen werden.')
          setConfig(null)
          setInitialData(null)
        }
      } finally {
        if (!cancelled) {
          setIsVillageLoading(false)
        }
      }
    }

    loadVillageData()
    return () => {
      cancelled = true
    }
  }, [selectedVillageId])

  const selectedVillage = useMemo(
    () => villages.find((village) => String(village.villageId) === selectedVillageId) || null,
    [villages, selectedVillageId]
  )
  const activeSection = useMemo(
    () => USER_SECTIONS.find((section) => section.id === activeSectionId) || USER_SECTIONS[0],
    [activeSectionId]
  )

  const features = config?.features || {}
  const visibility = config?.sensorDetailVisibility || {}
  const sensors = initialData?.sensors || []
  const messages = initialData?.messages || []
  const rideshares = initialData?.rideshares || []

  const renderTabContent = () => {
    if (!selectedVillageId) {
      return (
        <section className="public-dashboard-empty">
          <h3>Bitte Gemeinde auswaehlen</h3>
        </section>
      )
    }

    if (isVillageLoading) {
      return (
        <section className="public-loading">
          <p>Gemeindedaten werden geladen...</p>
        </section>
      )
    }

    if (villageError) {
      return (
        <section className="public-error" role="alert">
          <p>{villageError}</p>
        </section>
      )
    }

    if (activeSection.id === 'map') {
      if (features.map === false) {
        return <SectionNotice text="Die Karte wurde vom Administrator deaktiviert." />
      }

      return (
        <section className="village-section village-map-section">
          <h3>Karte</h3>
          <PublicMapPanel
            zipCode={config?.postalCode?.zipCode}
            city={config?.postalCode?.city}
            sensors={sensors}
            rideshares={rideshares}
          />
        </section>
      )
    }

    if (activeSection.id === 'sensors') {
      if (features.sensorData === false) {
        return <SectionNotice text="Sensordaten wurden vom Administrator deaktiviert." />
      }

      return (
        <section className="village-section">
          <h3>Sensoren</h3>
          {sensors.length === 0 ? (
            <p className="village-section-empty">Keine Sensoren verfuegbar.</p>
          ) : (
            <div className="sensor-card-grid">
              {sensors.map((sensor) => (
                <div key={sensor.id} className="sensor-card">
                  {visibility.name !== false ? <h4 className="sensor-card-name">{sensor.name}</h4> : null}
                  {visibility.type !== false ? <p className="sensor-card-type">{sensor.type}</p> : null}
                  {sensor.lastReading ? (
                    <div className="sensor-card-reading">
                      <span className="sensor-card-value">{sensor.lastReading.value}</span>
                      <span className="sensor-card-unit">{sensor.unit}</span>
                    </div>
                  ) : (
                    <p className="sensor-card-no-data">Keine Messwerte</p>
                  )}
                  {visibility.coordinates !== false && sensor.latitude != null && sensor.longitude != null ? (
                    <p className="sensor-card-coords">
                      {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      )
    }

    if (activeSection.id === 'info') {
      return (
        <div className="public-info-grid">
          {features.messages === false ? (
            <SectionNotice text="Nachrichten wurden vom Administrator deaktiviert." />
          ) : (
            <section className="village-section">
              <h3>Nachrichten</h3>
              {messages.length === 0 ? (
                <p className="village-section-empty">Keine Nachrichten vorhanden.</p>
              ) : (
                <ul className="message-list">
                  {messages.map((msg) => (
                    <li key={msg.id} className={`message-item message-priority-${msg.priority}`}>
                      <p className="message-text">{msg.text}</p>
                      <time className="message-time">{new Date(msg.createdAt).toLocaleString('de-DE')}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {features.rideShare === false ? (
            <SectionNotice text="Mitfahrbaenke wurden vom Administrator deaktiviert." />
          ) : (
            <section className="village-section">
              <h3>Mitfahrbaenke</h3>
              {rideshares.length === 0 ? (
                <p className="village-section-empty">Keine Mitfahrbank-Daten vorhanden.</p>
              ) : (
                <div className="rideshare-card-grid">
                  {rideshares.map((rs) => (
                    <div key={rs.id} className="rideshare-card">
                      <h4 className="rideshare-card-name">{rs.name}</h4>
                      {rs.description ? <p className="rideshare-card-description">{rs.description}</p> : null}
                      <p className="rideshare-card-count">
                        {rs.personCount} {rs.personCount === 1 ? 'Person' : 'Personen'} wartend
                        {rs.maxCapacity != null ? ` (max. ${rs.maxCapacity})` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )
    }

    if (activeSection.id === 'settings') {
      return (
        <section className="village-section public-settings-panel">
          <h3>Einstellungen</h3>

          <div className="admin-form-grid">
            <label>
              Theme-Modus
              <select
                value={prefs.themeMode}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    themeMode: event.target.value,
                  }))
                }
              >
                <option value="light">Hell</option>
                <option value="dark">Dunkel</option>
              </select>
            </label>

            <label>
              Kontrast
              <select
                value={prefs.contrast}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    contrast: event.target.value,
                  }))
                }
              >
                <option value="standard">Standard</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
              </select>
            </label>

            <label>
              Icon-Set
              <select
                value={prefs.iconSet}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    iconSet: event.target.value,
                  }))
                }
              >
                <option value="default">Standard</option>
                <option value="outlined">Outlined</option>
                <option value="rounded">Rounded</option>
              </select>
            </label>
          </div>

          <div className="public-settings-summary">
            <p>Aktuelle Gemeinde: {selectedVillage?.name || '-'}</p>
            <p>Karte: {features.map === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Sensordaten: {features.sensorData === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Nachrichten: {features.messages === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Mitfahrbaenke: {features.rideShare === false ? 'Deaktiviert' : 'Aktiv'}</p>
          </div>
        </section>
      )
    }

    return (
      <section className="village-section public-departures-panel">
        <h3>Abfahrplaene</h3>

        <div className="public-departure-grid">
          {DEPARTURE_PLACEHOLDERS.map((departure) => (
            <article key={departure.id} className="public-departure-card">
              <span className="public-departure-line">{departure.line}</span>
              <h4>{departure.destination}</h4>
              <p>{departure.time}</p>
              <small>{departure.platform}</small>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <main className="admin-page public-user-page">
      <header className="admin-header public-user-header">
        <div className="admin-header-content">
          <div className="admin-header-title-row">
            <h1>Buergerportal</h1>
          </div>
        </div>
        <div className="public-village-picker public-village-picker--header">
          <label htmlFor="public-village-select">Gemeinde</label>
          <select
            id="public-village-select"
            value={selectedVillageId}
            onChange={(event) => setSelectedVillageId(event.target.value)}
            disabled={isVillagesLoading}
          >
            <option value="">Bitte auswaehlen</option>
            {villages.map((village) => (
              <option key={village.villageId} value={String(village.villageId)}>
                {village.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="admin-layout public-user-layout">
        <aside className="admin-sidebar public-user-sidebar">
          <nav className="admin-nav" aria-label="Nutzer Navigation">
            {USER_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`admin-nav-button${activeSection.id === section.id ? ' active' : ''}`}
                onClick={() => setActiveSectionId(section.id)}
                aria-pressed={activeSection.id === section.id}
              >
                <span className="admin-nav-button-content">
                  <UserNavIcon sectionId={section.id} />
                  <span>{section.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className={`admin-main-content public-user-main${activeSection.id === 'map' ? ' is-map-home' : ''}`}>
          {villagesError ? (
            <section className="public-error" role="alert">
              <p>{villagesError}</p>
            </section>
          ) : null}

          {activeSection.id !== 'map' ? (
            <header className="admin-section-header">
              <h2>{activeSection.title}</h2>
            </header>
          ) : null}

          {renderTabContent()}

          {activeSection.id !== 'map' ? (
            <footer className="app-footer public-user-footer">
              Gemeinde: {selectedVillage?.name || 'nicht ausgewaehlt'}
            </footer>
          ) : null}
        </section>
      </div>
    </main>
  )
}
