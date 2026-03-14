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
  const dimmed = sensor.active === false
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
        <div className="sensor-toggle" title="Sensor aktivieren/deaktivieren">
          <span className="sensor-toggle-label">Aktiv</span>
          <label className="switch-control">
            <input
              type="checkbox"
              aria-label="Sensor aktivieren oder deaktivieren"
              checked={sensor.active}
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
        }
      : {
          name: '',
          sensorTypeId: sensorTypes[0]?.id || 1,
          infoText: '',
          active: true,
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
        <div className="sensor-form-switch" title="Sensor aktivieren/deaktivieren">
          <span className="sensor-form-switch-label">Aktiv</span>
          <label className="switch-control" htmlFor="sensor-active">
            <input
              id="sensor-active"
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              aria-label="Sensor aktivieren oder deaktivieren"
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
  const [editingSensorId, setEditingSensorId] = useState(null)
  const [editingDeviceId, setEditingDeviceId] = useState(null)
  const [expandedDeviceIds, setExpandedDeviceIds] = useState(() => new Set())

  const sensors = useMemo(() => {
    return config?.sensors || []
  }, [config?.sensors])
  const devices = useMemo(() => config?.devices || [], [config?.devices])

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

  const handleUpdateSensor = (formData) => {
    onUpdateSensor(editingSensorId, {
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      active: formData.active,
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

  return (
    <section className="sensors-settings">
      <div className="settings-header">
        <h2>Sensoren und Controller / Geräte</h2>
        <p className="helper-text">
          Sensoren und Controller werden automatisch über MQTT Discovery erkannt und angelegt. Controller und Sensoren können hier angepasst werden.
        </p>
      </div>

      <section className="devices-settings">
        <div className="sensors-list">
          {devices.length === 0 ? (
            <p className="empty-message">Noch keine Geräte hinterlegt.</p>
          ) : (
            devices.map((device) => (
              <div key={device.id} className="gateway-group">
                {(() => {
                  const deviceSensors = sensorsByDevice.get(device.id) || []
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
                          ) : (
                            deviceSensors.map((sensor) => (
                              <div key={sensor.id}>
                                {editingSensorId === sensor.id ? (
                                  <div className="sensor-form-container">
                                    <SensorForm
                                      sensor={sensor}
                                      sensorTypes={sensorTypes}
                                      devices={devices}
                                      onSave={handleUpdateSensor}
                                      onCancel={() => setEditingSensorId(null)}
                                    />
                                  </div>
                                ) : (
                                  <SensorRow
                                    sensor={sensor}
                                    sensorTypes={sensorTypes}
                                    devices={devices}
                                    onEdit={() => setEditingSensorId(sensor.id)}
                                    onToggleActive={(active) => onUpdateSensor(sensor.id, { active })}
                                  />
                                )}
                              </div>
                            ))
                          )}
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

      {unassignedSensors.length > 0 ? (
        <section className="devices-settings">
          <div className="settings-header">
            <h3>Nicht zugeordnete Sensoren</h3>
            <p className="helper-text">Diese Sensoren sind aktuell keinem Gateway zugewiesen.</p>
          </div>
          <div className="sensors-list">
            {unassignedSensors.map((sensor) => (
              <div key={sensor.id}>
                {editingSensorId === sensor.id ? (
                  <div className="sensor-form-container">
                    <SensorForm
                      sensor={sensor}
                      sensorTypes={sensorTypes}
                      devices={devices}
                      onSave={handleUpdateSensor}
                      onCancel={() => setEditingSensorId(null)}
                    />
                  </div>
                ) : (
                  <SensorRow
                    sensor={sensor}
                    sensorTypes={sensorTypes}
                    devices={devices}
                    onEdit={() => setEditingSensorId(sensor.id)}
                    onToggleActive={(active) => onUpdateSensor(sensor.id, { active })}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
