import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'
import {
  buildMarkers,
  buildSelectionState,
  DEFAULT_ZOOM,
  getControllerSelectionState,
  projectToPoint,
  toggleControllerSelection,
  toggleSensorSelection,
} from '../../utils/mapViewUtils'

const buildEmbedUrl = (lat, lng) => {
  const delta = 0.03
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

const buildStaticMapUrl = (center, size) =>
  `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=${DEFAULT_ZOOM}&size=${Math.round(
    size.width,
  )}x${Math.round(size.height)}&maptype=mapnik`

function Legend() {
  return (
    <div className="map-legend">
      <h4>Legende</h4>
      <ul>
        <li>
          <span className="legend-dot" style={{ background: '#2e7d32' }} /> Mitfahrbank: 0 Wartende
        </li>
        <li>
          <span className="legend-dot" style={{ background: '#f9a825' }} /> Mitfahrbank: 1–2 Wartende
        </li>
        <li>
          <span className="legend-dot" style={{ background: '#c62828' }} /> Mitfahrbank: 3+
        </li>
        <li>
          <span className="legend-dot" style={{ background: '#42a5f5' }} /> Sensor: niedriger Wert
        </li>
        <li>
          <span className="legend-dot" style={{ background: '#ffb300' }} /> Sensor: mittlerer Wert
        </li>
        <li>
          <span className="legend-dot" style={{ background: '#ef5350' }} /> Sensor: hoher Wert
        </li>
      </ul>
    </div>
  )
}

function SelectionTree({ devices, sensors, selection, onToggleController, onToggleSensor }) {
  const orphanSensors = sensors.filter((sensor) => !sensor.deviceId)

  return (
    <div className="map-tree" aria-label="Sensor- und Controller-Auswahl">
      <h3>Sichtbare Elemente</h3>
      <p className="map-tree-hint">Controller schalten alle untergeordneten Sensoren ein/aus.</p>
      <ul className="map-tree-list">
        {devices.map((device) => {
          const state = getControllerSelectionState(device.id, sensors, selection)
          const childSensors = sensors.filter((sensor) => sensor.deviceId === device.id)
          return (
            <li key={device.id}>
              <label className="map-tree-item">
                <input
                  type="checkbox"
                  checked={state.checked}
                  ref={(el) => {
                    if (el) el.indeterminate = state.indeterminate
                  }}
                  onChange={() => onToggleController(device.id)}
                />
                <span className="map-tree-label">
                  {device.name || device.deviceId || 'Controller'}{' '}
                  <span className="map-tree-meta">
                    {childSensors.length} {childSensors.length === 1 ? 'Sensor' : 'Sensoren'}
                  </span>
                </span>
              </label>
              {childSensors.length > 0 ? (
                <ul className="map-tree-sensors">
                  {childSensors.map((sensor) => (
                    <li key={sensor.id}>
                      <label className="map-tree-item sensor">
                        <input
                          type="checkbox"
                          checked={selection.sensors.has(sensor.id)}
                          onChange={() => onToggleSensor(sensor.id)}
                        />
                        <span className="map-tree-label">
                          {sensor.name}{' '}
                          <span className="map-tree-meta">{sensor.type || 'Sensor'}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
        {orphanSensors.length > 0 ? (
          <li>
            <p className="map-tree-group-label">Sensoren ohne Controller</p>
            <ul className="map-tree-sensors">
              {orphanSensors.map((sensor) => (
                <li key={sensor.id}>
                  <label className="map-tree-item sensor">
                    <input
                      type="checkbox"
                      checked={selection.sensors.has(sensor.id)}
                      onChange={() => onToggleSensor(sensor.id)}
                    />
                    <span className="map-tree-label">
                      {sensor.name}{' '}
                      <span className="map-tree-meta">{sensor.type || 'Sensor'}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

function Marker({ marker, position, onClick }) {
  const isMitfahrbank = marker.kind === 'mitfahrbank'
  const isController = marker.kind === 'controller'
  return (
    <button
      type="button"
      className={`map-marker${isController ? ' controller' : ''}${isMitfahrbank ? ' mitfahrbank' : ''}`}
      style={{ left: position.left, top: position.top, background: marker.color }}
      onClick={() => onClick(marker.id)}
      aria-label={`${marker.label} auswählen`}
    >
      {isMitfahrbank ? '🪑' : isController ? '📡' : '•'}
    </button>
  )
}

function MarkerPopup({ marker, position, onClose }) {
  const lastUpdate = marker.lastTs
    ? new Date(marker.lastTs).toLocaleString('de-DE')
    : 'Keine Zeitangabe'
  const valueLabel =
    marker.kind === 'mitfahrbank'
      ? `Wartende: ${marker.value ?? '–'} Personen`
      : marker.value !== null && marker.value !== undefined
        ? `${marker.value} ${marker.unit || ''}`
        : 'Keine Messung'

  return (
    <div className="map-popup" style={{ left: position.left, top: position.top }}>
      <div className="map-popup-header">
        <div>
          <strong>{marker.label}</strong>
          <p className="map-popup-sub">
            {marker.type}
            {marker.controllerName ? ` · ${marker.controllerName}` : ''}
          </p>
        </div>
        <button type="button" className="map-popup-close" onClick={onClose} aria-label="Popup schließen">
          ×
        </button>
      </div>
      <p className="map-popup-value">
        {valueLabel} · <span className="map-popup-ts">{lastUpdate}</span>
      </p>
    </div>
  )
}

export default function MapPanel({ general, sensors = [], devices = [] }) {
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [isFallback, setIsFallback] = useState(true)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState(() => buildSelectionState(devices, sensors))
  const [activePopupId, setActivePopupId] = useState(null)
  const [mapSize, setMapSize] = useState({ width: 900, height: 520 })
  const mapRef = useRef(null)

  const locationLabel =
    general?.zipCode && general?.city ? `${general.zipCode} ${general.city}` : 'Lörrach (Fallback)'

  useEffect(() => {
    let cancelled = false
    const zip = general?.zipCode || ''
    const city = general?.city || ''

    if (!zip && !city) {
      setCenter(FALLBACK_LOCATION)
      setIsFallback(true)
      setError('')
      return
    }

    geocodeCity(zip, city)
      .then((coords) => {
        if (cancelled) return
        setCenter(coords)
        setIsFallback(false)
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Geocoding failed', err)
        setCenter(FALLBACK_LOCATION)
        setIsFallback(true)
        setError('Geokodierung fehlgeschlagen, Fallback wird genutzt.')
      })

    return () => {
      cancelled = true
    }
  }, [general?.zipCode, general?.city])

  useEffect(() => {
    setSelection((prev) => buildSelectionState(devices, sensors, prev))
  }, [devices, sensors])

  useEffect(() => {
    const el = mapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.max(320, Math.round(entries[0].contentRect.width))
      const nextHeight = Math.max(320, Math.round(nextWidth * 0.62))
      setMapSize({ width: nextWidth, height: nextHeight })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const embedUrl = useMemo(
    () => buildEmbedUrl(center.lat, center.lng),
    [center.lat, center.lng]
  )
  const staticMapUrl = useMemo(() => buildStaticMapUrl(center, mapSize), [center, mapSize])

  const markers = useMemo(
    () => buildMarkers({ sensors, devices, selection, includeControllers: true }),
    [sensors, devices, selection]
  )

  const positions = useMemo(() => {
    return markers.reduce((acc, marker) => {
      acc[marker.id] = projectToPoint(marker.lat, marker.lng, center, mapSize)
      return acc
    }, {})
  }, [markers, center, mapSize])

  const handleToggleController = (controllerId) => {
    setSelection((prev) => toggleControllerSelection(controllerId, sensors, prev))
  }

  const handleToggleSensor = (sensorId) => {
    setSelection((prev) => toggleSensorSelection(sensorId, sensors, prev))
  }

  const activeMarker = markers.find((marker) => marker.id === activePopupId)
  const activePosition = activeMarker ? positions[activeMarker.id] : null

  return (
    <section className="map-panel">
      <p className="map-panel-hint" id="map-panel-hint">
        OpenStreetMap-Karte der Gemeinde. Mittelpunkt{' '}
        <strong>{locationLabel}</strong>{' '}
        <span aria-label="Koordinaten">
          ({center.lat.toFixed(4)}, {center.lng.toFixed(4)})
        </span>
        {isFallback ? ' – Fallback wird genutzt, weil keine Geodaten gefunden wurden.' : ''}
      </p>
      {error ? <p className="map-panel-error">{error}</p> : null}

      <div className="map-layout">
        <SelectionTree
          devices={devices}
          sensors={sensors}
          selection={selection}
          onToggleController={handleToggleController}
          onToggleSensor={handleToggleSensor}
        />
        <div className="map-frame" role="region" aria-label="Gemeindekarte" ref={mapRef}>
          <img
            src={staticMapUrl}
            alt={`OpenStreetMap für ${locationLabel}`}
            width="100%"
            height={mapSize.height}
            style={{ display: 'block', borderRadius: 12 }}
            loading="lazy"
          />
          <div className="map-overlay" style={{ width: mapSize.width, height: mapSize.height }}>
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                marker={marker}
                position={positions[marker.id]}
                onClick={setActivePopupId}
              />
            ))}
            {activeMarker && activePosition ? (
              <MarkerPopup
                marker={activeMarker}
                position={activePosition}
                onClose={() => setActivePopupId(null)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Legend />

      <p className="map-panel-meta">
        <a
          href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=13/${center.lat}/${center.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          In OpenStreetMap öffnen
        </a>{' '}
        ·{' '}
        <a href={embedUrl} target="_blank" rel="noreferrer">
          OSM Embed
        </a>
      </p>
    </section>
  )
}
