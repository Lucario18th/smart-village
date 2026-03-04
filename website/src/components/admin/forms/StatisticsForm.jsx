import React from 'react'

export default function StatisticsForm({ config }) {
  if (!config.sensors || config.sensors.length === 0) {
    return (
      <div className="empty-state">
        <p>Keine Sensoren vorhanden. Bitte erstellen Sie zuerst einen Sensor.</p>
      </div>
    )
  }

  const totalSensors = config.sensors.length
  const activeSensors = config.sensors.filter(s => s.active).length
  const sensorsByType = {}

  config.sensors.forEach(sensor => {
    const type = sensor.type || 'Unknown'
    sensorsByType[type] = (sensorsByType[type] || 0) + 1
  })

  return (
    <div className="statistics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Gesamtzahl Sensoren</h3>
          <p className="stat-value">{totalSensors}</p>
        </div>

        <div className="stat-card">
          <h3>Aktive Sensoren</h3>
          <p className="stat-value" style={{ color: activeSensors > 0 ? '#4caf50' : '#999' }}>
            {activeSensors}
          </p>
        </div>

        <div className="stat-card">
          <h3>Inaktive Sensoren</h3>
          <p className="stat-value" style={{ color: totalSensors - activeSensors > 0 ? '#ff9800' : '#999' }}>
            {totalSensors - activeSensors}
          </p>
        </div>
      </div>

      <div className="sensor-types-section">
        <h3>Sensoren nach Typ</h3>
        <div className="sensor-types-list">
          {Object.entries(sensorsByType).map(([type, count]) => (
            <div key={type} className="type-row">
              <span className="type-label">{type}</span>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sensor-details-section">
        <h3>Sensor-Details</h3>
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {config.sensors.map(sensor => (
              <tr key={sensor.id}>
                <td className="sensor-name">{sensor.name}</td>
                <td>{sensor.type}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: sensor.active ? '#e8f5e9' : '#ffebee',
                    color: sensor.active ? '#2e7d32' : '#c62828',
                    fontSize: '0.85em',
                  }}>
                    {sensor.active ? '✓ Aktiv' : '✗ Inaktiv'}
                  </span>
                </td>
                <td className="sensor-info">{sensor.infoText || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
