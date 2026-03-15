import React from 'react'
import { apiClient } from '../../../api/client'

const RANGE_PRESETS = [
  { id: '24h', label: '24h', hours: 24 },
  { id: '7d', label: '7 Tage', hours: 24 * 7 },
  { id: '30d', label: '30 Tage', hours: 24 * 30 },
]

const STATUS_TIMEOUT_MS = 5 * 60 * 1000
const STATUS_DOWNTIME_MS = 60 * 60 * 1000

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })

function formatTimestamp(ts) {
  if (!ts) return 'Keine Messung'
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return 'Keine Messung'
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return numberFormatter.format(Number(value))
}

function formatValue(value, unit = '') {
  const base = formatNumber(value)
  return base === '—' ? base : `${base}${unit ? ` ${unit}` : ''}`
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const half = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[half - 1] + sorted[half]) / 2
  }
  return sorted[half]
}

function stdDeviation(values, avgValue) {
  if (!values.length) return null
  const variance =
    values.reduce((sum, value) => sum + (value - avgValue) * (value - avgValue), 0) / values.length
  return Math.sqrt(variance)
}

function getRangeById(rangeId) {
  return RANGE_PRESETS.find((range) => range.id === rangeId) || RANGE_PRESETS[0]
}

function buildRange(rangeId) {
  const range = getRangeById(rangeId)
  const to = new Date()
  const from = new Date(to.getTime() - range.hours * 60 * 60 * 1000)
  return { from, to }
}

function getFreshness(lastTs) {
  if (!lastTs) {
    return { status: 'Keine aktuellen Daten', tone: 'offline' }
  }
  const ageMs = Date.now() - new Date(lastTs).getTime()
  if (Number.isNaN(ageMs) || ageMs > STATUS_TIMEOUT_MS) {
    return { status: 'Keine aktuellen Daten', tone: 'offline' }
  }
  return { status: 'OK', tone: 'ok' }
}

function getSensorLocation(sensor) {
  if (sensor.deviceIdentifier) return sensor.deviceIdentifier
  if (sensor.latitude !== '' && sensor.longitude !== '' && sensor.latitude !== null && sensor.longitude !== null) {
    return `${formatNumber(sensor.latitude)}, ${formatNumber(sensor.longitude)}`
  }
  return 'Nicht gesetzt'
}

function normalizeReadings(readings) {
  return [...(readings || [])]
    .filter((item) => item && item.ts && item.value !== null && item.value !== undefined)
    .map((item) => ({ ...item, tsDate: new Date(item.ts) }))
    .filter((item) => !Number.isNaN(item.tsDate.getTime()))
    .sort((a, b) => a.tsDate.getTime() - b.tsDate.getTime())
}

function computeStats(readings) {
  if (!readings.length) {
    return {
      min: null,
      max: null,
      avg: null,
      median: null,
      stdDev: null,
      count: 0,
      trend: 'stabil',
      trendDelta: 0,
    }
  }

  const values = readings.map((reading) => Number(reading.value)).filter((value) => Number.isFinite(value))
  if (!values.length) {
    return {
      min: null,
      max: null,
      avg: null,
      median: null,
      stdDev: null,
      count: 0,
      trend: 'stabil',
      trendDelta: 0,
    }
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  const trend = delta > 0.02 ? 'steigend' : delta < -0.02 ? 'fallend' : 'stabil'

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg,
    median: median(values),
    stdDev: stdDeviation(values, avg),
    count: values.length,
    trend,
    trendDelta: delta,
  }
}

function computeHealth(readings, range, lastTs) {
  const periodMs = Math.max(range.to.getTime() - range.from.getTime(), 1)
  if (!readings.length) {
    return {
      timeoutCount: 0,
      longestOutageMs: lastTs ? Math.max(Date.now() - new Date(lastTs).getTime(), 0) : periodMs,
      downtimeMs: periodMs,
      uptimePercent: 0,
      missingDataPercent: 100,
      mtbfMs: null,
    }
  }

  const diffs = []
  for (let i = 1; i < readings.length; i += 1) {
    diffs.push(readings[i].tsDate.getTime() - readings[i - 1].tsDate.getTime())
  }
  const expectedIntervalMs = Math.max(median(diffs.filter((diff) => diff > 0)) || STATUS_TIMEOUT_MS, 60 * 1000)

  let timeoutCount = 0
  let downtimeMs = 0
  let longestOutageMs = 0

  for (let i = 1; i < readings.length; i += 1) {
    const gap = readings[i].tsDate.getTime() - readings[i - 1].tsDate.getTime()
    if (gap > STATUS_TIMEOUT_MS) {
      timeoutCount += 1
      const excessGap = Math.max(gap - expectedIntervalMs, 0)
      downtimeMs += excessGap
      longestOutageMs = Math.max(longestOutageMs, excessGap)
    }
  }

  if (lastTs) {
    const tailGap = Math.max(Date.now() - new Date(lastTs).getTime(), 0)
    if (tailGap > STATUS_TIMEOUT_MS) {
      timeoutCount += 1
      const excessGap = Math.max(tailGap - expectedIntervalMs, 0)
      downtimeMs += excessGap
      longestOutageMs = Math.max(longestOutageMs, excessGap)
    }
  }

  const expectedPoints = Math.max(Math.round(periodMs / expectedIntervalMs), 1)
  const missingPoints = Math.max(expectedPoints - readings.length, 0)
  const missingDataPercent = Math.min((missingPoints / expectedPoints) * 100, 100)
  const uptimePercent = Math.max(0, Math.min(100, ((periodMs - Math.min(downtimeMs, periodMs)) / periodMs) * 100))
  const mtbfMs = timeoutCount > 0 ? periodMs / timeoutCount : null

  return {
    timeoutCount,
    longestOutageMs,
    downtimeMs,
    uptimePercent,
    missingDataPercent,
    mtbfMs,
  }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0 Min'
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.round((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours} h ${minutes} Min`
  return `${minutes} Min`
}

function SimpleLineChart({ readings, unit }) {
  if (!readings.length) {
    return <div className="stats-empty">Keine Messwerte im ausgewählten Zeitraum</div>
  }

  const width = 760
  const height = 220
  const padding = 24
  const values = readings.map((reading) => Number(reading.value)).filter((value) => Number.isFinite(value))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const fromTs = readings[0].tsDate.getTime()
  const toTs = readings[readings.length - 1].tsDate.getTime()
  const xSpan = Math.max(toTs - fromTs, 1)
  const ySpan = Math.max(max - min, 1)

  const points = readings
    .map((reading) => {
      const x = padding + ((reading.tsDate.getTime() - fromTs) / xSpan) * (width - padding * 2)
      const y = height - padding - ((Number(reading.value) - min) / ySpan) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="stats-chart-wrap">
      <svg className="stats-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Zeitreihe Sensorwerte">
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stats-axis" />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stats-axis"
        />
        <polyline className="stats-line" points={points} />
      </svg>
      <div className="stats-chart-scale">
        <span>{formatValue(min, unit)}</span>
        <span>{formatValue(max, unit)}</span>
      </div>
    </div>
  )
}

export default function StatisticsForm({ config }) {
  const sensors = config.sensors || []
  const [layer, setLayer] = React.useState('overview')
  const [rangeId, setRangeId] = React.useState(RANGE_PRESETS[0].id)
  const [selectedSensorId, setSelectedSensorId] = React.useState(sensors[0]?.id || null)
  const [selectedType, setSelectedType] = React.useState('all')
  const [isHistoricalOpen, setIsHistoricalOpen] = React.useState(false)
  const [sensorReadingsState, setSensorReadingsState] = React.useState({})

  React.useEffect(() => {
    if (!selectedSensorId && sensors.length) {
      setSelectedSensorId(sensors[0].id)
    }
  }, [selectedSensorId, sensors])

  React.useEffect(() => {
    setIsHistoricalOpen(false)
  }, [selectedSensorId])

  const range = React.useMemo(() => buildRange(rangeId), [rangeId])

  React.useEffect(() => {
    if (!selectedSensorId) return
    let cancelled = false

    const stateKey = `${selectedSensorId}:${rangeId}`
    setSensorReadingsState((prev) => ({
      ...prev,
      [stateKey]: { loading: true, error: '', readings: [] },
    }))

    apiClient.sensorReadings
      .list(selectedSensorId, {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        limit: 5000,
        order: 'asc',
      })
      .then((readings) => {
        if (cancelled) return
        setSensorReadingsState((prev) => ({
          ...prev,
          [stateKey]: {
            loading: false,
            error: '',
            readings: normalizeReadings(readings),
          },
        }))
      })
      .catch((error) => {
        if (cancelled) return
        setSensorReadingsState((prev) => ({
          ...prev,
          [stateKey]: {
            loading: false,
            error: error.message || 'Messwerte konnten nicht geladen werden',
            readings: [],
          },
        }))
      })

    return () => {
      cancelled = true
    }
  }, [range.from, range.to, rangeId, selectedSensorId])

  if (sensors.length === 0) {
    return (
      <div className="empty-state">
        <p>Keine Sensoren vorhanden. Bitte erstellen Sie zuerst einen Sensor.</p>
      </div>
    )
  }

  const selectedSensor = sensors.find((sensor) => sensor.id === selectedSensorId) || sensors[0]
  const selectedSensorKey = selectedSensor ? `${selectedSensor.id}:${rangeId}` : ''
  const selectedSensorState = sensorReadingsState[selectedSensorKey] || {
    loading: false,
    error: '',
    readings: [],
  }
  const stats = computeStats(selectedSensorState.readings)
  const health = computeHealth(selectedSensorState.readings, range, selectedSensor?.lastTs)

  const sensorsByType = sensors.reduce((acc, sensor) => {
    const key = sensor.type || 'Unbekannt'
    acc[key] = [...(acc[key] || []), sensor]
    return acc
  }, {})

  const availableTypes = Object.keys(sensorsByType).sort((a, b) => a.localeCompare(b, 'de'))
  const compareSensors =
    selectedType === 'all' ? sensors : sensors.filter((sensor) => (sensor.type || 'Unbekannt') === selectedType)
  const compareWithValue = compareSensors.filter((sensor) => sensor.lastValue !== null && sensor.lastValue !== undefined)
  const highest = compareWithValue.reduce(
    (result, sensor) => (result === null || Number(sensor.lastValue) > Number(result.lastValue) ? sensor : result),
    null
  )
  const lowest = compareWithValue.reduce(
    (result, sensor) => (result === null || Number(sensor.lastValue) < Number(result.lastValue) ? sensor : result),
    null
  )

  const problematicSensors = sensors.filter((sensor) => getFreshness(sensor.lastTs).tone !== 'ok').length
  const activeSensors = sensors.filter((sensor) => sensor.active).length

  return (
    <div className="statistics-container">
      <div className="statistics-controls">
        <div className="statistics-layer-tabs">
          <button
            type="button"
            className={`statistics-tab${layer === 'overview' ? ' active' : ''}`}
            onClick={() => setLayer('overview')}
          >
            Sensorwert-Statistiken
          </button>
          <button
            type="button"
            className={`statistics-tab${layer === 'health' ? ' active' : ''}`}
            onClick={() => setLayer('health')}
          >
            Sensorzustand
          </button>
          <button
            type="button"
            className={`statistics-tab${layer === 'compare' ? ' active' : ''}`}
            onClick={() => setLayer('compare')}
          >
            Vergleich & Trends
          </button>
        </div>

        <div className="statistics-filters">
          <label>
            Zeitraum
            <select value={rangeId} onChange={(event) => setRangeId(event.target.value)}>
              {RANGE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sensor
            <select
              value={selectedSensor?.id || ''}
              onChange={(event) => setSelectedSensorId(Number(event.target.value))}
            >
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sensortyp
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="all">Alle Typen</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Gesamtzahl Sensoren</h3>
          <p className="stat-value">{sensors.length}</p>
        </div>
        <div className="stat-card">
          <h3>Aktive Sensoren</h3>
          <p className="stat-value">{activeSensors}</p>
        </div>
        <div className="stat-card">
          <h3>Sensoren mit Problemen</h3>
          <p className="stat-value">{problematicSensors}</p>
        </div>
      </div>

      {layer === 'overview' ? (
        <>
          <section className="statistics-block">
            <h3>Übersicht aller Sensoren</h3>
            <div className="sensor-table-wrap">
              <table className="sensor-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Typ</th>
                    <th>Ort</th>
                    <th>Letzter Messwert</th>
                    <th>Letzte Meldung</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((sensor) => {
                    const freshness = getFreshness(sensor.lastTs)
                    return (
                      <tr key={sensor.id} className={sensor.id === selectedSensor?.id ? 'is-selected' : ''}>
                        <td>
                          <button
                            type="button"
                            className="sensor-link-button"
                            onClick={() => setSelectedSensorId(sensor.id)}
                          >
                            {sensor.name}
                          </button>
                        </td>
                        <td>{sensor.type || 'Unbekannt'}</td>
                        <td>{getSensorLocation(sensor)}</td>
                        <td>{formatValue(sensor.lastValue, sensor.unit)}</td>
                        <td>{formatTimestamp(sensor.lastTs)}</td>
                        <td>
                          <span className={`health-pill ${freshness.tone}`}>{freshness.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {selectedSensor ? (
            <section className="statistics-block sensor-detail-block">
              <div className="sensor-detail-header">
                <div>
                  <h3>{selectedSensor.name}</h3>
                  <p>
                    Typ: <strong>{selectedSensor.type || 'Unbekannt'}</strong> · Ort:{' '}
                    <strong>{getSensorLocation(selectedSensor)}</strong>
                  </p>
                  <p>
                    Letzter Wert: <strong>{formatValue(selectedSensor.lastValue, selectedSensor.unit)}</strong> ·{' '}
                    {formatTimestamp(selectedSensor.lastTs)}
                  </p>
                </div>
                <div className="sensor-trend-pill">
                  Trend: {stats.trend} ({stats.trendDelta >= 0 ? '+' : ''}{formatValue(stats.trendDelta, selectedSensor.unit)})
                </div>
              </div>

              {selectedSensorState.loading ? <p>Lade Messwerte...</p> : null}
              {selectedSensorState.error ? <p className="stats-error">{selectedSensorState.error}</p> : null}

              {!selectedSensorState.loading && !selectedSensorState.error ? (
                <>
                  <SimpleLineChart readings={selectedSensorState.readings} unit={selectedSensor.unit} />

                  <div className="stats-grid stats-grid--detail">
                    <div className="stat-card">
                      <h4>Minimum</h4>
                      <p className="stat-value">{formatValue(stats.min, selectedSensor.unit)}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Maximum</h4>
                      <p className="stat-value">{formatValue(stats.max, selectedSensor.unit)}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Durchschnitt</h4>
                      <p className="stat-value">{formatValue(stats.avg, selectedSensor.unit)}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Median</h4>
                      <p className="stat-value">{formatValue(stats.median, selectedSensor.unit)}</p>
                    </div>
                    <div className="stat-card">
                      <h4>StdAbw</h4>
                      <p className="stat-value">{formatValue(stats.stdDev, selectedSensor.unit)}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Messpunkte</h4>
                      <p className="stat-value">{stats.count}</p>
                    </div>
                  </div>

                  <div className="historical-readings">
                    <button
                      type="button"
                      className="historical-readings-toggle"
                      onClick={() => setIsHistoricalOpen((prev) => !prev)}
                      aria-expanded={isHistoricalOpen}
                      aria-controls="historical-readings-table"
                    >
                      <span>Alte Messungen (letzte 20)</span>
                      <span className={`historical-readings-chevron${isHistoricalOpen ? ' open' : ''}`} aria-hidden="true">
                        ▾
                      </span>
                    </button>
                    {isHistoricalOpen ? (
                      <div id="historical-readings-table" className="sensor-table-wrap">
                        <table className="sensor-table sensor-table--compact">
                          <thead>
                            <tr>
                              <th>Zeitpunkt</th>
                              <th>Wert</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSensorState.readings
                              .slice(-20)
                              .reverse()
                              .map((reading) => (
                                <tr key={`${reading.ts}-${reading.id || reading.value}`}>
                                  <td>{formatTimestamp(reading.ts)}</td>
                                  <td>{formatValue(reading.value, selectedSensor.unit)}</td>
                                  <td>{reading.status || 'OK'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      {layer === 'health' ? (
        <section className="statistics-block">
          <h3>Sensorzustand und Verfügbarkeit</h3>
          <div className="stats-grid stats-grid--detail">
            <div className="stat-card">
              <h4>Betriebszeit</h4>
              <p className="stat-value">{formatNumber(health.uptimePercent)} %</p>
            </div>
            <div className="stat-card">
              <h4>Ausfallzeit</h4>
              <p className="stat-value">{formatDuration(health.downtimeMs)}</p>
            </div>
            <div className="stat-card">
              <h4>Zeitüberschreitungen</h4>
              <p className="stat-value">{health.timeoutCount}</p>
            </div>
            <div className="stat-card">
              <h4>Längster Ausfall</h4>
              <p className="stat-value">{formatDuration(health.longestOutageMs)}</p>
            </div>
            <div className="stat-card">
              <h4>Mittlere Ausfallfreiheit</h4>
              <p className="stat-value">{health.mtbfMs ? formatDuration(health.mtbfMs) : 'Keine Ausfälle'}</p>
            </div>
            <div className="stat-card">
              <h4>Fehlende Daten</h4>
              <p className="stat-value">{formatNumber(health.missingDataPercent)} %</p>
            </div>
          </div>

          <div className="sensor-health-list">
            {sensors.map((sensor) => {
              const freshness = getFreshness(sensor.lastTs)
              const lastSeenMs = sensor.lastTs ? Date.now() - new Date(sensor.lastTs).getTime() : Infinity
              const downtimeLabel =
                lastSeenMs > STATUS_DOWNTIME_MS
                  ? 'Ausfall'
                  : freshness.tone === 'offline'
                    ? 'Zeitüberschreitung'
                    : 'Online'

              return (
                <article key={sensor.id} className="sensor-health-card">
                  <h4>{sensor.name}</h4>
                  <p>
                    <span className={`health-pill ${freshness.tone}`}>{freshness.status}</span> · {downtimeLabel}
                  </p>
                  <p>Letzte Meldung: {formatTimestamp(sensor.lastTs)}</p>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {layer === 'compare' ? (
        <section className="statistics-block">
          <h3>Vergleich pro Sensortyp</h3>
          {highest || lowest ? (
            <div className="compare-highlights">
              <div className="compare-chip">
                Höchster Wert:{' '}
                <strong>
                  {highest?.name || '—'} ({formatValue(highest?.lastValue, highest?.unit)})
                </strong>
              </div>
              <div className="compare-chip">
                Niedrigster Wert:{' '}
                <strong>
                  {lowest?.name || '—'} ({formatValue(lowest?.lastValue, lowest?.unit)})
                </strong>
              </div>
            </div>
          ) : (
            <p>Keine aktuellen Werte für den gewählten Typ vorhanden.</p>
          )}

          <div className="sensor-table-wrap">
            <table className="sensor-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Ort</th>
                  <th>Aktueller Wert</th>
                  <th>Rang</th>
                </tr>
              </thead>
              <tbody>
                {[...compareSensors]
                  .sort((a, b) => Number(b.lastValue ?? -Infinity) - Number(a.lastValue ?? -Infinity))
                  .map((sensor, index) => {
                    const rankLabel =
                      highest && sensor.id === highest.id
                        ? 'Höchster'
                        : lowest && sensor.id === lowest.id
                          ? 'Niedrigster'
                          : `#${index + 1}`
                    return (
                      <tr key={sensor.id}>
                        <td>{sensor.name}</td>
                        <td>{getSensorLocation(sensor)}</td>
                        <td>{formatValue(sensor.lastValue, sensor.unit)}</td>
                        <td>{rankLabel}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
