import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'
import {
  buildMarkers,
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
const MAP_VIEW_STATE_PREFIX = 'smart-village-admin-map-view'
const MAP_FILTER_DEBUG_ENABLED =
  import.meta.env.DEV && (import.meta.env.VITE_MAP_FILTER_DEBUG ?? 'true') !== 'false'
const APP_PIN_PATH =
  'M430,560L530,560L530,360L505,360L505,300L455,300L455,360L430,360L430,560Z M480,774Q602,662 661,570.5Q720,479 720,408Q720,299 650.5,229.5Q581,160 480,160Q379,160 309.5,229.5Q240,299 240,408Q240,479 299,570.5Q358,662 480,774ZM480,880Q319,743 239.5,625.5Q160,508 160,408Q160,258 256.5,169Q353,80 480,80Q607,80 703.5,169Q800,258 800,408Q800,508 720.5,625.5Q641,743 480,880Z'
const iconCache = new Map()
const getPinIcon = (color, variant) => {
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
const GATEWAY_PIN_ICON = getPinIcon('#1f2937', 'gateway')

function toMapViewStorageKey(userSub, villageId) {
  const userKey = userSub ?? 'anonymous'
  const villageKey = villageId ?? 'unknown'
  return `${MAP_VIEW_STATE_PREFIX}:${userKey}:${villageKey}`
}

function parseMapViewState(storageKey) {
  if (!storageKey) return null
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      isPanelOpen: parsed?.isPanelOpen === true,
      autoIncludeNew: parsed?.autoIncludeNew === true,
      selection: {
        controllers: new Set(Array.isArray(parsed?.controllers) ? parsed.controllers : []),
        sensors: new Set(Array.isArray(parsed?.sensors) ? parsed.sensors : []),
      },
    }
  } catch {
    return null
  }
}

function persistMapViewState(storageKey, state) {
  if (!storageKey) return
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        isPanelOpen: state.isPanelOpen === true,
        autoIncludeNew: state.autoIncludeNew !== false,
        controllers: [...state.selection.controllers],
        sensors: [...state.selection.sensors],
      })
    )
  } catch {
    // Ignore storage errors so map interaction remains functional.
  }
}

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
  autoIncludeNew,
  onAutoIncludeNewChange,
  onShowOnlySensors,
  onShowOnlyGateways,
  onResetSelection,
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
        <span className="map-tree-name map-tree-name--gateway">Neue Sensoren/Gateways automatisch anzeigen</span>
        <input
          type="checkbox"
          checked={autoIncludeNew}
          onChange={(event) => onAutoIncludeNewChange(event.target.checked)}
          aria-label="Neue Sensoren und Gateways automatisch anzeigen"
        />
      </label>
      <div className="map-tree-actions" role="group" aria-label="Schnellaktionen für Kartenfilter">
        <button type="button" className="map-tree-action-btn" onClick={onShowOnlySensors}>
          Nur Sensoren
        </button>
        <button type="button" className="map-tree-action-btn" onClick={onShowOnlyGateways}>
          Nur Gateways
        </button>
        <button type="button" className="map-tree-action-btn" onClick={onResetSelection}>
          Reset
        </button>
      </div>
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

export default function MapPanel({ general, sensors = [], devices = [], villageId, userSub }) {
  const storageKey = useMemo(() => toMapViewStorageKey(userSub, villageId), [userSub, villageId])
  const initialMapViewState = useMemo(() => parseMapViewState(storageKey), [storageKey])
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState(() => {
    if (initialMapViewState?.selection) {
      return initialMapViewState.selection
    }
    return {
      controllers: new Set(devices.map((device) => device.id)),
      sensors: new Set(sensors.map((sensor) => sensor.id)),
    }
  })
  const [isPanelOpen, setIsPanelOpen] = useState(initialMapViewState?.isPanelOpen === true)
  const [autoIncludeNew, setAutoIncludeNew] = useState(initialMapViewState?.autoIncludeNew === true)
  const [selectionInitialized, setSelectionInitialized] = useState(
    Boolean(initialMapViewState?.selection)
  )
  const [hydratedStorageKey, setHydratedStorageKey] = useState(storageKey)
  const [lastUserAction, setLastUserAction] = useState('init')
  const [lastUserActionAt, setLastUserActionAt] = useState(null)
  const [lastPersistedAt, setLastPersistedAt] = useState(null)
  const [persistCount, setPersistCount] = useState(0)
  const hydratedStorageKeyRef = useRef(storageKey)
  const knownControllerIdsRef = useRef(new Set())
  const knownSensorIdsRef = useRef(new Set())

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
    setHydratedStorageKey(null)
    hydratedStorageKeyRef.current = null
    knownControllerIdsRef.current = new Set()
    knownSensorIdsRef.current = new Set()
    const persisted = parseMapViewState(storageKey)
    const currentControllerIds = new Set(devices.map((device) => device.id))
    const currentSensorIds = new Set(sensors.map((sensor) => sensor.id))

    if (persisted?.selection) {
      setSelection(persisted.selection)
      setIsPanelOpen(persisted.isPanelOpen === true)
      setAutoIncludeNew(persisted.autoIncludeNew === true)
      setSelectionInitialized(true)
      // Treat currently loaded IDs as already known on remount.
      // This prevents auto-include from turning everything back on after tab switches.
      knownControllerIdsRef.current = currentControllerIds
      knownSensorIdsRef.current = currentSensorIds
      setHydratedStorageKey(storageKey)
      hydratedStorageKeyRef.current = storageKey
      return
    }

    setSelection({ controllers: new Set(), sensors: new Set() })
    setIsPanelOpen(false)
    setAutoIncludeNew(false)
    setSelectionInitialized(false)
    knownControllerIdsRef.current = currentControllerIds
    knownSensorIdsRef.current = currentSensorIds
    setHydratedStorageKey(storageKey)
    hydratedStorageKeyRef.current = storageKey
  }, [storageKey, devices, sensors])

  useEffect(() => {
    if (selectionInitialized) return
    if (devices.length === 0 && sensors.length === 0) return

    setSelection((prev) => {
      if (prev.controllers.size > 0 || prev.sensors.size > 0) {
        return prev
      }
      return {
        controllers: new Set(devices.map((device) => device.id)),
        sensors: new Set(sensors.map((sensor) => sensor.id)),
      }
    })
    knownControllerIdsRef.current = new Set(devices.map((device) => device.id))
    knownSensorIdsRef.current = new Set(sensors.map((sensor) => sensor.id))
    setSelectionInitialized(true)
  }, [devices, sensors, selectionInitialized])

  useEffect(() => {
    setSelection((prev) => {
      const nextControllers = new Set(prev.controllers)
      const nextSensors = new Set(prev.sensors)

      const knownControllers = knownControllerIdsRef.current
      const knownSensors = knownSensorIdsRef.current

      if (autoIncludeNew) {
        devices.forEach((device) => {
          const isNewController = !knownControllers.has(device.id)
          if (isNewController) {
            nextControllers.add(device.id)
          }
        })
        sensors.forEach((sensor) => {
          const isNewSensor = !knownSensors.has(sensor.id)
          if (isNewSensor) {
            nextSensors.add(sensor.id)
          }
        })
      }

      knownControllerIdsRef.current = new Set(devices.map((device) => device.id))
      knownSensorIdsRef.current = new Set(sensors.map((sensor) => sensor.id))

      const unchanged =
        nextControllers.size === prev.controllers.size &&
        nextSensors.size === prev.sensors.size &&
        [...nextControllers].every((id) => prev.controllers.has(id)) &&
        [...nextSensors].every((id) => prev.sensors.has(id))

      if (unchanged) {
        return prev
      }

      return {
        controllers: nextControllers,
        sensors: nextSensors,
      }
    })
  }, [devices, sensors, autoIncludeNew])

  useEffect(() => {
    if (hydratedStorageKey !== storageKey) return
    persistMapViewState(storageKey, { selection, isPanelOpen, autoIncludeNew })
    setLastPersistedAt(new Date().toISOString())
    setPersistCount((prev) => prev + 1)
  }, [storageKey, selection, isPanelOpen, autoIncludeNew, hydratedStorageKey])

  const updateSelectionFromUser = (action, updater) => {
    setSelection((prev) => updater(prev))
    setLastUserAction(action)
    setLastUserActionAt(new Date().toISOString())
  }

  const updatePanelOpenFromUser = (nextOpen) => {
    setIsPanelOpen(nextOpen)
    setLastUserAction(nextOpen ? 'panel:open' : 'panel:close')
    setLastUserActionAt(new Date().toISOString())
  }

  const updateAutoIncludeNewFromUser = (enabled) => {
    setAutoIncludeNew(enabled)
    setLastUserAction(enabled ? 'autoInclude:on' : 'autoInclude:off')
    setLastUserActionAt(new Date().toISOString())
  }

  const embedUrl = useMemo(
    () => buildEmbedUrl(center.lat, center.lng),
    [center.lat, center.lng]
  )

  const markers = useMemo(
    () => buildMarkers({ sensors, devices, selection, includeControllers: true }),
    [sensors, devices, selection]
  )

  const debugState = useMemo(() => {
    if (!MAP_FILTER_DEBUG_ENABLED) return null
    const persisted = parseMapViewState(storageKey)
    const activeControllers = devices.filter((device) => selection.controllers.has(device.id)).length
    const activeSensors = sensors.filter((sensor) => selection.sensors.has(sensor.id)).length
    return {
      storageKey,
      hydratedStorageKey,
      hydratedStorageKeyRef: hydratedStorageKeyRef.current,
      selectionInitialized,
      autoIncludeNew,
      isPanelOpen,
      activeControllers,
      totalControllers: devices.length,
      activeSensors,
      totalSensors: sensors.length,
      lastUserAction,
      lastUserActionAt,
      lastPersistedAt,
      persistCount,
      knownControllersCount: knownControllerIdsRef.current.size,
      knownSensorsCount: knownSensorIdsRef.current.size,
      persistedSummary: persisted
        ? {
            isPanelOpen: persisted.isPanelOpen,
            autoIncludeNew: persisted.autoIncludeNew,
            controllersCount: persisted.selection.controllers.size,
            sensorsCount: persisted.selection.sensors.size,
          }
        : null,
    }
  }, [
    storageKey,
    hydratedStorageKey,
    selectionInitialized,
    autoIncludeNew,
    isPanelOpen,
    devices,
    sensors,
    selection.controllers,
    selection.sensors,
    lastUserAction,
    lastUserActionAt,
    lastPersistedAt,
    persistCount,
  ])

  const handleToggleController = (controllerId) => {
    updateSelectionFromUser(`toggle:controller:${controllerId}`, (prev) =>
      toggleControllerSelection(controllerId, sensors, prev)
    )
  }

  const handleToggleSensor = (sensorId) => {
    updateSelectionFromUser(`toggle:sensor:${sensorId}`, (prev) =>
      toggleSensorSelection(sensorId, sensors, prev)
    )
  }

  const selectedControllerCount = useMemo(
    () => devices.reduce((count, device) => (selection.controllers.has(device.id) ? count + 1 : count), 0),
    [devices, selection.controllers]
  )
  const selectedSensorCount = useMemo(
    () => sensors.reduce((count, sensor) => (selection.sensors.has(sensor.id) ? count + 1 : count), 0),
    [sensors, selection.sensors]
  )
  const totalSelectableCount = devices.length + sensors.length
  const selectedCount = selectedControllerCount + selectedSensorCount
  const allSelected = totalSelectableCount > 0 && selectedCount === totalSelectableCount
  const partiallySelected = selectedCount > 0 && selectedCount < totalSelectableCount

  const handleToggleAll = () => {
    if (allSelected) {
      updateSelectionFromUser('toggle:all:off', () => ({
        controllers: new Set(),
        sensors: new Set(),
      }))
      return
    }

    updateSelectionFromUser('toggle:all:on', () => ({
      controllers: new Set(devices.map((device) => device.id)),
      sensors: new Set(sensors.map((sensor) => sensor.id)),
    }))
  }

  const handleShowOnlySensors = () => {
    updateSelectionFromUser('quick:onlySensors', () => ({
      controllers: new Set(),
      sensors: new Set(sensors.map((sensor) => sensor.id)),
    }))
  }

  const handleShowOnlyGateways = () => {
    updateSelectionFromUser('quick:onlyGateways', () => ({
      controllers: new Set(devices.map((device) => device.id)),
      sensors: new Set(),
    }))
  }

  const handleResetSelection = () => {
    updateSelectionFromUser('quick:reset', () => ({
      controllers: new Set(devices.map((device) => device.id)),
      sensors: new Set(sensors.map((sensor) => sensor.id)),
    }))
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
            autoIncludeNew={autoIncludeNew}
            onAutoIncludeNewChange={updateAutoIncludeNewFromUser}
            onShowOnlySensors={handleShowOnlySensors}
            onShowOnlyGateways={handleShowOnlyGateways}
            onResetSelection={handleResetSelection}
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
            onClick={() => updatePanelOpenFromUser(!isPanelOpen)}
          >
            <span className="map-toggle-icon">
              <VisibilityIcon visible={isPanelOpen} />
            </span>
            <span>Sensor Filter</span>
          </button>
          <div className="map-ui-layer" aria-hidden="true">
            {MAP_FILTER_DEBUG_ENABLED && debugState ? (
              <div className="map-debug-overlay" role="note" aria-label="Map filter debug state">
                <h5>Map Filter Debug</h5>
                <p>Key: {debugState.storageKey}</p>
                <p>Hydrated: {String(debugState.hydratedStorageKey === debugState.storageKey)}</p>
                <p>User action: {debugState.lastUserAction || 'none'}</p>
                <p>Action at: {debugState.lastUserActionAt || 'n/a'}</p>
                <p>Persisted at: {debugState.lastPersistedAt || 'n/a'} ({debugState.persistCount})</p>
                <p>
                  Active: G {debugState.activeControllers}/{debugState.totalControllers}, S {debugState.activeSensors}/{debugState.totalSensors}
                </p>
                <p>
                  Known IDs: G {debugState.knownControllersCount}, S {debugState.knownSensorsCount}
                </p>
                <p>
                  Stored: {debugState.persistedSummary ? `G ${debugState.persistedSummary.controllersCount}, S ${debugState.persistedSummary.sensorsCount}` : 'none'}
                </p>
                <p>Auto-include: {String(debugState.autoIncludeNew)}</p>
              </div>
            ) : null}
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
