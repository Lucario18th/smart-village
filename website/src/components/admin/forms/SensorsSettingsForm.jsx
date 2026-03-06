import React, { useState, useMemo } from 'react'

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

function DeviceRow({ device, onEdit }) {
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
        <button type="button" className="sensor-action-btn edit" onClick={onEdit} title="Bearbeiten">
          Position bearbeiten
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        <label>Koordinaten (optional)</label>
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
        <small>Diese Position wird für alle Sensoren genutzt, sofern diese keine eigenen Koordinaten haben.</small>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-save">
          Speichern
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}

function SensorRow({ sensor, sensorTypes, devices, onEdit, onToggleActive, onToggleReceiveData }) {
  const sensorType = sensorTypes.find(t => t.id === sensor.sensorTypeId)
  const device = devices.find((d) => d.id === sensor.deviceId)
  const sensorCoords = formatCoords(sensor.latitude, sensor.longitude)
  const deviceCoords = device ? formatCoords(device.latitude, device.longitude) : null
  const statusColor = getStatusColor(sensor.lastStatus || sensor.status)
  const dimmed = sensor.active === false
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
            {sensor.lastValue !== null && sensor.lastValue !== undefined
              ? `${sensor.lastValue} ${sensor.unit || sensorType?.unit || ''}`
              : 'Keine Messung'}
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
        <label className="switch-control" title="Sensor aktivieren/deaktivieren">
          <input
            type="checkbox"
            aria-label="Sensor aktivieren oder deaktivieren"
            checked={sensor.active}
            onChange={(e) => onToggleActive(e.target.checked)}
          />
          <span className="switch-slider" aria-hidden="true" />
        </label>
        <label className="switch-control" title="Werte empfangen">
          <input
            type="checkbox"
            aria-label="Werte empfangen umschalten"
            checked={sensor.receiveData !== false}
            onChange={(e) => onToggleReceiveData(e.target.checked)}
          />
          <span className="switch-slider" aria-hidden="true" />
        </label>
        <button type="button" className="sensor-action-btn edit" onClick={onEdit} title="Metadaten bearbeiten">
          Bearbeiten
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
        <label>Sensor-Koordinaten (optional)</label>
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
        <small>Freilassen, wenn die Position des Controllers verwendet werden soll.</small>
      </div>

      <div className="form-group">
        <label htmlFor="sensor-active">
          <input
            id="sensor-active"
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
          />
          Sensor aktiv
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="sensor-receive">
          <input
            id="sensor-receive"
            type="checkbox"
            name="receiveData"
            checked={formData.receiveData}
            onChange={handleChange}
          />
          Werte empfangen
        </label>
      </div>

      <div className="form-group">
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
          Speichern
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Abbrechen
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

  const sensors = useMemo(() => {
    return config?.sensors || []
  }, [config?.sensors])
  const devices = useMemo(() => config?.devices || [], [config?.devices])

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

  return (
    <section className="sensors-settings">
      <div className="settings-header">
        <h2>Sensoren</h2>
        <p className="helper-text">Sensoren werden automatisch über MQTT Discovery angelegt.</p>
      </div>

      <section className="devices-settings">
        <div className="settings-header">
          <h3>Controller / Geräte</h3>
          <p className="helper-text">Geräte werden automatisch entdeckt; Position kann angepasst werden.</p>
        </div>

        <div className="sensors-list">
          {devices.length === 0 ? (
            <p className="empty-message">Noch keine Geräte hinterlegt.</p>
          ) : (
            devices.map((device) => (
              <div key={device.id}>
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
                  <DeviceRow device={device} onEdit={() => setEditingDeviceId(device.id)} />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <div className="sensors-list">
        {sensors.length === 0 ? (
          <p className="empty-message">Noch keine Sensoren konfiguriert.</p>
        ) : (
          sensors.map((sensor) => (
            <div key={sensor.id}>
              {editingSensorId === sensor.id ? (
                <div className="sensor-form-container">
                  <h3>Sensor bearbeiten</h3>
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
                  onToggleReceiveData={(receiveData) => onUpdateSensor(sensor.id, { receiveData })}
                />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
