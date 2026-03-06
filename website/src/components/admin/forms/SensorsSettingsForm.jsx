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

function SensorRow({ sensor, sensorTypes, devices, onEdit, onDelete }) {
  const sensorType = sensorTypes.find(t => t.id === sensor.sensorTypeId)
  const device = devices.find((d) => d.id === sensor.deviceId)
  const sensorCoords = formatCoords(sensor.latitude, sensor.longitude)
  const deviceCoords = device ? formatCoords(device.latitude, device.longitude) : null
  return (
    <div className="sensor-row">
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
        <p className="sensor-status">
          Status: <strong>{sensor.active ? 'Aktiv' : 'Inaktiv'}</strong>
        </p>
        <p className="sensor-description">
          Position:{' '}
          <strong>
            {sensorCoords || deviceCoords || 'Kein Standort hinterlegt'}
          </strong>
          {device ? ` · Controller: ${device.name || device.deviceId}` : ''}
        </p>
      </div>
      <div className="sensor-actions">
        <button type="button" className="sensor-action-btn edit" onClick={onEdit} title="Bearbeiten">
          Bearbeiten
        </button>
        <button type="button" className="sensor-action-btn delete" onClick={onDelete} title="Löschen">
          Löschen
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
        }
      : {
          name: '',
          sensorTypeId: sensorTypes[0]?.id || 1,
          infoText: '',
          active: true,
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
        >
          {sensorTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.unit})
            </option>
          ))}
        </select>
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
        >
          <option value="">Kein Controller</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name || device.deviceId} ({device.deviceId})
            </option>
          ))}
        </select>
        <small>Wenn keine Sensor-Koordinaten gesetzt sind, werden die Controller-Koordinaten genutzt.</small>
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

      <div className="form-group config-section">
        <h4>Datenquellen-Konfiguration</h4>
        <label htmlFor="sensor-datasource">API-Endpunkt (optional)</label>
        <input
          id="sensor-datasource"
          type="url"
          name="dataSourceUrl"
          value={formData.dataSourceUrl}
          onChange={handleChange}
          placeholder="https://api.example.com/sensor/data"
        />
        <small>Automatisch abzurufen von dieser Quelle</small>
      </div>

      <div className="form-group">
        <label htmlFor="sensor-interval">Aktualisierungsintervall (Sekunden)</label>
        <input
          id="sensor-interval"
          type="number"
          name="updateInterval"
          value={formData.updateInterval}
          onChange={handleChange}
          min="60"
          max="3600"
          step="60"
        />
        <small>Wie oft die Daten aktualisiert werden sollen</small>
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
  onAddSensor,
  onUpdateSensor,
  onRemoveSensor,
  onAddDevice,
  onUpdateDevice,
}) {
  const [editingSensorId, setEditingSensorId] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingDeviceId, setEditingDeviceId] = useState(null)
  const [isAddingDevice, setIsAddingDevice] = useState(false)

  const sensors = useMemo(() => {
    return config?.sensors || []
  }, [config?.sensors])
  const devices = useMemo(() => config?.devices || [], [config?.devices])

  const handleAddSensor = (formData) => {
    onAddSensor({
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      active: formData.active,
      deviceId: formData.deviceId === '' ? null : formData.deviceId,
      latitude: formData.latitude,
      longitude: formData.longitude,
    })
    setIsAddingNew(false)
  }

  const handleUpdateSensor = (formData) => {
    onUpdateSensor(editingSensorId, {
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      active: formData.active,
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

  const handleDeleteSensor = (sensorId) => {
    if (window.confirm('Sensor wirklich löschen?')) {
      onRemoveSensor(sensorId)
    }
  }

  return (
    <section className="sensors-settings">
      <div className="settings-header">
        <h2>Sensoren</h2>
        <button
          type="button"
          className="btn-add-sensor"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || editingSensorId !== null}
        >
          Neuer Sensor
        </button>
      </div>

      <section className="devices-settings">
        <div className="settings-header">
          <h3>Controller / Geräte</h3>
          <button
            type="button"
            className="btn-add-sensor"
            onClick={() => setIsAddingDevice(true)}
            disabled={isAddingDevice || editingDeviceId !== null}
          >
            Neues Gerät
          </button>
        </div>

        {isAddingDevice && (
          <div className="sensor-form-container">
            <h4>Gerät hinzufügen</h4>
            <DeviceForm onSave={handleAddDevice} onCancel={() => setIsAddingDevice(false)} />
          </div>
        )}

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

      {isAddingNew && (
        <div className="sensor-form-container">
          <h3>Neuen Sensor hinzufügen</h3>
          <SensorForm
            sensorTypes={sensorTypes}
            devices={devices}
            onSave={handleAddSensor}
            onCancel={() => setIsAddingNew(false)}
          />
        </div>
      )}

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
                  onDelete={() => handleDeleteSensor(sensor.id)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
