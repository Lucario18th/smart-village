import React, { useState, useMemo } from 'react'
// import { isMitfahrbankSensor } from '../../hooks/useVillageConfig'
import { isMitfahrbankSensor } from '../../../hooks/useVillageConfig'
import CoordinatePicker from './CoordinatePicker'


function formatCoords(lat, lng) {
  if (lat === '' || lng === '' || lat === null || lng === null || lat === undefined || lng === undefined) {
    return null
  }
  const numLat = Number(lat)
  const numLng = Number(lng)
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null
  return `${numLat.toFixed(4)}, ${numLng.toFixed(4)}`
}

function formatStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return 'Ausstehend'
    case 'ACTIVE':
      return 'Aktiv'
    case 'INACTIVE':
      return 'Inaktiv'
    default:
      return status
  }
}

function formatTimestamp(ts) {
  if (!ts) return '–'
  try {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(ts))
  } catch (e) {
    return '–'
  }
}

function getStatusColor(status) {
  if (!status || status === 'OK') return '#2e7d32'
  if (status === 'WARN') return '#f9a825'
  if (status === 'ERROR' || status === 'CRITICAL') return '#c62828'
  return '#546e7a'
}

function DeviceRow({ device, onEdit, sensorCount, isExpanded, onToggleSensors }) {
  const coords = formatCoords(device.latitude, device.longitude)
  return (
    <div className="sensor-row">
      <div>
        <h4>
          {device.name || 'Controller'}
          {device.discovered ? <span className="badge-new">Neu</span> : null}
          {device.status && device.status !== 'ACTIVE' ? (
            <span className="badge-pending">{formatStatusLabel(device.status)}</span>
          ) : null}
        </h4>
        <p className="sensor-info">
          Geräte-ID: <strong>{device.deviceId}</strong>
        </p>
        <p className="sensor-description">
          Standort: <strong>{coords || 'Nicht gesetzt'}</strong>
        </p>
      </div>
      <div className="sensor-actions">
        <button type="button" className="sensor-action-btn sensor-edit-button" onClick={onEdit} title="Bearbeiten">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z"
            />
          </svg>
          <span>Bearbeiten</span>
        </button>
        <button
          type="button"
          className="sensor-action-btn sensor-expand-button"
          onClick={onToggleSensors}
          title={isExpanded ? 'Sensoren ausblenden' : 'Sensoren anzeigen'}
          aria-expanded={isExpanded}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d={isExpanded ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'}
            />
          </svg>
          <span>{isExpanded ? 'Sensoren ausblenden' : `Sensoren anzeigen (${sensorCount})`}</span>
        </button>
      </div>
    </div>
  )
}

function DeviceForm({ device, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    device || {
      deviceId: '',
      name: '',
      latitude: '',
      longitude: '',
    }
  )
  const [showMap, setShowMap] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMapPick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.deviceId.trim()) {
      alert('Bitte eine eindeutige Geräte-ID angeben')
      return
    }
    onSave(formData)
  }

  return (
    <form className="sensor-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="device-id">Geräte-ID</label>
        <input
          id="device-id"
          type="text"
          name="deviceId"
          value={formData.deviceId}
          onChange={handleChange}
          placeholder="z.B. controller-01"
          required
          disabled={!!device}
        />
      </div>
      <div className="form-group">
        <label htmlFor="device-name">Name (optional)</label>
        <input
          id="device-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="z.B. Rathaus-Controller"
        />
      </div>
      <div className="form-group">
        <div className="coord-label-row">
          <label>Koordinaten (optional)</label>
          <button
            type="button"
            className="coord-map-btn"
            onClick={() => setShowMap((v) => !v)}
            aria-expanded={showMap}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
            </svg>
            {showMap ? 'Karte schließen' : 'Auf Karte setzen'}
          </button>
        </div>
        <div className="coordinate-inputs">
          <input
            type="number"
            step="0.0001"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Breite (lat)"
          />
          <input
            type="number"
            step="0.0001"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Länge (lng)"
          />
        </div>
        {showMap && (
          <CoordinatePicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onChange={handleMapPick}
          />
        )}
        <small>Diese Position wird für alle Sensoren genutzt, sofern diese keine eigenen Koordinaten haben.</small>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-save">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm3-10H5V5h10v4Z"
            />
          </svg>
          <span>Speichern</span>
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3 1.42 1.41Z"
            />
          </svg>
          <span>Abbrechen</span>
        </button>
      </div>
    </form>
  )
}

const WAITING_LABEL = 'Wartende:'

function SensorRow({ sensor, sensorTypes, devices, onEdit, onToggleActive }) {
  const sensorType = sensorTypes.find(t => t.id === sensor.sensorTypeId)
  const device = devices.find((d) => d.id === sensor.deviceId)
  const sensorCoords = formatCoords(sensor.latitude, sensor.longitude)
  const deviceCoords = device ? formatCoords(device.latitude, device.longitude) : null
  const statusColor = getStatusColor(sensor.lastStatus || sensor.status)
  const isExposed = sensor.exposeToApp !== false
  const dimmed = !isExposed || sensor.dataStale === true
  const isMitfahrbank =
    sensor.kind === 'mitfahrbank' || isMitfahrbankSensor(sensorType?.name || '')
  const valueToShow = sensor.waitingCount ?? sensor.lastValue
  const valueLabel =
    valueToShow !== null && valueToShow !== undefined
      ? `${valueToShow} ${sensor.unit || sensorType?.unit || (isMitfahrbank ? 'Personen' : '')}`
      : 'Keine Messung'
  return (
    <div className={`sensor-row${dimmed ? ' sensor-row--inactive' : ''}`} style={dimmed ? { opacity: 0.65 } : undefined}>
      <div>
        <h4>
          {sensor.name}
          {sensor.discovered ? <span className="badge-new">Neu</span> : null}
          {sensor.status && sensor.status !== 'ACTIVE' ? (
            <span className="badge-pending">{formatStatusLabel(sensor.status)}</span>
          ) : null}
        </h4>
        <p className="sensor-info">
          Typ: <strong>{sensorType?.name || 'Unbekannt'}</strong> ({sensorType?.unit || '?'})
        </p>
        {sensor.infoText && <p className="sensor-description">{sensor.infoText}</p>}
        <div className="sensor-status">
          <span
            className="badge"
            role="status"
            aria-label={`Status ${sensor.lastStatus || 'OK'}`}
            style={{ backgroundColor: statusColor, color: '#fff' }}
          >
            {sensor.lastStatus || 'OK'}
          </span>
          {sensor.dataStale && (
            <span className="badge" style={{ backgroundColor: '#9e9e9e', color: '#fff' }} title="Keine neuen Daten seit mehr als 1 Minute">
              Keine Daten
            </span>
          )}
          <span className="sensor-last-value">
            {isMitfahrbank ? WAITING_LABEL : 'Letzter Wert:'} {valueLabel}
          </span>
          <span className="sensor-last-ts">· {formatTimestamp(sensor.lastTs)}</span>
        </div>
        <p className="sensor-description">
          Position:{' '}
          <strong>
            {sensorCoords || deviceCoords || 'Kein Standort hinterlegt'}
          </strong>
          {device ? ` · Controller: ${device.name || device.deviceId}` : ''}
        </p>
      </div>
      <div className="sensor-actions">
        <div className="sensor-toggle" title="In der App anzeigen">
          <span className="sensor-toggle-label">In App</span>
          <label className="switch-control">
            <input
              type="checkbox"
              aria-label="Sensor in der App anzeigen"
              checked={sensor.exposeToApp !== false}
              onChange={(e) => onToggleActive(e.target.checked)}
            />
            <span className="switch-slider" aria-hidden="true" />
          </label>
        </div>
        <button type="button" className="sensor-action-btn sensor-edit-button" onClick={onEdit} title="Metadaten bearbeiten">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z"
            />
          </svg>
          <span>Bearbeiten</span>
        </button>
      </div>
    </div>
  )
}

function SensorForm({ sensor, sensorTypes, devices, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    sensor
      ? {
          ...sensor,
          deviceId: sensor.deviceId ?? '',
          latitude: sensor.latitude ?? '',
          longitude: sensor.longitude ?? '',
          receiveData: sensor.receiveData !== false,
          exposeToApp: sensor.exposeToApp !== false,
        }
      : {
          name: '',
          sensorTypeId: sensorTypes[0]?.id || 1,
          infoText: '',
          exposeToApp: true,
          receiveData: true,
          dataSourceUrl: '',
          updateInterval: '300', // 5 minutes default
          deviceId: '',
          latitude: '',
          longitude: '',
        }
  )
  const [showMap, setShowMap] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleMapPick = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      alert('Sensornamen eingeben')
      return
    }
    const deviceIdValue =
      formData.deviceId === '' || formData.deviceId === null || formData.deviceId === undefined
        ? null
        : Number(formData.deviceId)
    onSave({
      ...formData,
      deviceId: Number.isFinite(deviceIdValue) ? deviceIdValue : null,
    })
  }

  return (
    <form className="sensor-form" onSubmit={handleSubmit}>
      <div className="sensor-form-header">
        <h4>Sensor bearbeiten</h4>
        <div className="sensor-form-switch" title="In der App anzeigen">
            <span className="sensor-form-switch-label">In App</span>
            <label className="switch-control" htmlFor="sensor-exposeToApp">
              <input
                id="sensor-exposeToApp"
                type="checkbox"
                name="exposeToApp"
                checked={formData.exposeToApp !== false}
                onChange={handleChange}
                aria-label="Sensor in der App anzeigen"
              />
              <span className="switch-slider" aria-hidden="true" />
            </label>
          </div>
      </div>

      <div className="form-group">
        <label htmlFor="sensor-name">Sensorname</label>
        <input
          id="sensor-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="z.B. Temperatur Rathaus"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="sensor-type">Sensortyp</label>
        <select
          id="sensor-type"
          name="sensorTypeId"
          value={formData.sensorTypeId}
          onChange={handleChange}
          disabled
          aria-describedby="sensor-type-helper"
        >
          {sensorTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.unit})
            </option>
          ))}
        </select>
        <small id="sensor-type-helper">Sensortyp wird über MQTT discovery gesetzt.</small>
      </div>

      <div className="form-group">
        <label htmlFor="sensor-info">Beschreibung</label>
        <textarea
          id="sensor-info"
          name="infoText"
          value={formData.infoText}
          onChange={handleChange}
          placeholder="Optionale Beschreibung..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="sensor-device">Controller/Gerät</label>
        <select
          id="sensor-device"
          name="deviceId"
          value={formData.deviceId ?? ''}
          onChange={handleChange}
          disabled
          aria-describedby="sensor-device-helper"
        >
          <option value="">Kein Controller</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name || device.deviceId} ({device.deviceId})
            </option>
          ))}
        </select>
        <small id="sensor-device-helper">Geräte werden automatisch über MQTT discovery angelegt.</small>
      </div>

      <div className="form-group">
        <div className="coord-label-row">
          <label>Sensor-Koordinaten (optional)</label>
          <button
            type="button"
            className="coord-map-btn"
            onClick={() => setShowMap((v) => !v)}
            aria-expanded={showMap}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
            </svg>
            {showMap ? 'Karte schließen' : 'Auf Karte setzen'}
          </button>
        </div>
        <div className="coordinate-inputs">
          <input
            type="number"
            name="latitude"
            step="0.0001"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Breite (lat)"
          />
          <input
            type="number"
            name="longitude"
            step="0.0001"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Länge (lng)"
          />
        </div>
        {showMap && (
          <CoordinatePicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onChange={handleMapPick}
          />
        )}
        <small>Freilassen, wenn die Position des Controllers verwendet werden soll.</small>
      </div>

      <div className="form-group form-group-switches">
        <div className="sensor-form-switch" title="Werte empfangen umschalten">
          <span className="sensor-form-switch-label">Werte empfangen</span>
          <label className="switch-control" htmlFor="sensor-receive">
            <input
              id="sensor-receive"
              type="checkbox"
              name="receiveData"
              checked={formData.receiveData}
              onChange={handleChange}
              aria-label="Werte empfangen umschalten"
            />
            <span className="switch-slider" aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="form-group sensor-status-group">
        <h4>Aktueller Status</h4>
        <p>
          Letzter Wert:{' '}
          <strong>
            {sensor?.lastValue ?? '–'} {sensor?.unit || sensorTypes.find((t) => t.id === sensor?.sensorTypeId)?.unit || ''}
          </strong>
        </p>
        <p>Letztes Update: {formatTimestamp(sensor?.lastTs)}</p>
        <p>
          Status:{' '}
          <span
            className="badge"
            role="status"
            aria-label={`Status ${sensor?.lastStatus || 'OK'}`}
            style={{ backgroundColor: getStatusColor(sensor?.lastStatus), color: '#fff' }}
          >
            {sensor?.lastStatus || 'OK'}
          </span>
        </p>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-save">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm3-10H5V5h10v4Z"
            />
          </svg>
          <span>Speichern</span>
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3 1.42 1.41Z"
            />
          </svg>
          <span>Abbrechen</span>
        </button>
      </div>
    </form>
  )
}

export default function SensorsSettingsForm({
  config,
  sensorTypes,
  onUpdateSensor,
  onUpdateDevice,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSensorId, setEditingSensorId] = useState(null)
  const [editingDeviceId, setEditingDeviceId] = useState(null)
  const [expandedDeviceIds, setExpandedDeviceIds] = useState(() => new Set())
  const [expandedInactiveSectionIds, setExpandedInactiveSectionIds] = useState(() => new Set())

  const sensors = useMemo(() => {
    return config?.sensors || []
  }, [config?.sensors])
  const devices = useMemo(() => config?.devices || [], [config?.devices])
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const sensorTypeNameById = useMemo(() => {
    const map = new Map()
    sensorTypes.forEach((type) => map.set(type.id, type.name || ''))
    return map
  }, [sensorTypes])

  const sensorsByDevice = useMemo(() => {
    return sensors.reduce((acc, sensor) => {
      if (!sensor.deviceId) return acc
      if (!acc.has(sensor.deviceId)) {
        acc.set(sensor.deviceId, [])
      }
      acc.get(sensor.deviceId).push(sensor)
      return acc
    }, new Map())
  }, [sensors])

  const unassignedSensors = useMemo(() => {
    const knownDeviceIds = new Set(devices.map((device) => device.id))
    return sensors.filter((sensor) => !sensor.deviceId || !knownDeviceIds.has(sensor.deviceId))
  }, [devices, sensors])

  const matchesSensor = (sensor) => {
    if (!normalizedQuery) return true
    const typeName = sensorTypeNameById.get(sensor.sensorTypeId) || ''
    return [sensor.name, sensor.infoText, sensor.deviceId ? String(sensor.deviceId) : '', typeName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  }

  const filteredDevices = useMemo(() => {
    return devices
      .map((device) => {
        const deviceSensors = sensorsByDevice.get(device.id) || []
        if (!normalizedQuery) {
          return { device, sensors: deviceSensors }
        }

        const deviceMatch = [device.name, device.deviceId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))

        const matchedSensors = deviceSensors.filter(matchesSensor)
        if (!deviceMatch && matchedSensors.length === 0) {
          return null
        }

        return {
          device,
          sensors: deviceMatch ? deviceSensors : matchedSensors,
        }
      })
      .filter(Boolean)
  }, [devices, sensorsByDevice, normalizedQuery])

  const filteredUnassignedSensors = useMemo(() => {
    if (!normalizedQuery) return unassignedSensors
    return unassignedSensors.filter(matchesSensor)
  }, [unassignedSensors, normalizedQuery])

  const handleUpdateSensor = (formData) => {
    onUpdateSensor(editingSensorId, {
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      exposeToApp: formData.exposeToApp !== false,
      receiveData: formData.receiveData,
      deviceId: formData.deviceId === '' ? null : formData.deviceId,
      latitude: formData.latitude,
      longitude: formData.longitude,
    })
    setEditingSensorId(null)
  }

  const handleAddDevice = (formData) => {
    onAddDevice({
      deviceId: formData.deviceId,
      name: formData.name,
      latitude: formData.latitude,
      longitude: formData.longitude,
    })
    setIsAddingDevice(false)
  }

  const handleUpdateDevice = (formData) => {
    onUpdateDevice(editingDeviceId, {
      name: formData.name,
      latitude: formData.latitude,
      longitude: formData.longitude,
    })
    setEditingDeviceId(null)
  }

  const isSensorInactive = (sensor) => sensor.exposeToApp === false || sensor.dataStale === true

  const toggleDeviceSensors = (deviceId) => {
    setExpandedDeviceIds((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) {
        next.delete(deviceId)
      } else {
        next.add(deviceId)
      }
      return next
    })
  }
  const toggleInactiveSection = (key) => {
    setExpandedInactiveSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <section className="sensors-settings">
      <div className="settings-header">
        <h2>Sensoren und Controller / Geräte</h2>
        <p className="helper-text">
          Sensoren und Controller werden automatisch über MQTT Discovery erkannt und angelegt. Controller und Sensoren können hier angepasst werden.
        </p>
      </div>

      <div className="sensors-search-wrap">
        <svg className="sensors-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" />
        </svg>
        <input
          type="search"
          className="sensors-search-input"
          placeholder="Nach Gateway, Geräte-ID oder Sensor suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Gateways und Sensoren durchsuchen"
        />
      </div>

      <section className="devices-settings">
        <div className="sensors-list sensors-list--gateways">
          {filteredDevices.length === 0 ? (
            <p className="empty-message">Noch keine Geräte hinterlegt.</p>
          ) : (
            filteredDevices.map(({ device, sensors: deviceSensors }) => (
              <div key={device.id} className="gateway-group">
                {(() => {
                  const isExpanded = expandedDeviceIds.has(device.id)
                  return (
                    <>
                      {editingDeviceId === device.id ? (
                        <div className="sensor-form-container">
                          <h4>Geräteposition bearbeiten</h4>
                          <DeviceForm
                            device={device}
                            onSave={handleUpdateDevice}
                            onCancel={() => setEditingDeviceId(null)}
                          />
                        </div>
                      ) : (
                        <DeviceRow
                          device={device}
                          sensorCount={deviceSensors.length}
                          isExpanded={isExpanded}
                          onToggleSensors={() => toggleDeviceSensors(device.id)}
                          onEdit={() => setEditingDeviceId(device.id)}
                        />
                      )}

                      {isExpanded ? (
                        <div className="gateway-sensors-list">
                          {deviceSensors.length === 0 ? (
                            <p className="empty-message">Diesem Gateway sind aktuell keine Sensoren zugeordnet.</p>
                          ) : (() => {
                            const activeSensors = deviceSensors.filter((s) => !isSensorInactive(s))
                            const inactiveSensors = deviceSensors.filter((s) => isSensorInactive(s))
                            const inactiveSectionKey = `device-${device.id}`
                            const inactiveExpanded = expandedInactiveSectionIds.has(inactiveSectionKey)
                            return (
                              <>
                                {activeSensors.length === 0 && inactiveSensors.length > 0 && (
                                  <p className="empty-message">Alle Sensoren dieses Geräts sind inaktiv.</p>
                                )}
                                {activeSensors.map((sensor) => (
                                  <div key={sensor.id}>
                                    {editingSensorId === sensor.id ? (
                                      <div className="sensor-form-container">
                                        <SensorForm sensor={sensor} sensorTypes={sensorTypes} devices={devices} onSave={handleUpdateSensor} onCancel={() => setEditingSensorId(null)} />
                                      </div>
                                    ) : (
                                      <SensorRow sensor={sensor} sensorTypes={sensorTypes} devices={devices} onEdit={() => setEditingSensorId(sensor.id)} onToggleActive={(exposeToApp) => onUpdateSensor(sensor.id, { exposeToApp })} />
                                    )}
                                  </div>
                                ))}
                                {inactiveSensors.length > 0 && (
                                  <div className="inactive-sensors-section">
                                    <button
                                      type="button"
                                      className="inactive-sensors-toggle"
                                      onClick={() => toggleInactiveSection(inactiveSectionKey)}
                                      aria-expanded={inactiveExpanded}
                                    >
                                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: '1em', height: '1em' }}>
                                        <path fill="currentColor" d={inactiveExpanded ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                                      </svg>
                                      Inaktive Sensoren ({inactiveSensors.length})
                                    </button>
                                    {inactiveExpanded && inactiveSensors.map((sensor) => (
                                      <div key={sensor.id}>
                                        {editingSensorId === sensor.id ? (
                                          <div className="sensor-form-container">
                                            <SensorForm sensor={sensor} sensorTypes={sensorTypes} devices={devices} onSave={handleUpdateSensor} onCancel={() => setEditingSensorId(null)} />
                                          </div>
                                        ) : (
                                          <SensorRow sensor={sensor} sensorTypes={sensorTypes} devices={devices} onEdit={() => setEditingSensorId(sensor.id)} onToggleActive={(exposeToApp) => onUpdateSensor(sensor.id, { exposeToApp })} />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      ) : null}
                    </>
                  )
                })()}
              </div>
            ))
          )}
        </div>
      </section>

      {filteredUnassignedSensors.length > 0 ? (
        <section className="devices-settings">
          <div className="settings-header">
            <h3>Nicht zugeordnete Sensoren</h3>
            <p className="helper-text">Diese Sensoren sind aktuell keinem Gateway zugewiesen.</p>
          </div>
          <div className="sensors-list">
            {(() => {
              const activeSensors = filteredUnassignedSensors.filter((s) => !isSensorInactive(s))
              const inactiveSensors = filteredUnassignedSensors.filter((s) => isSensorInactive(s))
              const inactiveSectionKey = 'unassigned'
              const inactiveExpanded = expandedInactiveSectionIds.has(inactiveSectionKey)
              return (
                <>
                  {activeSensors.map((sensor) => (
                    <div key={sensor.id}>
                      {editingSensorId === sensor.id ? (
                        <div className="sensor-form-container">
                          <SensorForm sensor={sensor} sensorTypes={sensorTypes} devices={devices} onSave={handleUpdateSensor} onCancel={() => setEditingSensorId(null)} />
                        </div>
                      ) : (
                        <SensorRow sensor={sensor} sensorTypes={sensorTypes} devices={devices} onEdit={() => setEditingSensorId(sensor.id)} onToggleActive={(exposeToApp) => onUpdateSensor(sensor.id, { exposeToApp })} />
                      )}
                    </div>
                  ))}
                  {inactiveSensors.length > 0 && (
                    <div className="inactive-sensors-section">
                      <button
                        type="button"
                        className="inactive-sensors-toggle"
                        onClick={() => toggleInactiveSection(inactiveSectionKey)}
                        aria-expanded={inactiveExpanded}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ width: '1em', height: '1em' }}>
                          <path fill="currentColor" d={inactiveExpanded ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                        </svg>
                        Inaktive Sensoren ({inactiveSensors.length})
                      </button>
                      {inactiveExpanded && inactiveSensors.map((sensor) => (
                        <div key={sensor.id}>
                          {editingSensorId === sensor.id ? (
                            <div className="sensor-form-container">
                              <SensorForm sensor={sensor} sensorTypes={sensorTypes} devices={devices} onSave={handleUpdateSensor} onCancel={() => setEditingSensorId(null)} />
                            </div>
                          ) : (
                            <SensorRow sensor={sensor} sensorTypes={sensorTypes} devices={devices} onEdit={() => setEditingSensorId(sensor.id)} onToggleActive={(exposeToApp) => onUpdateSensor(sensor.id, { exposeToApp })} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </section>
      ) : null}
    </section>
  )
}
