import React, { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'

export default function VillageListView() {
  const [villages, setVillages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadVillages() {
      try {
        const response = await apiClient.appApi.getVillages()
        if (!cancelled) {
          setVillages(response.data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Gemeinden konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadVillages()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="public-loading">
        <p>Gemeinden werden geladen…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-error" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  if (villages.length === 0) {
    return (
      <div className="public-empty">
        <p>Keine Gemeinden verfügbar.</p>
      </div>
    )
  }

  return (
    <div className="village-list">
      <h2 className="village-list-title">Gemeinden</h2>
      <p className="village-list-subtitle">Wählen Sie eine Gemeinde, um aktuelle Informationen zu sehen.</p>
      <div className="village-card-grid">
        {villages.map((village) => (
          <a
            key={village.villageId}
            href={`/village/${village.villageId}`}
            className="village-card"
          >
            <h3 className="village-card-name">{village.name}</h3>
            {village.locationName ? (
              <p className="village-card-location">{village.locationName}</p>
            ) : null}
            {village.postalCode ? (
              <p className="village-card-postal">
                {village.postalCode.zipCode} {village.postalCode.city}
              </p>
            ) : null}
            <div className="village-card-meta">
              <span className="village-card-sensor-count">
                {village.sensorCount} {village.sensorCount === 1 ? 'Sensor' : 'Sensoren'}
              </span>
            </div>
            {village.features ? (
              <div className="village-card-features">
                {village.features.map ? <span className="feature-badge">Karte</span> : null}
                {village.features.sensorData ? <span className="feature-badge">Sensoren</span> : null}
                {village.features.messages ? <span className="feature-badge">Nachrichten</span> : null}
                {village.features.rideShare ? <span className="feature-badge">Mitfahrbänke</span> : null}
              </div>
            ) : null}
            <span className="village-card-action">Öffnen →</span>
          </a>
        ))}
      </div>
    </div>
  )
}
