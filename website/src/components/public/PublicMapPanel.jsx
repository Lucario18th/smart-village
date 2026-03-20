import React, { useEffect, useMemo, useState, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'
import {
  buildMarkers,
  buildSelectionState,
  toggleSensorSelection,
} from '../../utils/mapViewUtils'
import { renderMapPinGlyph, resolveMapPinIcon } from '../../utils/mapPinGlyphs'

const MAP_TEXT = {
  de: {
    visibleSensorsTitle: 'Sichtbare Sensoren',
    filterHint: 'Filtere Sensoren und Mitfahrbänke für die Kartenansicht.',
    allSensors: 'Alle Sensoren',
    allSensorsAria: 'Alle Sensoren ein- oder ausschalten',
    noTimestamp: 'Keine Zeitangabe',
    waitingLabel: 'Wartende',
    people: 'Personen',
    noMeasurement: 'Keine Messung',
    mapAria: 'Gemeindekarte',
    cityCenter: 'Gemeindezentrum',
    hideFilter: 'Sensor Filter ausblenden',
    showFilter: 'Sensor Filter einblenden',
    filterButton: 'Sensor Filter',
    legendAria: 'Legende',
    legendTitle: 'Legende',
    legendCity: 'Gemeindezentrum',
    legendLow: 'Sensor niedrig',
    legendMedium: 'Sensor mittel',
    legendHigh: 'Sensor hoch',
    legendRideShare: 'Mitfahrbank 0',
    legendNoValue: 'Ohne Messwert',
  },
  en: {
    visibleSensorsTitle: 'Visible sensors',
    filterHint: 'Filter sensors and rideshare benches for map view.',
    allSensors: 'All sensors',
    allSensorsAria: 'Toggle all sensors on or off',
    noTimestamp: 'No timestamp',
    waitingLabel: 'Waiting',
    people: 'people',
    noMeasurement: 'No measurement',
    mapAria: 'Village map',
    cityCenter: 'Village center',
    hideFilter: 'Hide sensor filter',
    showFilter: 'Show sensor filter',
    filterButton: 'Sensor filter',
    legendAria: 'Legend',
    legendTitle: 'Legend',
    legendCity: 'Village center',
    legendLow: 'Sensor low',
    legendMedium: 'Sensor medium',
    legendHigh: 'Sensor high',
    legendRideShare: 'Rideshare bench 0',
    legendNoValue: 'No reading',
  },
  fr: {
    visibleSensorsTitle: 'Capteurs visibles',
    filterHint: 'Filtrez les capteurs et bancs de covoiturage sur la carte.',
    allSensors: 'Tous les capteurs',
    allSensorsAria: 'Activer ou désactiver tous les capteurs',
    noTimestamp: 'Aucun horodatage',
    waitingLabel: 'En attente',
    people: 'personnes',
    noMeasurement: 'Aucune mesure',
    mapAria: 'Carte de la commune',
    cityCenter: 'Centre communal',
    hideFilter: 'Masquer le filtre capteurs',
    showFilter: 'Afficher le filtre capteurs',
    filterButton: 'Filtre capteurs',
    legendAria: 'Légende',
    legendTitle: 'Légende',
    legendCity: 'Centre communal',
    legendLow: 'Capteur faible',
    legendMedium: 'Capteur moyen',
    legendHigh: 'Capteur élevé',
    legendRideShare: 'Banc covoiturage 0',
    legendNoValue: 'Sans mesure',
  },
}

const DATE_LOCALES = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
}

const BASE_MAP_ZOOM = 13
const APP_PIN_PATH =
  'M430,560L530,560L530,360L505,360L505,300L455,300L455,360L430,360L430,560Z M480,774Q602,662 661,570.5Q720,479 720,408Q720,299 650.5,229.5Q581,160 480,160Q379,160 309.5,229.5Q240,299 240,408Q240,479 299,570.5Q358,662 480,774ZM480,880Q319,743 239.5,625.5Q160,508 160,408Q160,258 256.5,169Q353,80 480,80Q607,80 703.5,169Q800,258 800,408Q800,508 720.5,625.5Q641,743 480,880Z'
const iconCache = new Map()

function getPinIcon(color, variant, glyphIcon = null) {
  const iconKey = glyphIcon?.key || 'default'
  const key = `${variant}-${color}-${iconKey}`
  if (iconCache.has(key)) {
    return iconCache.get(key)
  }

  const isCity = variant === 'city'
  const size = isCity ? 42 : 30
  const anchorX = Math.round(size / 2)
  const anchorY = Math.round(size * 0.92)
  const glyphMarkup = isCity ? '' : renderMapPinGlyph(glyphIcon, color)
  const pinIcon = L.divIcon({
    className: `map-leaflet-pin map-leaflet-pin--${variant}`,
    html: `<svg class="map-pin-svg" viewBox="0 0 960 960" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path fill="${color}" d="${APP_PIN_PATH}"/></svg>${glyphMarkup}`,
    iconSize: [size, size],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, -Math.round(size * 0.8)],
  })

  iconCache.set(key, pinIcon)
  return pinIcon
}

const CITY_PIN_ICON = getPinIcon('#ff2d55', 'city')

function MapViewportSync({ center, zoom = BASE_MAP_ZOOM }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true })
  }, [map, center.lat, center.lng, zoom])

  return null
}

function MarkerPopupContent({ marker, text, dateLocale }) {
  const lastUpdate = marker.lastTs
    ? new Date(marker.lastTs).toLocaleString(dateLocale)
    : text.noTimestamp

  const valueLabel =
    marker.kind === 'mitfahrbank'
      ? `${text.waitingLabel}: ${marker.value ?? '-'} ${text.people}`
      : marker.value !== null && marker.value !== undefined
        ? `${marker.value} ${marker.unit || ''}`
        : text.noMeasurement

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

function SensorSelectionTree({ sensors, selection, onToggleSensor, allSelected, onToggleAll, text }) {
  return (
    <div className="map-tree" aria-label={text.visibleSensorsTitle}>
      <h3>{text.visibleSensorsTitle}</h3>
      <p className="map-tree-hint">{text.filterHint}</p>
      <label className="map-tree-item map-tree-item--master">
        <span className="map-tree-name map-tree-name--gateway">{text.allSensors}</span>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          aria-label={text.allSensorsAria}
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

export default function PublicMapPanel({
  zipCode,
  city,
  sensors = [],
  rideshares = [],
  locale = 'de',
  selectedSensorId = null,
  onSensorDeselect = () => {},
}) {
  const text = MAP_TEXT[locale] || MAP_TEXT.de
  const dateLocale = DATE_LOCALES[locale] || DATE_LOCALES.de
  const mapRef = useRef(null)
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [zoom, setZoom] = useState(BASE_MAP_ZOOM)
  const [selection, setSelection] = useState(() => buildSelectionState([], []))
  const [isPanelOpen, setIsPanelOpen] = useState(false)

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
    setSelection((prev) => buildSelectionState([], normalizedSensors, prev))
  }, [normalizedSensors])

  useEffect(() => {
    if (!selectedSensorId) {
      setZoom(BASE_MAP_ZOOM)
      return
    }

    const sensor = normalizedSensors.find((s) => s.id === selectedSensorId)
    if (!sensor || sensor.latitude == null || sensor.longitude == null) return

    setCenter({ lat: sensor.latitude, lng: sensor.longitude })
    setZoom(16)
  }, [selectedSensorId, normalizedSensors])

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
            text={text}
          />
        ) : null}

        <div className="map-frame" role="region" aria-label={text.mapAria}>
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            minZoom={5}
            maxZoom={19}
            scrollWheelZoom
            className="map-leaflet"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportSync center={center} zoom={zoom} />

            <Marker position={[center.lat, center.lng]} icon={CITY_PIN_ICON} zIndexOffset={1200}>
              <Popup>
                <strong>{zipCode || city ? `${zipCode || ''} ${city || ''}`.trim() : text.cityCenter}</strong>
              </Popup>
            </Marker>

            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={getPinIcon(
                  marker.color || '#7c3aed',
                  marker.kind === 'mitfahrbank' ? 'mitfahrbank' : 'sensor',
                  resolveMapPinIcon(marker)
                )}
              >
                <Popup>
                  <MarkerPopupContent marker={marker} text={text} dateLocale={dateLocale} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <button
            type="button"
            className="map-toggle-button map-toggle-button--in-map"
            aria-pressed={isPanelOpen}
            aria-label={isPanelOpen ? text.hideFilter : text.showFilter}
            onClick={() => setIsPanelOpen((prev) => !prev)}
          >
            <span className="map-toggle-icon">
              <VisibilityIcon visible={isPanelOpen} />
            </span>
            <span>{text.filterButton}</span>
          </button>

          <div className="map-ui-layer" aria-hidden="true">
            <div className="map-legend-overlay" aria-label={text.legendAria}>
              <h4>{text.legendTitle}</h4>
              <ul>
                <li>
                  <span className="legend-dot" style={{ background: '#ff2d55' }} /> {text.legendCity}
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#0077ff' }} /> {text.legendLow}
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#ff9f1a' }} /> {text.legendMedium}
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#d90429' }} /> {text.legendHigh}
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#00a651' }} /> {text.legendRideShare}
                </li>
                <li>
                  <span className="legend-dot" style={{ background: '#7c3aed' }} /> {text.legendNoValue}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
