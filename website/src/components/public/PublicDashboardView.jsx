import React, { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../api/client'
import { applyThemeToDOM, getThemeClass } from '../../config/themeManager'
import { useMqttLiveReadings } from '../../hooks/useMqttLiveReadings'
import PublicMapPanel from './PublicMapPanel'

const PUBLIC_PREFS_KEY = 'smart-village-public-preferences'
const PUBLIC_LAST_VILLAGE_KEY = 'smart-village-public-last-village-id'
const PUBLIC_REFRESH_INTERVAL_MS =
  Number.parseInt(import.meta.env?.VITE_PUBLIC_REFRESH_INTERVAL_MS ?? '5000', 10) || 5000

const DEFAULT_PREFS = {
  themeMode: 'light',
  contrast: 'standard',
  iconSet: 'default',
}

const USER_SECTIONS = [
  { id: 'map', label: 'Home', title: 'Startseite' },
  { id: 'sensors', label: 'Sensoren', title: 'Sensoren' },
  { id: 'weather', label: 'Wetter', title: 'Wetter' },
  { id: 'messages', label: 'Nachrichten', title: 'Nachrichten' },
  { id: 'rideshare', label: 'Mitfahrbank', title: 'Mitfahrbaenke' },
  { id: 'events', label: 'Events', title: 'Veranstaltungen' },
  { id: 'textile', label: 'Container', title: 'Altkleidercontainer' },
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

function loadLastVillageId() {
  try {
    return localStorage.getItem(PUBLIC_LAST_VILLAGE_KEY) || ''
  } catch {
    return ''
  }
}

function persistLastVillageId(villageId) {
  try {
    if (!villageId) {
      localStorage.removeItem(PUBLIC_LAST_VILLAGE_KEY)
      return
    }
    localStorage.setItem(PUBLIC_LAST_VILLAGE_KEY, String(villageId))
  } catch {
    // ignore storage write errors
  }
}

function UserNavIcon({ sectionId }) {
  const icons = {
    map: 'M3 6.6 9 4l6 2.4L21 4v13.4L15 20l-6-2.4L3 20V6.6Zm12 11.2V8.2l-6-2.4v9.6l6 2.4Z',
    sensors: 'M12 2a6 6 0 0 1 6 6h-2a4 4 0 1 0-8 0H6a6 6 0 0 1 6-6Zm0 5a1.5 1.5 0 0 1 1.5 1.5h2a3.5 3.5 0 1 0-7 0h2A1.5 1.5 0 0 1 12 7Zm0 4.5a3 3 0 0 1 3 3V20h-6v-5.5a3 3 0 0 1 3-3Z',
    weather: 'M6 17h11a4 4 0 1 0-.8-7.9A5.5 5.5 0 0 0 5.6 11 3 3 0 0 0 6 17Z',
    messages: 'M4 5h16v10H7l-3 3V5Zm3 3v2h10V8H7Zm0 3v2h7v-2H7Z',
    rideshare: 'M3 15.5 8 12l4 3 9-6v4.5L12 20l-9-4.5v-0Z',
    events: 'M4 20V10h3v10H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z',
    textile: 'M5 4h14v16H5V4Zm3 3v10h8V7H8Zm2 2h4v2h-4V9Z',
    settings: 'm12 3 2 3.5 4 .8-2.8 2.7.7 4-3.9-2-3.8 2 .7-4L6 7.3l4-.8L12 3Zm-7 14h14v2H5v-2Z',
  }

  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={icons[sectionId] || icons.settings} />
    </svg>
  )
}

export default function PublicDashboardView({ initialVillageId = null }) {
  const [villages, setVillages] = useState([])
  const [isVillagesLoading, setIsVillagesLoading] = useState(true)
  const [villagesError, setVillagesError] = useState(null)

  const [selectedVillageId, setSelectedVillageId] = useState(() =>
    initialVillageId ? String(initialVillageId) : loadLastVillageId()
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
    if (isVillagesLoading || villages.length === 0) return

    const availableIds = new Set(villages.map((village) => String(village.villageId)))
    if (selectedVillageId && availableIds.has(selectedVillageId)) {
      return
    }

    const lastVillageId = loadLastVillageId()
    if (lastVillageId && availableIds.has(lastVillageId)) {
      setSelectedVillageId(lastVillageId)
      return
    }

    if (availableIds.has('1')) {
      setSelectedVillageId('1')
      return
    }

    setSelectedVillageId(String(villages[0].villageId))
  }, [isVillagesLoading, villages, selectedVillageId])

  useEffect(() => {
    persistLastVillageId(selectedVillageId)
  }, [selectedVillageId])

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

  const villageStatusText = (config?.statusText || '').trim()
  const villageInfoText = (config?.infoText || '').trim()

  const features = config?.features || {}
  const visibility = config?.sensorDetailVisibility || {}
  const sensors = initialData?.sensors || []
  const messages = initialData?.messages || []
  const rideshares = initialData?.rideshares || []
  const weatherEntries = initialData?.weather || []
  const events = initialData?.events || []
  const textileContainers = initialData?.textileContainers || []

  // Live-MQTT: direkt vom Broker, ohne Backend-Polling
  const liveReadings = useMqttLiveReadings(!!selectedVillageId)

  // Überschreibt lastReading mit dem jeweils neuesten MQTT-Wert
  const liveSensors = useMemo(
    () =>
      sensors.map((sensor) => {
        const live = liveReadings[sensor.id]
        return live ? { ...sensor, lastReading: live } : sensor
      }),
    [sensors, liveReadings]
  )

  const enabledSections = useMemo(() => {
    if (!selectedVillageId || !config) {
      return USER_SECTIONS
    }

    return USER_SECTIONS.filter((section) => {
      if (section.id === 'map') return features.map !== false
      if (section.id === 'sensors') return features.sensorData !== false
      if (section.id === 'weather') return features.weather === true
      if (section.id === 'messages') return features.messages !== false
      if (section.id === 'rideshare') return features.rideShare !== false
      if (section.id === 'events') return features.events === true
      if (section.id === 'textile') return features.textileContainers === true
      return true
    })
  }, [selectedVillageId, config, features])

  useEffect(() => {
    if (!enabledSections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(enabledSections[0]?.id || 'settings')
    }
  }, [enabledSections, activeSectionId])

  useEffect(() => {
    if (!selectedVillageId) return undefined

    let cancelled = false

    const refreshPublicData = async () => {
      try {
        const [configRes, dataRes] = await Promise.all([
          apiClient.appApi.getVillageConfig(selectedVillageId),
          apiClient.appApi.getVillageInitialData(selectedVillageId),
        ])

        if (cancelled) return
        setConfig(configRes.data || null)
        setInitialData(dataRes.data || null)
      } catch {
        // Keep last known public state if a refresh request fails.
      }
    }

    const interval = setInterval(refreshPublicData, PUBLIC_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [selectedVillageId])

  const activeSection = useMemo(
    () => enabledSections.find((section) => section.id === activeSectionId) || enabledSections[0] || USER_SECTIONS[0],
    [enabledSections, activeSectionId]
  )

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
      return (
        <section className="village-section village-map-section">
          <h3>Karte</h3>
          <PublicMapPanel
            zipCode={config?.postalCode?.zipCode}
            city={config?.postalCode?.city}
            sensors={liveSensors}
            rideshares={rideshares}
          />
        </section>
      )
    }

    if (activeSection.id === 'sensors') {
      return (
        <section className="village-section">
          <h3>Sensoren</h3>
          {liveSensors.length === 0 ? (
            <p className="village-section-empty">Keine Sensoren verfuegbar.</p>
          ) : (
            <div className="sensor-card-grid">
              {liveSensors.map((sensor) => (
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

    if (activeSection.id === 'weather') {
      return (
        <section className="village-section">
          <h3>Wetter</h3>
          {weatherEntries.length === 0 ? (
            <p className="village-section-empty">Keine Wetterdaten verfuegbar.</p>
          ) : (
            <div className="sensor-card-grid">
              {weatherEntries.map((entry) => (
                <div key={entry.id || entry.label} className="sensor-card">
                  <h4 className="sensor-card-name">{entry.label || 'Wetterwert'}</h4>
                  <div className="sensor-card-reading">
                    <span className="sensor-card-value">{entry.value}</span>
                    <span className="sensor-card-unit">{entry.unit || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )
    }

    if (activeSection.id === 'messages') {
      return (
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
      )
    }

    if (activeSection.id === 'rideshare') {
      return (
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
      )
    }

    if (activeSection.id === 'events') {
      return (
        <section className="village-section public-events-panel">
          <h3>Veranstaltungen</h3>
          {events.length === 0 ? (
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
          ) : (
            <ul className="message-list">
              {events.map((event) => (
                <li key={event.id} className="message-item message-priority-normal">
                  <p className="message-text">{event.title || event.name || 'Event'}</p>
                  {event.startAt ? (
                    <time className="message-time">{new Date(event.startAt).toLocaleString('de-DE')}</time>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    }

    if (activeSection.id === 'textile') {
      return (
        <section className="village-section">
          <h3>Altkleidercontainer</h3>
          {textileContainers.length === 0 ? (
            <p className="village-section-empty">Keine Containerdaten verfuegbar.</p>
          ) : (
            <div className="rideshare-card-grid">
              {textileContainers.map((container) => (
                <div key={container.id} className="rideshare-card">
                  <h4 className="rideshare-card-name">{container.name || 'Container'}</h4>
                  {container.description ? <p className="rideshare-card-description">{container.description}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      )
    }

    if (activeSection.id === 'settings') {
      return (
        <section className="village-section public-settings-panel">
          <section className="design-card">
            <div className="design-card-header">
              <h3 className="design-card-title">Farbschema</h3>
              <p className="design-card-hint">Wird automatisch gespeichert und beim naechsten Besuch wiederhergestellt.</p>
            </div>
            <div className="design-card-fields">
              <div className="design-select-field">
                <span className="design-select-label">Theme-Modus</span>
                <div className="design-toggle-group" role="group" aria-label="Theme-Modus">
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.themeMode === 'light' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        themeMode: 'light',
                      }))
                    }
                    aria-pressed={prefs.themeMode === 'light'}
                  >
                    Hell
                  </button>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.themeMode === 'dark' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        themeMode: 'dark',
                      }))
                    }
                    aria-pressed={prefs.themeMode === 'dark'}
                  >
                    Dunkel
                  </button>
                </div>
              </div>
              <div className="design-select-field">
                <span className="design-select-label">Kontrast</span>
                <div className="design-toggle-group" role="group" aria-label="Kontrast">
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.contrast === 'standard' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        contrast: 'standard',
                      }))
                    }
                    aria-pressed={prefs.contrast === 'standard'}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.contrast === 'high' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        contrast: 'high',
                      }))
                    }
                    aria-pressed={prefs.contrast === 'high'}
                  >
                    Hoch
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="public-settings-summary">
            <p>Aktuelle Gemeinde: {selectedVillage?.name || '-'}</p>
            <p>Karte: {features.map === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Sensordaten: {features.sensorData === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Wetter: {features.weather === true ? 'Aktiv' : 'Deaktiviert'}</p>
            <p>Nachrichten: {features.messages === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Mitfahrbaenke: {features.rideShare === false ? 'Deaktiviert' : 'Aktiv'}</p>
            <p>Events: {features.events === true ? 'Aktiv' : 'Deaktiviert'}</p>
            <p>Altkleidercontainer: {features.textileContainers === true ? 'Aktiv' : 'Deaktiviert'}</p>
          </div>
        </section>
      )
    }

    return null
  }

  return (
    <main className="admin-page public-user-page">
      <header className="admin-header public-user-header">
        <div className="admin-header-content">
          <div className="admin-header-title-row">
            <h1>Smart Village User</h1>
          </div>
          {selectedVillageId && (villageStatusText || villageInfoText) ? (
            <div className="public-user-header-meta" aria-label="Dorfinformationen kompakt">
              {villageStatusText ? <p className="public-user-header-status">Status: {villageStatusText}</p> : null}
              {villageInfoText ? <p className="public-user-header-info">{villageInfoText}</p> : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="admin-layout public-user-layout">
        <aside className="admin-sidebar public-user-sidebar">
          <nav className="admin-nav" aria-label="Nutzer Navigation">
            {enabledSections.map((section) => (
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
          <div className="admin-sidebar-actions public-user-sidebar-actions">
            <div className="public-village-picker public-village-picker--sidebar">
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
          </div>
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
