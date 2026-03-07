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

const STATIC_MAP_MAX_SIZE = 1280
const clampSize = (value) => Math.min(STATIC_MAP_MAX_SIZE, Math.max(320, Math.round(value)))

const buildStaticMapUrl = (center, size) => {
  const width = clampSize(size.width)
  const height = clampSize(size.height)
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=${DEFAULT_ZOOM}&size=${width}x${height}&maptype=mapnik`
}

function SelectionTree({ devices, sensors, selection, onToggleController, onToggleSensor }) {
  const orphanSensors = sensors.filter((sensor) => !sensor.deviceId)

  return (
    <div className="map-tree" aria-label="Sensor- und Controller-Auswahl">
      <h3>Sichtbare Sensoren</h3>
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

function VisibilityIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5C6.5 5 2 9.5 1 12c1 2.5 5.5 7 11 7s10-4.5 11-7c-1-2.5-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M2.7 1.3 1.3 2.7 5 6.4C3.2 7.8 1.8 9.6 1 12c1 2.5 5.5 7 11 7 2.4 0 4.6-.8 6.4-2.1l3 3 1.4-1.4L2.7 1.3ZM12 17c-3.8 0-7-2.8-8.7-5 1-1.6 2.4-3.2 4.2-4.2l1.8 1.8A4 4 0 0 0 14.4 15l2.5 2.5c-1.4.9-3.1 1.5-4.9 1.5Zm10.7-5c-.8 2-2.6 4.3-5.2 5.7l-1.5-1.5A4 4 0 0 0 10 10.3L8.1 8.4A10.8 10.8 0 0 1 12 7c3.8 0 7 2.8 8.7 5Z"
      />
    </svg>
  )
}

export default function MapPanel({ general, sensors = [], devices = [] }) {
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState(() => buildSelectionState(devices, sensors))
  const [activePopupId, setActivePopupId] = useState(null)
  const [mapSize, setMapSize] = useState({ width: 900, height: 420 })
  const mapRef = useRef(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [useEmbedFallback, setUseEmbedFallback] = useState(false)
  const [embedFailed, setEmbedFailed] = useState(false)

  const locationLabel =
    general?.zipCode && general?.city ? `${general.zipCode} ${general.city}` : ''

  useEffect(() => {
    let cancelled = false
    const zip = general?.zipCode || ''
    const city = general?.city || ''

    if (!zip && !city) {
      setCenter(FALLBACK_LOCATION)
      setError('')
      return
    }

    geocodeCity(zip, city)
      .then((coords) => {
        if (cancelled) return
        setCenter(coords)
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Geocoding failed', err)
        setCenter(FALLBACK_LOCATION)
        setError('Geokodierung fehlgeschlagen, Standardposition wird genutzt.')
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
      const availableHeight = Math.max(220, Math.round(entries[0].contentRect.height))
      const nextHeight = availableHeight
      setMapSize({ width: nextWidth, height: nextHeight })
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

  const embedUrl = useMemo(
    () => buildEmbedUrl(center.lat, center.lng),
    [center.lat, center.lng]
  )
  const staticMapUrl = useMemo(() => buildStaticMapUrl(center, mapSize), [center, mapSize])

  useEffect(() => {
    // If the static map URL changes (new size or center), retry loading the image
    setUseEmbedFallback(false)
    setEmbedFailed(false)
  }, [staticMapUrl])

  useEffect(() => {
    if (useEmbedFallback) {
      setEmbedFailed(true)
    }
  }, [useEmbedFallback])

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
      <div className="map-panel-header" id="map-panel-hint">
        {locationLabel ? (
          <p>
            <strong>{locationLabel}</strong>
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      {error ? <p className="map-panel-error">{error}</p> : null}

      <div className={`map-layout ${isPanelOpen ? 'map-layout--split' : 'map-layout--single'}`}>
        {isPanelOpen ? (
          <SelectionTree
            devices={devices}
            sensors={sensors}
            selection={selection}
            onToggleController={handleToggleController}
            onToggleSensor={handleToggleSensor}
          />
        ) : null}
        <div className="map-frame" role="region" aria-label="Gemeindekarte" ref={mapRef}>
          {useEmbedFallback ? (
            <div className="map-embed-wrapper" style={{ height: mapSize.height }}>
              <iframe
                title="Gemeindekarte"
                src={embedUrl}
                aria-describedby="map-panel-hint"
                style={{ border: 0, width: '100%', height: '100%' }}
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
                onLoad={() => setEmbedFailed(false)}
                onError={() => setEmbedFailed(true)}
              />
              {embedFailed ? (
                <div className="map-placeholder" aria-live="polite">
                  <p>Karte konnte nicht geladen werden.</p>
                  <p>Bitte Verbindung prüfen oder später erneut versuchen.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <img
                src={staticMapUrl}
                alt={`OpenStreetMap für ${locationLabel}`}
                width="100%"
                height={mapSize.height}
                style={{ display: 'block', borderRadius: 12 }}
                loading="lazy"
                onError={() => {
                  setUseEmbedFallback(true)
                  setEmbedFailed(true)
                }}
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
            </>
          )}
          <button
            type="button"
            className="map-toggle-button map-toggle-button--in-map"
            aria-pressed={isPanelOpen}
            aria-label={isPanelOpen ? 'Sensor Filter ausblenden' : 'Sensor Filter einblenden'}
            onClick={() => setIsPanelOpen((prev) => !prev)}
          >
            <span className="map-toggle-icon">
              <VisibilityIcon visible={isPanelOpen} />
            </span>
            <span>Sensor Filter</span>
          </button>
          <div className="map-ui-layer" aria-hidden="true">
            <div className="map-legend-overlay" aria-label="Legende">
              <h4>Legende</h4>
              <ul>
                <li>
                  <span className="legend-dot" style={{ background: '#2e7d32' }} /> Bank 0
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#f9a825' }} /> Bank 1-2
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#c62828' }} /> Bank 3+
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#42a5f5' }} /> Sensor niedrig
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#ffb300' }} /> Sensor mittel
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#ef5350' }} /> Sensor hoch
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
