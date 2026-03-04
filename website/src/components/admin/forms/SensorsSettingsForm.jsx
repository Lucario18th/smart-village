import React, { useState, useMemo } from 'react'

function SensorRow({ sensor, sensorTypes, onEdit, onDelete }) {
  const sensorType = sensorTypes.find(t => t.id === sensor.sensorTypeId)
  return (
    <div className="sensor-row">
      <div>
        <h4>{sensor.name}</h4>
        <p className="sensor-info">
          Typ: <strong>{sensorType?.name || 'Unbekannt'}</strong> ({sensorType?.unit || '?'})
        </p>
        {sensor.infoText && <p className="sensor-description">{sensor.infoText}</p>}
        <p className="sensor-status">
          Status: <strong>{sensor.active ? 'Aktiv' : 'Inaktiv'}</strong>
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

function SensorForm({ sensor, sensorTypes, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    sensor || {
      name: '',
      sensorTypeId: sensorTypes[0]?.id || 1,
      infoText: '',
      active: true,
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
    onSave(formData)
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
}) {
  const [editingSensorId, setEditingSensorId] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const sensors = useMemo(() => {
    return config?.sensors || []
  }, [config?.sensors])

  const handleAddSensor = (formData) => {
    onAddSensor({
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      active: formData.active,
    })
    setIsAddingNew(false)
  }

  const handleUpdateSensor = (formData) => {
    onUpdateSensor(editingSensorId, {
      name: formData.name,
      sensorTypeId: parseInt(formData.sensorTypeId),
      infoText: formData.infoText,
      active: formData.active,
    })
    setEditingSensorId(null)
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

      {isAddingNew && (
        <div className="sensor-form-container">
          <h3>Neuen Sensor hinzufügen</h3>
          <SensorForm
            sensorTypes={sensorTypes}
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
                    onSave={handleUpdateSensor}
                    onCancel={() => setEditingSensorId(null)}
                  />
                </div>
              ) : (
                <SensorRow
                  sensor={sensor}
                  sensorTypes={sensorTypes}
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
