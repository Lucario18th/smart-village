import React, { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'
import {
  buildMarkers,
  buildSelectionState,
  getControllerSelectionState,
  toggleControllerSelection,
  toggleSensorSelection,
} from '../../utils/mapViewUtils'

const buildEmbedUrl = (lat, lng) => {
  const delta = 0.03
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

const BASE_MAP_ZOOM = 13
const iconCache = new Map()
const getPinIcon = (color, variant) => {
  const key = `${variant}-${color}`
  if (iconCache.has(key)) {
    return iconCache.get(key)
  }

  const isCity = variant === 'city'
  const icon = L.divIcon({
    className: `map-leaflet-pin map-leaflet-pin--${variant}`,
    html: `<span class="map-leaflet-pin-dot" style="background:${color}"></span>`,
    iconSize: isCity ? [30, 44] : [22, 34],
    iconAnchor: isCity ? [15, 44] : [11, 34],
    popupAnchor: isCity ? [0, -36] : [0, -28],
  })

  iconCache.set(key, icon)
  return icon
}

const CITY_PIN_ICON = getPinIcon('#ff2d55', 'city')
const GATEWAY_PIN_ICON = getPinIcon('#1f2937', 'gateway')

function MapViewportSync({ center, panelOpen }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true })
  }, [map, center.lat, center.lng])

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 180)
    return () => window.clearTimeout(timer)
  }, [map, panelOpen])

  return null
}

function SelectionTree({
  devices,
  sensors,
  selection,
  onToggleController,
  onToggleSensor,
  allSelected,
  partiallySelected,
  onToggleAll,
}) {
  const [expandedGateways, setExpandedGateways] = useState(() => new Set(devices.map((d) => d.id)))

  useEffect(() => {
    setExpandedGateways((prev) => {
      const next = new Set()
      devices.forEach((device) => {
        if (prev.has(device.id)) {
          next.add(device.id)
        }
      })
      if (next.size === 0 && devices[0]?.id) {
        next.add(devices[0].id)
      }
      return next
    })
  }, [devices])

  const toggleGateway = (deviceId) => {
    setExpandedGateways((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) {
        next.delete(deviceId)
      } else {
        next.add(deviceId)
      }
      return next
    })
  }

  const orphanSensors = sensors.filter((sensor) => !sensor.deviceId)

  return (
    <div className="map-tree" aria-label="Sensor- und Controller-Auswahl">
      <h3>Sichtbare Sensoren</h3>
      <p className="map-tree-hint">Gateway- und Sensor-Toggles können unabhängig voneinander gesteuert werden.</p>
      <label className="map-tree-item map-tree-item--master">
        <span className="map-tree-name map-tree-name--gateway">Alle Sensoren und Gateways</span>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = partiallySelected
          }}
          onChange={onToggleAll}
          aria-label="Alle Sensoren und Gateways ein- oder ausschalten"
        />
      </label>
      <ul className="map-tree-list">
        {devices.map((device) => {
          const state = getControllerSelectionState(device.id, sensors, selection)
          const childSensors = sensors.filter((sensor) => sensor.deviceId === device.id)
          const isExpanded = expandedGateways.has(device.id)
          return (
            <li key={device.id} className="map-tree-group">
              <div className="map-tree-group-head">
                <div className="map-tree-group-main">
                  <label className="map-tree-item map-tree-item--gateway">
                    <span className="map-tree-name map-tree-name--gateway">{device.name || device.deviceId || 'Controller'}</span>
                    <input
                      type="checkbox"
                      checked={state.checked}
                      ref={(el) => {
                        if (el) el.indeterminate = state.indeterminate
                      }}
                      onChange={() => onToggleController(device.id)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="map-tree-expand"
                  aria-label={isExpanded ? 'Sensoren einklappen' : 'Sensoren ausklappen'}
                  aria-expanded={isExpanded}
                  onClick={() => toggleGateway(device.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d={isExpanded ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                  </svg>
                </button>
              </div>
              {childSensors.length > 0 && isExpanded ? (
                <ul className="map-tree-sensors">
                  {childSensors.map((sensor) => (
                    <li key={sensor.id}>
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
              ) : null}
            </li>
          )
        })}
        {orphanSensors.length > 0 ? (
          <li className="map-tree-group map-tree-group--orphan">
            <p className="map-tree-group-label">Sensoren ohne Controller</p>
            <ul className="map-tree-sensors">
              {orphanSensors.map((sensor) => (
                <li key={sensor.id}>
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
          </li>
        ) : null}
      </ul>
    </div>
  )
}

function MarkerPopupContent({ marker }) {
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
    <div className="map-popup-content">
      <strong>{marker.label}</strong>
      <p className="map-popup-sub">
        {marker.type}
        {marker.controllerName ? ` · ${marker.controllerName}` : ''}
      </p>
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
  const [isPanelOpen, setIsPanelOpen] = useState(false)

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

  const embedUrl = useMemo(
    () => buildEmbedUrl(center.lat, center.lng),
    [center.lat, center.lng]
  )

  const markers = useMemo(
    () => buildMarkers({ sensors, devices, selection, includeControllers: true }),
    [sensors, devices, selection]
  )

  const handleToggleController = (controllerId) => {
    setSelection((prev) => toggleControllerSelection(controllerId, sensors, prev))
  }

  const handleToggleSensor = (sensorId) => {
    setSelection((prev) => toggleSensorSelection(sensorId, sensors, prev))
  }

  const totalSelectableCount = devices.length + sensors.length
  const selectedCount = selection.controllers.size + selection.sensors.size
  const allSelected = totalSelectableCount > 0 && selectedCount === totalSelectableCount
  const partiallySelected = selectedCount > 0 && selectedCount < totalSelectableCount

  const handleToggleAll = () => {
    if (allSelected) {
      setSelection({ controllers: new Set(), sensors: new Set() })
      return
    }

    setSelection({
      controllers: new Set(devices.map((device) => device.id)),
      sensors: new Set(sensors.map((sensor) => sensor.id)),
    })
  }

  return (
    <section className="map-panel">
      <div className={`map-layout ${isPanelOpen ? 'map-layout--split' : 'map-layout--single'}`}>
        {isPanelOpen ? (
          <SelectionTree
            devices={devices}
            sensors={sensors}
            selection={selection}
            onToggleController={handleToggleController}
            onToggleSensor={handleToggleSensor}
            allSelected={allSelected}
            partiallySelected={partiallySelected}
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
            <MapViewportSync center={center} panelOpen={isPanelOpen} />

            <Marker position={[center.lat, center.lng]} icon={CITY_PIN_ICON} zIndexOffset={1200}>
              <Popup>
                <strong>{locationLabel || 'Aktueller Ort'}</strong>
              </Popup>
            </Marker>

            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={
                  marker.kind === 'controller'
                    ? GATEWAY_PIN_ICON
                    : getPinIcon(marker.color || '#7c3aed', marker.kind === 'mitfahrbank' ? 'mitfahrbank' : 'sensor')
                }
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
                  <span className="legend-dot" style={{ background: '#ff2d55' }} /> Aktuelle Stadt
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#1f2937' }} /> Gateway
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
                  <span className="legend-dot" style={{ background: '#7c3aed' }} /> Sensor ohne Messwert
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
