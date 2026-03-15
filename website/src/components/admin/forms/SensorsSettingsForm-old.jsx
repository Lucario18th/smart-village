import React, { useState } from 'react'

const MODULE_METADATA = {
  rideShareBench: {
    label: 'Mitfahrbank',
    description: 'Digitale Mitfahrbank mit Status-/Anfrage-Informationen',
  },
  textileContainer: {
    label: 'Altkleidercontainer',
    description: 'Sensorische Füllstandserfassung für Entleerungsplanung',
  },
  energyMonitor: {
    label: 'Strommonitoring',
    description: 'Lokale Energie- und Verbrauchsdaten visualisieren',
  },
}

const SOURCE_OPTIONS = [
  { value: 'simulated', label: 'Simuliert' },
  { value: 'mqtt', label: 'MQTT' },
  { value: 'rest', label: 'REST' },
  { value: 'lora', label: 'LoRa' },
]

function SensorRow({ sensor, onEdit, onDelete }) {
  return (
    <div className="sensor-row">
      <div>
        <h4>{sensor.name}</h4>
        <p className="sensor-source">
          Quelle: <strong>{SOURCE_OPTIONS.find((s) => s.value === sensor.source)?.label || sensor.source}</strong>
        </p>
      </div>
      <div className="sensor-actions">
        <button type="button" className="sensor-action-btn edit" onClick={onEdit} title="Bearbeiten">
          ✎ Bearbeiten
        </button>
        <button type="button" className="sensor-action-btn delete" onClick={onDelete} title="Löschen">
          × Löschen
        </button>
      </div>
    </div>
  )
}

function SensorForm({ sensor, onSave, onCancel, sourceOptions }) {
  const [formData, setFormData] = useState(
    sensor || {
      name: '',
      source: 'simulated',
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
    if (!formData.name.trim()) {
      alert('Bitte Sensornamen eingeben')
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
          placeholder="z.B. 'Sensor Nord'"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="sensor-source">Datenquelle</label>
        <select id="sensor-source" name="source" value={formData.source} onChange={handleChange}>
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sensor-form-actions">
        <button type="submit" className="primary">
          Speichern
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}

export default function SensorsSettingsForm({
  modules,
  selectedModule,
  onAddSensor,
  onUpdateSensor,
  onRemoveSensor,
  onSelectModule,
}) {
  const moduleIds = Object.keys(MODULE_METADATA)
  const currentModuleId = selectedModule || moduleIds[0]
  const currentModule = modules[currentModuleId]
  const currentSensors = currentModule?.sensors || []

  const [editingSensorId, setEditingSensorId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddSensor = (formData) => {
    const newSensor = {
      id: `${currentModuleId}-${Date.now()}`,
      name: formData.name,
      source: formData.source,
      config: {},
    }
    onAddSensor(currentModuleId, newSensor)
    setShowAddForm(false)
  }

  const handleUpdateSensor = (sensorId, formData) => {
    onUpdateSensor(currentModuleId, sensorId, {
      name: formData.name,
      source: formData.source,
    })
    setEditingSensorId(null)
  }

  const handleDeleteSensor = (sensorId) => {
    if (confirm('Sensor wirklich löschen?')) {
      onRemoveSensor(currentModuleId, sensorId)
    }
  }

  return (
    <div className="sensors-container">
      <div className="module-tabs">
        {moduleIds.map((moduleId) => (
          <button
            key={moduleId}
            type="button"
            className={`module-tab ${currentModuleId === moduleId ? 'active' : ''}`}
            onClick={() => onSelectModule(moduleId)}
          >
            {MODULE_METADATA[moduleId].label}
          </button>
        ))}
      </div>

      <div className="sensors-content">
        <h3>Sensoren: {MODULE_METADATA[currentModuleId].label}</h3>
        <p className="sensors-description">{MODULE_METADATA[currentModuleId].description}</p>

        {currentSensors.length === 0 ? (
          <p className="no-sensors">Noch keine Sensoren konfiguriert</p>
        ) : (
          <div className="sensors-list">
            {currentSensors.map((sensor) => (
              <div key={sensor.id}>
                {editingSensorId === sensor.id ? (
                  <SensorForm
                    sensor={sensor}
                    onSave={(formData) => handleUpdateSensor(sensor.id, formData)}
                    onCancel={() => setEditingSensorId(null)}
                    sourceOptions={SOURCE_OPTIONS}
                  />
                ) : (
                  <SensorRow
                    sensor={sensor}
                    onEdit={() => setEditingSensorId(sensor.id)}
                    onDelete={() => handleDeleteSensor(sensor.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <SensorForm
            onSave={handleAddSensor}
            onCancel={() => setShowAddForm(false)}
            sourceOptions={SOURCE_OPTIONS}
          />
        ) : (
          <button type="button" className="add-sensor-btn" onClick={() => setShowAddForm(true)}>
            + Neue Sensor hinzufügen
          </button>
        )}
      </div>
    </div>
  )
}
