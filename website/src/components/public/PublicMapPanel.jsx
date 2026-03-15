import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'
import {
  buildMarkers,
  buildSelectionState,
  defaultSelectionState,
  toggleSensorSelection,
} from '../../utils/mapViewUtils'

function loadSelectionFromStorage(storageKey) {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const sensors = Array.isArray(parsed?.sensors) ? parsed.sensors : []

    return {
      controllers: new Set(),
      sensors: new Set(sensors),
    }
  } catch (error) {
    console.warn('Public map selection could not be restored from localStorage', error)
    return null
  }
}

function saveSelectionToStorage(storageKey, selection) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        sensors: [...selection.sensors],
      })
    )
  } catch (error) {
    console.warn('Public map selection could not be saved to localStorage', error)
  }
}

const BASE_MAP_ZOOM = 13
const APP_PIN_PATH =
  'M430,560L530,560L530,360L505,360L505,300L455,300L455,360L430,360L430,560Z M480,774Q602,662 661,570.5Q720,479 720,408Q720,299 650.5,229.5Q581,160 480,160Q379,160 309.5,229.5Q240,299 240,408Q240,479 299,570.5Q358,662 480,774ZM480,880Q319,743 239.5,625.5Q160,508 160,408Q160,258 256.5,169Q353,80 480,80Q607,80 703.5,169Q800,258 800,408Q800,508 720.5,625.5Q641,743 480,880Z'
const iconCache = new Map()

function getPinIcon(color, variant) {
  const key = `${variant}-${color}`
  if (iconCache.has(key)) {
    return iconCache.get(key)
  }

  const isCity = variant === 'city'
  const size = isCity ? 42 : 30
  const anchorX = Math.round(size / 2)
  const anchorY = Math.round(size * 0.92)
  const icon = L.divIcon({
    className: `map-leaflet-pin map-leaflet-pin--${variant}`,
    html: `<svg class="map-pin-svg" viewBox="0 0 960 960" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="${color}" d="${APP_PIN_PATH}"/></svg>`,
    iconSize: [size, size],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, -Math.round(size * 0.8)],
  })

  iconCache.set(key, icon)
  return icon
}

const CITY_PIN_ICON = getPinIcon('#ff2d55', 'city')

function MapViewportSync({ center }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true })
  }, [map, center.lat, center.lng])

  return null
}

function MarkerPopupContent({ marker }) {
  const lastUpdate = marker.lastTs
    ? new Date(marker.lastTs).toLocaleString('de-DE')
    : 'Keine Zeitangabe'

  const valueLabel =
    marker.kind === 'mitfahrbank'
      ? `Wartende: ${marker.value ?? '-'} Personen`
      : marker.value !== null && marker.value !== undefined
        ? `${marker.value} ${marker.unit || ''}`
        : 'Keine Messung'

  return (
    <div className="map-popup-content">
      <strong>{marker.label}</strong>
      <p className="map-popup-sub">{marker.type}</p>
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

function SensorSelectionTree({ sensors, selection, onToggleSensor, allSelected, onToggleAll }) {
  return (
    <div className="map-tree" aria-label="Sichtbare Sensoren">
      <h3>Sichtbare Sensoren</h3>
      <p className="map-tree-hint">Filtere Sensoren und Mitfahrbaenke fuer die Kartenansicht.</p>
      <label className="map-tree-item map-tree-item--master">
        <span className="map-tree-name map-tree-name--gateway">Alle Sensoren</span>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          aria-label="Alle Sensoren ein- oder ausschalten"
        />
      </label>
      <ul className="map-tree-list">
        {sensors.map((sensor) => (
          <li key={sensor.id} className="map-tree-group">
            <label className="map-tree-item sensor">
              <span className="map-tree-name">{sensor.name}</span>
              <input
                type="checkbox"
                checked={selection.sensors.has(sensor.id)}
                onChange={() => onToggleSensor(sensor.id)}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PublicMapPanel({ zipCode, city, sensors = [], rideshares = [] }) {
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [selection, setSelection] = useState(() => buildSelectionState([], []))
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const hydratedStorageKeyRef = useRef(null)

  const storageKey = useMemo(() => {
    const villageIdentifier = `${zipCode || ''}-${city || ''}` || 'default'
    return `sv:map-selection:public:${villageIdentifier}`
  }, [zipCode, city])

  const normalizedSensors = useMemo(() => {
    const sensorItems = sensors.map((sensor) => ({
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      unit: sensor.unit,
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      deviceId: sensor.deviceId ?? null,
      kind: sensor.type === 'Mitfahrbank' ? 'mitfahrbank' : 'sensor',
      waitingCount: sensor.type === 'Mitfahrbank' ? sensor.lastReading?.value ?? null : null,
      lastValue: sensor.lastReading?.value ?? null,
      lastTs: sensor.lastReading?.ts ?? null,
    }))

    const rideshareItems = rideshares.map((rs) => ({
      id: `rideshare-${rs.id}`,
      name: rs.name,
      type: 'Mitfahrbank',
      unit: 'Personen',
      latitude: rs.latitude,
      longitude: rs.longitude,
      deviceId: null,
      kind: 'mitfahrbank',
      waitingCount: rs.personCount,
      lastValue: rs.personCount,
      lastTs: null,
    }))

    return [...sensorItems, ...rideshareItems]
  }, [rideshares, sensors])

  useEffect(() => {
    let cancelled = false

    if (!zipCode && !city) {
      setCenter(FALLBACK_LOCATION)
      return
    }

    geocodeCity(zipCode, city)
      .then((coords) => {
        if (cancelled) return
        setCenter(coords)
      })
      .catch(() => {
        if (cancelled) return
        setCenter(FALLBACK_LOCATION)
      })

    return () => {
      cancelled = true
    }
  }, [zipCode, city])

  useEffect(() => {
    if (hydratedStorageKeyRef.current !== storageKey) {
      const restoredSelection = loadSelectionFromStorage(storageKey)
      setSelection(
        buildSelectionState(
          [],
          normalizedSensors,
          restoredSelection || defaultSelectionState
        )
      )
      hydratedStorageKeyRef.current = storageKey
      return
    }

    setSelection((prev) => buildSelectionState([], normalizedSensors, prev))
  }, [storageKey, normalizedSensors])

  useEffect(() => {
    if (hydratedStorageKeyRef.current !== storageKey) return
    saveSelectionToStorage(storageKey, selection)
  }, [storageKey, selection])

  const markers = useMemo(
    () => buildMarkers({ sensors: normalizedSensors, devices: [], selection, includeControllers: false }),
    [normalizedSensors, selection]
  )

  const handleToggleSensor = (sensorId) => {
    setSelection((prev) => toggleSensorSelection(sensorId, normalizedSensors, prev))
  }

  const allSelected =
    normalizedSensors.length > 0 && selection.sensors.size === normalizedSensors.length

  const handleToggleAll = () => {
    if (allSelected) {
      setSelection({ controllers: new Set(), sensors: new Set() })
      return
    }

    setSelection({
      controllers: new Set(),
      sensors: new Set(normalizedSensors.map((sensor) => sensor.id)),
    })
  }

  return (
    <section className="map-panel public-map-panel">
      <div className={`map-layout ${isPanelOpen ? 'map-layout--split' : 'map-layout--single'}`}>
        {isPanelOpen ? (
          <SensorSelectionTree
            sensors={normalizedSensors}
            selection={selection}
            onToggleSensor={handleToggleSensor}
            allSelected={allSelected}
            onToggleAll={handleToggleAll}
          />
        ) : null}

        <div className="map-frame" role="region" aria-label="Gemeindekarte">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={BASE_MAP_ZOOM}
            minZoom={5}
            maxZoom={19}
            scrollWheelZoom
            className="map-leaflet"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportSync center={center} />

            <Marker position={[center.lat, center.lng]} icon={CITY_PIN_ICON} zIndexOffset={1200}>
              <Popup>
                <strong>{zipCode || city ? `${zipCode || ''} ${city || ''}`.trim() : 'Gemeindezentrum'}</strong>
              </Popup>
            </Marker>

            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={getPinIcon(marker.color || '#7c3aed', marker.kind === 'mitfahrbank' ? 'mitfahrbank' : 'sensor')}
              >
                <Popup>
                  <MarkerPopupContent marker={marker} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

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
                  <span className="legend-dot" style={{ background: '#ff2d55' }} /> Gemeindezentrum
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#0077ff' }} /> Sensor niedrig
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#ff9f1a' }} /> Sensor mittel
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#d90429' }} /> Sensor hoch
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#00a651' }} /> Mitfahrbank 0
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#7c3aed' }} /> Ohne Messwert
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
