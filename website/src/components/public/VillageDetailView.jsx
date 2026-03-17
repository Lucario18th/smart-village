import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import PublicMapPanel from './PublicMapPanel'

function SensorCard({ sensor, visibility }) {
  return (
    <div className="sensor-card">
      {visibility.name !== false ? (
        <h4 className="sensor-card-name">{sensor.name}</h4>
      ) : null}
      {visibility.type !== false ? (
        <p className="sensor-card-type">{sensor.type}</p>
      ) : null}
      {visibility.description !== false && sensor.description ? (
        <p className="sensor-card-description">{sensor.description}</p>
      ) : null}
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
  )
}

export default function VillageDetailView({ villageId }) {
  const [config, setConfig] = useState(null)
  const [initialData, setInitialData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadVillage() {
      try {
        const [configRes, dataRes] = await Promise.all([
          apiClient.appApi.getVillageConfig(villageId),
          apiClient.appApi.getVillageInitialData(villageId),
        ])
        if (!cancelled) {
          setConfig(configRes.data || null)
          setInitialData(dataRes.data || null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Gemeindedaten konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadVillage()
    return () => {
      cancelled = true
    }
  }, [villageId])

  if (isLoading) {
    return (
      <div className="public-loading">
        <p>Daten werden geladen…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-error" role="alert">
        <p>{error}</p>
        <Link to="/" className="public-back-link">← Zurück zur Übersicht</Link>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="public-empty">
        <p>Gemeinde nicht gefunden.</p>
        <Link to="/" className="public-back-link">← Zurück zur Übersicht</Link>
      </div>
    )
  }

  const features = config.features || {}
  const visibility = config.sensorDetailVisibility || {}
  const sensors = initialData?.sensors || config.sensors || []
  const customModules = initialData?.modules || config.modules || []
  const messages = initialData?.messages || []
  const rideshares = initialData?.rideshares || []
  const canShowMap = features.map !== false
  const canShowSensors = features.sensorData !== false
  const canShowMessages = features.messages !== false
  const canShowRideShare = features.rideShare !== false

  // Sensor-IDs, die einem Custom-Modul zugeordnet sind
  const moduleSensorIds = useMemo(
    () => new Set(customModules.flatMap((m) => m.sensorIds)),
    [customModules]
  )

  // Sensoren ohne Modul-Zuordnung (allgemeiner Bereich)
  const unassignedSensors = useMemo(
    () => sensors.filter((s) => !moduleSensorIds.has(s.id)),
    [sensors, moduleSensorIds]
  )

  return (
    <div className="village-detail">
      <Link to="/" className="public-back-link">← Zurück zur Übersicht</Link>

      <div className="village-detail-header">
        <h2 className="village-detail-name">{config.name}</h2>
        {config.locationName ? (
          <p className="village-detail-location">{config.locationName}</p>
        ) : null}
        {config.postalCode ? (
          <p className="village-detail-postal">
            {config.postalCode.zipCode} {config.postalCode.city}
          </p>
        ) : null}
      </div>

      {canShowMap ? (
        <section className="village-section village-map-section">
          <h3>Karte</h3>
          <PublicMapPanel
            zipCode={config.postalCode?.zipCode}
            city={config.postalCode?.city}
            sensors={sensors}
            rideshares={rideshares}
          />
        </section>
      ) : null}

      {canShowSensors ? (
        <>
          {customModules.map((mod) => {
            const modSensors = sensors.filter((s) => mod.sensorIds.includes(s.id))
            return (
              <section key={mod.id} className="village-section village-module-section">
                <h3 className="village-module-title">{mod.name}</h3>
                {mod.description ? (
                  <p className="village-module-description">{mod.description}</p>
                ) : null}
                {modSensors.length === 0 ? (
                  <p className="village-section-empty">Keine Sensoren für dieses Modul verfügbar.</p>
                ) : (
                  <div className="sensor-card-grid">
                    {modSensors.map((sensor) => (
                      <SensorCard key={sensor.id} sensor={sensor} visibility={visibility} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {unassignedSensors.length > 0 ? (
            <section className="village-section">
              <h3>Sensoren</h3>
              <div className="sensor-card-grid">
                {unassignedSensors.map((sensor) => (
                  <SensorCard key={sensor.id} sensor={sensor} visibility={visibility} />
                ))}
              </div>
            </section>
          ) : sensors.length === 0 ? (
            <section className="village-section">
              <h3>Sensoren</h3>
              <p className="village-section-empty">Keine Sensoren verfügbar.</p>
            </section>
          ) : null}
        </>
      ) : null}

      {canShowMessages ? (
        <section className="village-section">
          <h3>Nachrichten</h3>
          {messages.length === 0 ? (
            <p className="village-section-empty">Keine Nachrichten vorhanden.</p>
          ) : (
            <ul className="message-list">
              {messages.map((msg) => (
                <li key={msg.id} className={`message-item message-priority-${msg.priority}`}>
                  <p className="message-text">{msg.text}</p>
                  <time className="message-time">
                    {new Date(msg.createdAt).toLocaleString('de-DE')}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canShowRideShare ? (
        <section className="village-section">
          <h3>Mitfahrbänke</h3>
          {rideshares.length === 0 ? (
            <p className="village-section-empty">Keine Mitfahrbank-Daten vorhanden.</p>
          ) : (
            <div className="rideshare-card-grid">
              {rideshares.map((rs) => (
                <div key={rs.id} className="rideshare-card">
                  <h4 className="rideshare-card-name">{rs.name}</h4>
                  {rs.description ? (
                    <p className="rideshare-card-description">{rs.description}</p>
                  ) : null}
                  <p className="rideshare-card-count">
                    {rs.personCount} {rs.personCount === 1 ? 'Person' : 'Personen'} wartend
                    {rs.maxCapacity != null ? ` (max. ${rs.maxCapacity})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
