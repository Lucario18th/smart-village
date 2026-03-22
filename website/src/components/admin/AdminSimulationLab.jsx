import React, { useEffect, useMemo, useRef, useState } from 'react'
import mqtt from 'mqtt'
import CoordinatePicker from './forms/CoordinatePicker'

const FALLBACK_SENSOR_TYPES = [
  { id: 1, name: 'temperature' },
  { id: 2, name: 'humidity' },
  { id: 3, name: 'pressure' },
  { id: 4, name: 'rainfall' },
  { id: 5, name: 'co2' },
  { id: 6, name: 'people' },
]

const EMPTY_GATEWAY_FORM = {
  name: '',
  code: '',
  latitude: '',
  longitude: '',
  enabled: true,
}

const EMPTY_SENSOR_FORM = {
  gatewayId: '',
  name: '',
  sensorTypeId: '1',
  profile: 'auto',
  latitude: '',
  longitude: '',
  intervalSec: '30',
  enabled: true,
}

const DEFAULT_SIMULATION_SETTINGS = {
  autoRun: true,
  tickMs: 3000,
  profile: 'weather',
  spikeChance: 7,
  outageChance: 2,
  outageDurationSec: 45,
  mqttBridgeEnabled: true,
  mqttAutoDiscovery: true,
}

const PROFILE_OPTIONS = ['weather', 'steady', 'spiky', 'random']
const SENSOR_PROFILE_OPTIONS = ['auto', 'weather', 'steady', 'spiky', 'random']

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function toFiniteNumber(value, fallback) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function roundTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseCoordinate(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Number(numeric.toFixed(6)) : null
}

function formatCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return '–'
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '–'
  }
  return numeric.toFixed(5)
}

function formatTime(value) {
  if (!value) return '–'
  try {
    return new Date(value).toLocaleString('de-DE')
  } catch {
    return '–'
  }
}

function normalizeSimulationSettings(settings) {
  return {
    autoRun: settings?.autoRun !== false,
    tickMs: clamp(Math.round(toFiniteNumber(settings?.tickMs, 3000)), 500, 30000),
    profile: PROFILE_OPTIONS.includes(settings?.profile) ? settings.profile : 'weather',
    spikeChance: clamp(Math.round(toFiniteNumber(settings?.spikeChance, 7)), 0, 100),
    outageChance: clamp(Math.round(toFiniteNumber(settings?.outageChance, 2)), 0, 100),
    outageDurationSec: clamp(Math.round(toFiniteNumber(settings?.outageDurationSec, 45)), 5, 1800),
    mqttBridgeEnabled: settings?.mqttBridgeEnabled !== false,
    mqttAutoDiscovery: settings?.mqttAutoDiscovery !== false,
  }
}

function getBaseValueByType(type, hourOfDay) {
  switch ((type || '').toLowerCase()) {
    case 'temperature':
      return 16 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 6
    case 'humidity':
      return 58 - Math.sin((hourOfDay / 24) * Math.PI * 2) * 12
    case 'pressure':
      return 1015 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 6
    case 'rainfall':
      return Math.max(0, 0.8 + Math.sin((hourOfDay / 24) * Math.PI * 3) * 1.2)
    case 'co2':
      return 520 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 85
    case 'people':
      return Math.max(0, 3 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 4)
    default:
      return 50
  }
}

function getNoiseAmplitude(type) {
  switch ((type || '').toLowerCase()) {
    case 'temperature':
      return 0.45
    case 'humidity':
      return 1.8
    case 'pressure':
      return 0.9
    case 'rainfall':
      return 0.7
    case 'co2':
      return 12
    case 'people':
      return 1.2
    default:
      return 2
  }
}

function parseSensorInterval(sensor) {
  const interval = Number.parseInt(sensor.intervalSec, 10)
  if (!Number.isFinite(interval) || interval <= 0) {
    return 30
  }
  return interval
}

function isSensorDue(sensor, nowMs, force = false) {
  if (force) return true
  if (!sensor.lastUpdatedAt) return true
  const lastMs = Date.parse(sensor.lastUpdatedAt)
  if (!Number.isFinite(lastMs)) return true
  const intervalMs = parseSensorInterval(sensor) * 1000
  return nowMs - lastMs >= intervalMs
}

function resolveSensorProfile(sensor, globalProfile) {
  if (sensor.profile && sensor.profile !== 'auto') {
    return sensor.profile
  }
  return globalProfile
}

function buildNextValue(sensor, settings, nowMs) {
  const now = new Date(nowMs)
  const hourOfDay = now.getHours() + now.getMinutes() / 60
  const profile = resolveSensorProfile(sensor, settings.profile)

  const base = getBaseValueByType(sensor.type, hourOfDay)
  const amplitude = getNoiseAmplitude(sensor.type)
  const randomNoise = (Math.random() * 2 - 1) * amplitude

  let nextValue = base + randomNoise

  if (profile === 'steady') {
    nextValue = base + randomNoise * 0.2
  }

  if (profile === 'random') {
    nextValue = base + (Math.random() * 2 - 1) * amplitude * 2.6
  }

  if (profile === 'spiky' || profile === 'weather') {
    const spikeChance = settings.spikeChance / 100
    if (Math.random() < spikeChance) {
      const spikeDirection = Math.random() < 0.5 ? -1 : 1
      nextValue += spikeDirection * amplitude * (2.5 + Math.random() * 3)
    }
  }

  if ((sensor.type || '').toLowerCase() === 'rainfall') {
    nextValue = Math.max(0, nextValue)
  }

  if ((sensor.type || '').toLowerCase() === 'people') {
    nextValue = Math.max(0, Math.round(nextValue))
  }

  return roundTwo(nextValue)
}

function createSensorNumericId(sensors) {
  const used = new Set()
  sensors.forEach((sensor) => {
    const candidate = Number(sensor.mqttSensorId)
    if (Number.isFinite(candidate)) {
      used.add(candidate)
    }
  })

  let candidate = 100000
  while (used.has(candidate)) {
    candidate += 1
  }
  return candidate
}

function parseStoredState(storageKey) {
  const fallback = {
    enabled: false,
    settings: DEFAULT_SIMULATION_SETTINGS,
    gateways: [],
    sensors: [],
  }

  if (!storageKey) {
    return fallback
  }

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback

    const gateways = Array.isArray(parsed.gateways)
      ? parsed.gateways.map((gateway) => ({
          id: gateway.id || createId('gw'),
          name: gateway.name || 'Gateway',
          code: gateway.code || '',
          latitude: gateway.latitude ?? null,
          longitude: gateway.longitude ?? null,
          enabled: gateway.enabled !== false,
        }))
      : []

    const sensors = Array.isArray(parsed.sensors)
      ? parsed.sensors.map((sensor) => ({
          id: sensor.id || createId('sensor'),
          mqttSensorId:
            Number.isFinite(Number(sensor.mqttSensorId))
              ? Number(sensor.mqttSensorId)
              : Number.isFinite(Number(sensor.sensorId))
              ? Number(sensor.sensorId)
              : null,
          gatewayId: sensor.gatewayId || '',
          name: sensor.name || 'Sensor',
          type: sensor.type || 'custom',
          sensorTypeId: Number.isFinite(Number(sensor.sensorTypeId)) ? Number(sensor.sensorTypeId) : 1,
          profile: SENSOR_PROFILE_OPTIONS.includes(sensor.profile) ? sensor.profile : 'auto',
          latitude: sensor.latitude ?? null,
          longitude: sensor.longitude ?? null,
          intervalSec: Number.isFinite(Number(sensor.intervalSec))
            ? String(Math.max(1, Number(sensor.intervalSec)))
            : '30',
          enabled: sensor.enabled !== false,
          lastValue: sensor.lastValue ?? null,
          lastUpdatedAt: sensor.lastUpdatedAt || null,
          lastStatus: sensor.lastStatus || null,
          offlineUntil: sensor.offlineUntil || null,
        }))
      : []

    return {
      enabled: parsed.enabled === true,
      settings: normalizeSimulationSettings(parsed.settings || DEFAULT_SIMULATION_SETTINGS),
      gateways,
      sensors,
    }
  } catch {
    return fallback
  }
}

function runSimulationStep(currentState, force = false) {
  if (!currentState.enabled) {
    return currentState
  }

  const settings = normalizeSimulationSettings(currentState.settings)
  const nowMs = Date.now()
  const outageChance = settings.outageChance / 100

  const gatewaysById = new Map()
  currentState.gateways.forEach((gateway) => {
    gatewaysById.set(gateway.id, gateway)
  })

  const nextSensors = currentState.sensors.map((sensor) => {
    if (!sensor.enabled) {
      return {
        ...sensor,
        lastStatus: 'INACTIVE',
      }
    }

    const linkedGateway = sensor.gatewayId ? gatewaysById.get(sensor.gatewayId) : null
    if (linkedGateway && linkedGateway.enabled === false) {
      return {
        ...sensor,
        lastStatus: 'GATEWAY_OFF',
      }
    }

    const offlineUntilMs = sensor.offlineUntil ? Date.parse(sensor.offlineUntil) : Number.NaN
    if (Number.isFinite(offlineUntilMs) && offlineUntilMs > nowMs) {
      return {
        ...sensor,
        lastStatus: 'OFFLINE',
      }
    }

    if (!isSensorDue(sensor, nowMs, force)) {
      return sensor
    }

    if (Math.random() < outageChance) {
      const offlineUntil = new Date(nowMs + settings.outageDurationSec * 1000).toISOString()
      return {
        ...sensor,
        offlineUntil,
        lastStatus: 'OFFLINE',
      }
    }

    return {
      ...sensor,
      lastValue: buildNextValue(sensor, settings, nowMs),
      lastUpdatedAt: new Date(nowMs).toISOString(),
      lastStatus: 'OK',
      offlineUntil: null,
    }
  })

  return {
    ...currentState,
    settings,
    sensors: nextSensors,
  }
}

function SimulationSwitch({ checked, onChange, label }) {
  return (
    <label className="switch-control" title={label}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch-slider" aria-hidden="true" />
    </label>
  )
}

function CoordinateModal({ isOpen, latitude, longitude, onPick, onClose }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="sim-lab-modal-overlay" onClick={onClose}>
      <div className="sim-lab-modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="sim-lab-modal-header">
          <h3>Koordinaten auswählen</h3>
          <button type="button" className="sim-lab-modal-close" onClick={onClose}>
            X
          </button>
        </header>
        <div className="sim-lab-modal-map-container">
          <CoordinatePicker latitude={latitude} longitude={longitude} onChange={onPick} />
        </div>
      </div>
    </div>
  )
}

export default function AdminSimulationLab({
  isOpen,
  onClose,
  storageKey,
  villageName,
  authToken,
  accountId,
  villageId,
  sourceGateways = [],
  sourceSensors = [],
  sensorTypes = [],
}) {
  const mqttClientRef = useRef(null)
  const lastPublishedRef = useRef(new Map())
  const publishMetaRef = useRef(new Map())

  const [simState, setSimState] = useState(() => parseStoredState(storageKey))
  const [gatewayForm, setGatewayForm] = useState(EMPTY_GATEWAY_FORM)
  const [sensorForm, setSensorForm] = useState(EMPTY_SENSOR_FORM)
  const [editingGatewayId, setEditingGatewayId] = useState(null)
  const [editingSensorId, setEditingSensorId] = useState(null)
  const [mqttConnected, setMqttConnected] = useState(false)
  const [mqttError, setMqttError] = useState('')
  const [backendConfirmations, setBackendConfirmations] = useState({})
  const [coordinateModalTarget, setCoordinateModalTarget] = useState(null)

  const resolvedSensorTypes = useMemo(() => {
    if (Array.isArray(sensorTypes) && sensorTypes.length > 0) {
      return sensorTypes.map((type) => ({ id: type.id, name: type.name || `type-${type.id}` }))
    }
    return FALLBACK_SENSOR_TYPES
  }, [sensorTypes])

  const sensorTypeNameById = useMemo(() => {
    const map = new Map()
    resolvedSensorTypes.forEach((type) => {
      map.set(Number(type.id), String(type.name || '').toLowerCase())
    })
    return map
  }, [resolvedSensorTypes])

  const gatewaysById = useMemo(() => {
    const map = new Map()
    simState.gateways.forEach((gateway) => {
      map.set(gateway.id, gateway)
    })
    return map
  }, [simState.gateways])

  const topologySignature = useMemo(() => {
    const gatewayPart = simState.gateways
      .map((gateway) => [gateway.id, gateway.name, gateway.code, gateway.latitude, gateway.longitude, gateway.enabled].join(':'))
      .join('|')

    const sensorPart = simState.sensors
      .map((sensor) =>
        [
          sensor.id,
          sensor.mqttSensorId,
          sensor.gatewayId,
          sensor.name,
          sensor.sensorTypeId,
          sensor.latitude,
          sensor.longitude,
          sensor.enabled,
        ].join(':'),
      )
      .join('|')

    return `${gatewayPart}#${sensorPart}`
  }, [simState.gateways, simState.sensors])

  const updateState = (updater) => {
    setSimState((previousState) => {
      const nextState = updater(previousState)
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextState))
        } catch {
          // Ignore storage write errors.
        }
      }
      return nextState
    })
  }

  const resetForms = () => {
    setGatewayForm(EMPTY_GATEWAY_FORM)
    setSensorForm({
      ...EMPTY_SENSOR_FORM,
      sensorTypeId: String(resolvedSensorTypes[0]?.id ?? 1),
    })
    setEditingGatewayId(null)
    setEditingSensorId(null)
  }

  const publishDiscoveryForGateway = (gateway, currentState) => {
    const client = mqttClientRef.current
    if (!client || !mqttConnected) {
      return
    }

    const accountSegment = Number.isFinite(Number(accountId)) ? String(accountId) : 'unknown'
    const deviceCode = gateway.code || slugify(gateway.name) || gateway.id

    const payload = {
      villageId: Number(villageId),
      device: {
        name: gateway.name,
        latitude: gateway.latitude ?? undefined,
        longitude: gateway.longitude ?? undefined,
      },
      sensors: currentState.sensors
        .filter((sensor) => sensor.gatewayId === gateway.id)
        .map((sensor) => ({
          sensorId: Number.isFinite(Number(sensor.mqttSensorId)) ? Number(sensor.mqttSensorId) : undefined,
          sensorTypeId: Number.isFinite(Number(sensor.sensorTypeId)) ? Number(sensor.sensorTypeId) : 1,
          name: sensor.name,
          infoText: 'SimulationLab',
          latitude: sensor.latitude ?? undefined,
          longitude: sensor.longitude ?? undefined,
        })),
    }

    const topic = `sv/${accountSegment}/${deviceCode}/config`
    client.publish(topic, JSON.stringify(payload), { qos: 0, retain: true })
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSimState(parseStoredState(storageKey))
    setGatewayForm(EMPTY_GATEWAY_FORM)
    setSensorForm({
      ...EMPTY_SENSOR_FORM,
      sensorTypeId: String(resolvedSensorTypes[0]?.id ?? 1),
    })
    setEditingGatewayId(null)
    setEditingSensorId(null)
    setCoordinateModalTarget(null)
    lastPublishedRef.current = new Map()
    publishMetaRef.current = new Map()
    setBackendConfirmations({})
  }, [isOpen, storageKey, resolvedSensorTypes])

  useEffect(() => {
    if (!isOpen || !authToken) {
      return undefined
    }

    let disposed = false

    const doesReadingMatchPublished = (reading, publishedMeta) => {
      if (!reading || !publishedMeta) {
        return false
      }

      const readingTs = Date.parse(reading.ts || '')
      const publishedTs = Date.parse(publishedMeta.ts || '')
      const readingValue = Number(reading.value)
      const publishedValue = Number(publishedMeta.value)

      if (!Number.isFinite(readingTs) || !Number.isFinite(publishedTs)) {
        return false
      }

      if (!Number.isFinite(readingValue) || !Number.isFinite(publishedValue)) {
        return false
      }

      const tsDiffMs = Math.abs(readingTs - publishedTs)
      const valueDiff = Math.abs(readingValue - publishedValue)
      return tsDiffMs <= 2000 && valueDiff <= 0.05
    }

    const fetchLatestReadings = async () => {
      const targetSensors = simState.sensors.filter((sensor) =>
        Number.isFinite(Number(sensor.mqttSensorId)) && sensor.enabled !== false,
      )

      if (targetSensors.length === 0) {
        if (!disposed) {
          setBackendConfirmations({})
        }
        return
      }

      const checks = await Promise.all(
        targetSensors.map(async (sensor) => {
          try {
            const response = await fetch(
              `/api/sensor-readings/${sensor.mqttSensorId}?limit=1&order=desc`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              },
            )

            if (!response.ok) {
              return [sensor.id, { status: 'error', message: `HTTP ${response.status}` }]
            }

            const rows = await response.json()
            const latest = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
            if (!latest) {
              return [sensor.id, { status: 'waiting', message: 'Noch keine DB-Werte' }]
            }

            const publishedMeta = publishMetaRef.current.get(String(sensor.id))
            if (!publishedMeta) {
              return [
                sensor.id,
                {
                  status: 'idle',
                  latest,
                  message: 'Kein lokaler Publish zum Vergleichen vorhanden',
                },
              ]
            }

            const matched = doesReadingMatchPublished(latest, publishedMeta)
            if (matched) {
              return [
                sensor.id,
                {
                  status: 'confirmed',
                  latest,
                  latencyMs: Math.max(0, Date.now() - publishedMeta.publishedAtMs),
                  message: 'Backend-Bestätigung erhalten',
                },
              ]
            }

            return [
              sensor.id,
              {
                status: 'pending',
                latest,
                message: 'Warte auf passenden DB-Wert',
              },
            ]
          } catch (error) {
            return [sensor.id, { status: 'error', message: error?.message || 'Unbekannter Fehler' }]
          }
        }),
      )

      if (!disposed) {
        setBackendConfirmations(Object.fromEntries(checks))
      }
    }

    fetchLatestReadings()
    const pollId = window.setInterval(fetchLatestReadings, 4000)

    return () => {
      disposed = true
      window.clearInterval(pollId)
    }
  }, [isOpen, authToken, simState.sensors])

  useEffect(() => {
    if (!isOpen || !simState.settings?.mqttBridgeEnabled) {
      setMqttConnected(false)
      setMqttError('')
      if (mqttClientRef.current) {
        mqttClientRef.current.end(true)
        mqttClientRef.current = null
      }
      return undefined
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const brokerUrl = `${protocol}://${window.location.host}/mqtt`

    const client = mqtt.connect(brokerUrl, {
      clientId: `sv-simlab-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 5000,
      keepalive: 30,
    })

    mqttClientRef.current = client

    client.on('connect', () => {
      setMqttConnected(true)
      setMqttError('')
    })

    client.on('reconnect', () => {
      setMqttConnected(false)
    })

    client.on('error', (error) => {
      setMqttConnected(false)
      setMqttError(error?.message || 'MQTT-Verbindung fehlgeschlagen')
    })

    client.on('close', () => {
      setMqttConnected(false)
    })

    return () => {
      client.end(true)
      if (mqttClientRef.current === client) {
        mqttClientRef.current = null
      }
    }
  }, [isOpen, simState.settings?.mqttBridgeEnabled])

  useEffect(() => {
    if (!isOpen || !simState.enabled || !simState.settings?.autoRun) {
      return undefined
    }

    const tickMs = normalizeSimulationSettings(simState.settings).tickMs
    const timerId = window.setInterval(() => {
      updateState((currentState) => runSimulationStep(currentState, false))
    }, tickMs)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isOpen, simState.enabled, simState.settings?.autoRun, simState.settings?.tickMs])

  useEffect(() => {
    if (!isOpen || !mqttConnected || !simState.settings?.mqttBridgeEnabled || !simState.settings?.mqttAutoDiscovery) {
      return
    }

    simState.gateways.forEach((gateway) => {
      if (gateway.enabled === false) {
        return
      }
      publishDiscoveryForGateway(gateway, simState)
    })
  }, [isOpen, mqttConnected, simState.settings?.mqttBridgeEnabled, simState.settings?.mqttAutoDiscovery, topologySignature])

  useEffect(() => {
    if (!isOpen || !mqttConnected || !simState.settings?.mqttBridgeEnabled || !simState.enabled) {
      return
    }

    const client = mqttClientRef.current
    if (!client) {
      return
    }

    const accountSegment = Number.isFinite(Number(accountId)) ? String(accountId) : 'unknown'

    simState.sensors.forEach((sensor) => {
      const gateway = sensor.gatewayId ? gatewaysById.get(sensor.gatewayId) : null
      const deviceCode = gateway?.code || slugify(gateway?.name || '')
      const sensorId = Number(sensor.mqttSensorId)

      if (!gateway || gateway.enabled === false || !deviceCode || !Number.isFinite(sensorId)) {
        return
      }

      if (!sensor.enabled || sensor.lastStatus !== 'OK' || !sensor.lastUpdatedAt || sensor.lastValue === null || sensor.lastValue === undefined) {
        return
      }

      const cacheKey = `${sensor.id}`
      const previousTs = lastPublishedRef.current.get(cacheKey)
      if (previousTs && previousTs === sensor.lastUpdatedAt) {
        return
      }

      const topic = `sv/${accountSegment}/${deviceCode}/sensors/${sensorId}`
      const payload = {
        value: Number(sensor.lastValue),
        ts: sensor.lastUpdatedAt,
        status: sensor.lastStatus,
      }

      client.publish(topic, JSON.stringify(payload), { qos: 0 })
      lastPublishedRef.current.set(cacheKey, sensor.lastUpdatedAt)
      publishMetaRef.current.set(cacheKey, {
        ts: sensor.lastUpdatedAt,
        value: Number(sensor.lastValue),
        publishedAtMs: Date.now(),
      })
    })
  }, [isOpen, mqttConnected, simState.enabled, simState.settings?.mqttBridgeEnabled, simState.sensors, simState.gateways, accountId, gatewaysById])

  const importFromCurrentConfig = () => {
    const importedGateways = (sourceGateways || []).map((gateway) => ({
      id: `gw-${gateway.id}`,
      name: gateway.name || gateway.deviceId || 'Gateway',
      code: gateway.deviceId || `gateway-${gateway.id}`,
      latitude: parseCoordinate(gateway.latitude),
      longitude: parseCoordinate(gateway.longitude),
      enabled: gateway.status !== 'INACTIVE',
    }))

    const gatewayUiIdByDeviceInternalId = new Map()
    sourceGateways.forEach((gateway) => {
      gatewayUiIdByDeviceInternalId.set(gateway.id, `gw-${gateway.id}`)
    })

    const importedSensors = (sourceSensors || []).map((sensor) => ({
      id: `sensor-${sensor.id}`,
      mqttSensorId: Number(sensor.id),
      gatewayId: sensor.deviceId ? gatewayUiIdByDeviceInternalId.get(sensor.deviceId) || '' : '',
      name: sensor.name || `Sensor ${sensor.id}`,
      type: String(sensor.type || sensorTypeNameById.get(Number(sensor.sensorTypeId)) || 'custom').toLowerCase(),
      sensorTypeId: Number(sensor.sensorTypeId) || 1,
      profile: 'auto',
      latitude: parseCoordinate(sensor.latitude),
      longitude: parseCoordinate(sensor.longitude),
      intervalSec: '30',
      enabled: sensor.exposeToApp !== false,
      lastValue: sensor.lastValue ?? null,
      lastUpdatedAt: sensor.lastTs || null,
      lastStatus: sensor.lastStatus || null,
      offlineUntil: null,
    }))

    const nextState = {
      enabled: simState.enabled,
      settings: normalizeSimulationSettings(simState.settings),
      gateways: importedGateways,
      sensors: importedSensors,
    }

    setSimState(nextState)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextState))
      } catch {
        // Ignore storage write errors.
      }
    }
    resetForms()
  }

  const randomizeValues = () => {
    updateState((currentState) => runSimulationStep(currentState, true))
  }

  const saveGateway = (event) => {
    event.preventDefault()
    if (!gatewayForm.name.trim()) return

    const normalizedCode = gatewayForm.code.trim() || slugify(gatewayForm.name) || createId('gw')

    const payload = {
      id: editingGatewayId || createId('gw'),
      name: gatewayForm.name.trim(),
      code: normalizedCode,
      latitude: parseCoordinate(gatewayForm.latitude),
      longitude: parseCoordinate(gatewayForm.longitude),
      enabled: gatewayForm.enabled,
    }

    updateState((currentState) => {
      if (editingGatewayId) {
        return {
          ...currentState,
          gateways: currentState.gateways.map((gateway) =>
            gateway.id === editingGatewayId ? payload : gateway,
          ),
        }
      }

      return {
        ...currentState,
        gateways: [...currentState.gateways, payload],
      }
    })

    setGatewayForm(EMPTY_GATEWAY_FORM)
    setEditingGatewayId(null)
  }

  const editGateway = (gateway) => {
    setEditingGatewayId(gateway.id)
    setGatewayForm({
      name: gateway.name,
      code: gateway.code || '',
      latitude: gateway.latitude ?? '',
      longitude: gateway.longitude ?? '',
      enabled: gateway.enabled !== false,
    })
  }

  const deleteGateway = (gatewayId) => {
    updateState((currentState) => ({
      ...currentState,
      gateways: currentState.gateways.filter((gateway) => gateway.id !== gatewayId),
      sensors: currentState.sensors.map((sensor) =>
        sensor.gatewayId === gatewayId ? { ...sensor, gatewayId: '' } : sensor,
      ),
    }))

    if (editingGatewayId === gatewayId) {
      setGatewayForm(EMPTY_GATEWAY_FORM)
      setEditingGatewayId(null)
    }
  }

  const saveSensor = (event) => {
    event.preventDefault()
    if (!sensorForm.name.trim()) return

    const interval = Math.max(1, Number.parseInt(sensorForm.intervalSec, 10) || 30)

    updateState((currentState) => {
      const selectedTypeId = Number.parseInt(sensorForm.sensorTypeId, 10) || 1
      const selectedTypeName = sensorTypeNameById.get(selectedTypeId) || 'custom'
      const nextMqttSensorId =
        editingSensorId
          ? currentState.sensors.find((sensor) => sensor.id === editingSensorId)?.mqttSensorId || createSensorNumericId(currentState.sensors)
          : createSensorNumericId(currentState.sensors)

      const payload = {
        id: editingSensorId || createId('sensor'),
        mqttSensorId: nextMqttSensorId,
        gatewayId: sensorForm.gatewayId || '',
        name: sensorForm.name.trim(),
        type: selectedTypeName,
        sensorTypeId: selectedTypeId,
        profile: sensorForm.profile || 'auto',
        latitude: parseCoordinate(sensorForm.latitude),
        longitude: parseCoordinate(sensorForm.longitude),
        intervalSec: String(interval),
        enabled: sensorForm.enabled,
        lastValue: null,
        lastUpdatedAt: null,
        lastStatus: null,
        offlineUntil: null,
      }

      if (editingSensorId) {
        return {
          ...currentState,
          sensors: currentState.sensors.map((sensor) =>
            sensor.id === editingSensorId
              ? { ...sensor, ...payload, lastValue: sensor.lastValue, lastUpdatedAt: sensor.lastUpdatedAt }
              : sensor,
          ),
        }
      }

      return {
        ...currentState,
        sensors: [...currentState.sensors, payload],
      }
    })

    setSensorForm({
      ...EMPTY_SENSOR_FORM,
      sensorTypeId: String(resolvedSensorTypes[0]?.id ?? 1),
    })
    setEditingSensorId(null)
  }

  const editSensor = (sensor) => {
    setEditingSensorId(sensor.id)
    setSensorForm({
      gatewayId: sensor.gatewayId || '',
      name: sensor.name,
      sensorTypeId: String(sensor.sensorTypeId || 1),
      profile: sensor.profile || 'auto',
      latitude: sensor.latitude ?? '',
      longitude: sensor.longitude ?? '',
      intervalSec: sensor.intervalSec || '30',
      enabled: sensor.enabled !== false,
    })
  }

  const deleteSensor = (sensorId) => {
    updateState((currentState) => ({
      ...currentState,
      sensors: currentState.sensors.filter((sensor) => sensor.id !== sensorId),
    }))

    if (editingSensorId === sensorId) {
      setSensorForm({
        ...EMPTY_SENSOR_FORM,
        sensorTypeId: String(resolvedSensorTypes[0]?.id ?? 1),
      })
      setEditingSensorId(null)
    }
  }

  const toggleGateway = (gatewayId, isEnabled) => {
    updateState((currentState) => ({
      ...currentState,
      gateways: currentState.gateways.map((gateway) =>
        gateway.id === gatewayId ? { ...gateway, enabled: isEnabled } : gateway,
      ),
    }))
  }

  const toggleSensor = (sensorId, isEnabled) => {
    updateState((currentState) => ({
      ...currentState,
      sensors: currentState.sensors.map((sensor) =>
        sensor.id === sensorId ? { ...sensor, enabled: isEnabled } : sensor,
      ),
    }))
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="sim-lab-overlay" role="dialog" aria-modal="true" aria-label="Simulation Lab">
      <section className="sim-lab-card">
        <header className="sim-lab-header">
          <div>
            <p className="sim-lab-kicker">Test-Labor</p>
            <h2>Sensor & Gateway Simulation</h2>
            <p>
              Dorf: <strong>{villageName || 'Unbekannt'}</strong> · Shortcut: <strong>Strg + Umschalt + S</strong>
            </p>
          </div>
          <button type="button" className="sim-lab-close" onClick={onClose}>
            Schließen
          </button>
        </header>

        <div className="sim-lab-toolbar">
          <div className="sim-lab-toggle-wrap">
            <span>Simulation aktiv</span>
            <SimulationSwitch
              checked={simState.enabled}
              onChange={(isEnabled) => updateState((currentState) => ({ ...currentState, enabled: isEnabled }))}
              label="Simulation global ein- oder ausschalten"
            />
          </div>
          <div className="sim-lab-toggle-wrap">
            <span>Auto-Runner</span>
            <SimulationSwitch
              checked={simState.settings?.autoRun !== false}
              onChange={(isEnabled) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    autoRun: isEnabled,
                  },
                }))
              }
              label="Messwerte automatisch erzeugen"
            />
          </div>
          <div className="sim-lab-toggle-wrap">
            <span>MQTT Bridge</span>
            <SimulationSwitch
              checked={simState.settings?.mqttBridgeEnabled !== false}
              onChange={(isEnabled) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    mqttBridgeEnabled: isEnabled,
                  },
                }))
              }
              label="Simulationsdaten an MQTT publizieren"
            />
          </div>
          <div className="sim-lab-toggle-wrap">
            <span>Auto-Discovery</span>
            <SimulationSwitch
              checked={simState.settings?.mqttAutoDiscovery !== false}
              onChange={(isEnabled) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    mqttAutoDiscovery: isEnabled,
                  },
                }))
              }
              label="Gateway/Sensor-Konfiguration automatisch per MQTT senden"
            />
          </div>
          <button type="button" className="sim-lab-action" onClick={importFromCurrentConfig}>
            Aus aktueller Konfiguration importieren
          </button>
          <button type="button" className="sim-lab-action" onClick={randomizeValues}>
            Jetzt einen Tick simulieren
          </button>
        </div>

        <div className="sim-lab-mqtt-status-row">
          <span className={`sim-lab-mqtt-status ${mqttConnected ? 'is-online' : 'is-offline'}`}>
            MQTT: {mqttConnected ? 'verbunden' : 'getrennt'}
          </span>
          <div className="sim-lab-stats sim-lab-stats--inline">
            <span>{simState.gateways.length} Gateways</span>
            <span>{simState.sensors.length} Sensoren</span>
            <span>{simState.sensors.filter((sensor) => sensor.enabled).length} aktiv</span>
          </div>
          {mqttError ? <span className="sim-lab-mqtt-error">{mqttError}</span> : null}
        </div>

        <div className="sim-lab-config-grid">
          <label>
            Simulationsprofil
            <select
              value={simState.settings?.profile || 'weather'}
              onChange={(event) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    profile: event.target.value,
                  },
                }))
              }
            >
              {PROFILE_OPTIONS.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tick (ms)
            <input
              type="number"
              min="500"
              max="30000"
              step="100"
              value={simState.settings?.tickMs || 3000}
              onChange={(event) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    tickMs: clamp(Number.parseInt(event.target.value, 10) || 3000, 500, 30000),
                  },
                }))
              }
            />
          </label>
          <label>
            Spike-Chance (%)
            <input
              type="number"
              min="0"
              max="100"
              value={simState.settings?.spikeChance ?? 7}
              onChange={(event) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    spikeChance: clamp(Number.parseInt(event.target.value, 10) || 0, 0, 100),
                  },
                }))
              }
            />
          </label>
          <label>
            Ausfall-Chance (%)
            <input
              type="number"
              min="0"
              max="100"
              value={simState.settings?.outageChance ?? 2}
              onChange={(event) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    outageChance: clamp(Number.parseInt(event.target.value, 10) || 0, 0, 100),
                  },
                }))
              }
            />
          </label>
          <label>
            Ausfall-Dauer (s)
            <input
              type="number"
              min="5"
              max="1800"
              value={simState.settings?.outageDurationSec ?? 45}
              onChange={(event) =>
                updateState((currentState) => ({
                  ...currentState,
                  settings: {
                    ...normalizeSimulationSettings(currentState.settings),
                    outageDurationSec: clamp(Number.parseInt(event.target.value, 10) || 45, 5, 1800),
                  },
                }))
              }
            />
          </label>
        </div>

        <div className="sim-lab-grid">
          <section className="sim-lab-panel">
            <h3>{editingGatewayId ? 'Gateway bearbeiten' : 'Gateway anlegen'}</h3>
            <div className="sim-lab-panel-content">
              <form className="sim-lab-form" onSubmit={saveGateway}>
              <label>
                Name
                <input
                  type="text"
                  value={gatewayForm.name}
                  onChange={(event) => setGatewayForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Kennung (MQTT Device ID)
                <input
                  type="text"
                  value={gatewayForm.code}
                  onChange={(event) => setGatewayForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="z.B. gw-rathaus-01"
                  required
                />
              </label>
              <div className="sim-lab-coords">
                <label>
                  Breitengrad
                  <input
                    type="number"
                    step="0.000001"
                    value={gatewayForm.latitude}
                    onChange={(event) => setGatewayForm((prev) => ({ ...prev, latitude: event.target.value }))}
                  />
                </label>
                <label>
                  Längengrad
                  <input
                    type="number"
                    step="0.000001"
                    value={gatewayForm.longitude}
                    onChange={(event) => setGatewayForm((prev) => ({ ...prev, longitude: event.target.value }))}
                  />
                </label>
              </div>
              <button
                type="button"
                className="sim-lab-action sim-lab-map-button"
                onClick={() => setCoordinateModalTarget('gateway')}
              >
                Karte öffnen
              </button>
              <div className="sim-lab-toggle-wrap sim-lab-inline-toggle">
                <span>Gateway aktiv</span>
                <SimulationSwitch
                  checked={gatewayForm.enabled}
                  onChange={(isEnabled) => setGatewayForm((prev) => ({ ...prev, enabled: isEnabled }))}
                  label="Gateway aktiv"
                />
              </div>
              <div className="sim-lab-form-actions">
                <button type="submit" className="sim-lab-action sim-lab-action--primary">
                  {editingGatewayId ? 'Gateway speichern' : 'Gateway hinzufügen'}
                </button>
                {editingGatewayId ? (
                  <button
                    type="button"
                    className="sim-lab-action"
                    onClick={() => {
                      setEditingGatewayId(null)
                      setGatewayForm(EMPTY_GATEWAY_FORM)
                    }}
                  >
                    Abbrechen
                  </button>
                ) : null}
              </div>
            </form>

            <ul className="sim-lab-list">
              {simState.gateways.map((gateway) => (
                <li key={gateway.id}>
                  <article className="sim-lab-item">
                    <div>
                      <h4>{gateway.name}</h4>
                      <p>Kennung: {gateway.code || '–'}</p>
                      <p>
                        Position: {formatCoordinate(gateway.latitude)}, {formatCoordinate(gateway.longitude)}
                      </p>
                    </div>
                    <div className="sim-lab-item-actions">
                      <SimulationSwitch
                        checked={gateway.enabled !== false}
                        onChange={(isEnabled) => toggleGateway(gateway.id, isEnabled)}
                        label="Gateway aktiv"
                      />
                      <button type="button" className="sim-lab-link" onClick={() => editGateway(gateway)}>
                        Bearbeiten
                      </button>
                      <button type="button" className="sim-lab-link sim-lab-link--danger" onClick={() => deleteGateway(gateway.id)}>
                        Löschen
                      </button>
                    </div>
                  </article>
                </li>
              ))}
              {simState.gateways.length === 0 ? <li className="sim-lab-empty">Noch keine Gateways angelegt.</li> : null}
            </ul>
            </div>
          </section>

          <section className="sim-lab-panel">
            <h3>{editingSensorId ? 'Sensor bearbeiten' : 'Sensor anlegen'}</h3>
            <div className="sim-lab-panel-content">
              <form className="sim-lab-form" onSubmit={saveSensor}>
              <label>
                Sensorname
                <input
                  type="text"
                  value={sensorForm.name}
                  onChange={(event) => setSensorForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <div className="sim-lab-coords">
                <label>
                  Typ
                  <select
                    value={sensorForm.sensorTypeId}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, sensorTypeId: event.target.value }))}
                  >
                    {resolvedSensorTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Profil
                  <select
                    value={sensorForm.profile}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, profile: event.target.value }))}
                  >
                    {SENSOR_PROFILE_OPTIONS.map((profileName) => (
                      <option key={profileName} value={profileName}>
                        {profileName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="sim-lab-coords">
                <label>
                  Intervall (s)
                  <input
                    type="number"
                    min="1"
                    value={sensorForm.intervalSec}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, intervalSec: event.target.value }))}
                  />
                </label>
                <label>
                  Gateway
                  <select
                    value={sensorForm.gatewayId}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, gatewayId: event.target.value }))}
                  >
                    <option value="">Ohne Gateway</option>
                    {simState.gateways.map((gateway) => (
                      <option key={gateway.id} value={gateway.id}>
                        {gateway.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="sim-lab-coords">
                <label>
                  Breitengrad
                  <input
                    type="number"
                    step="0.000001"
                    value={sensorForm.latitude}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, latitude: event.target.value }))}
                  />
                </label>
                <label>
                  Längengrad
                  <input
                    type="number"
                    step="0.000001"
                    value={sensorForm.longitude}
                    onChange={(event) => setSensorForm((prev) => ({ ...prev, longitude: event.target.value }))}
                  />
                </label>
              </div>
              <button
                type="button"
                className="sim-lab-action sim-lab-map-button"
                onClick={() => setCoordinateModalTarget('sensor')}
              >
                Karte öffnen
              </button>
              <div className="sim-lab-toggle-wrap sim-lab-inline-toggle">
                <span>Sensor aktiv</span>
                <SimulationSwitch
                  checked={sensorForm.enabled}
                  onChange={(isEnabled) => setSensorForm((prev) => ({ ...prev, enabled: isEnabled }))}
                  label="Sensor aktiv"
                />
              </div>
              <div className="sim-lab-form-actions">
                <button type="submit" className="sim-lab-action sim-lab-action--primary">
                  {editingSensorId ? 'Sensor speichern' : 'Sensor hinzufügen'}
                </button>
                {editingSensorId ? (
                  <button
                    type="button"
                    className="sim-lab-action"
                    onClick={() => {
                      setEditingSensorId(null)
                      setSensorForm({
                        ...EMPTY_SENSOR_FORM,
                        sensorTypeId: String(resolvedSensorTypes[0]?.id ?? 1),
                      })
                    }}
                  >
                    Abbrechen
                  </button>
                ) : null}
              </div>
            </form>

            <ul className="sim-lab-list">
              {simState.sensors.map((sensor) => (
                <li key={sensor.id}>
                  <article className="sim-lab-item">
                    <div>
                      <h4>{sensor.name}</h4>
                      <p>MQTT Sensor-ID: {sensor.mqttSensorId || '–'}</p>
                      <p>Typ: {sensorTypeNameById.get(Number(sensor.sensorTypeId)) || sensor.type || 'custom'}</p>
                      <p>Profil: {resolveSensorProfile(sensor, simState.settings?.profile || 'weather')}</p>
                      <p>
                        Gateway: {sensor.gatewayId ? gatewaysById.get(sensor.gatewayId)?.name || 'Unbekannt' : 'Ohne Gateway'}
                      </p>
                      <p>
                        Position: {formatCoordinate(sensor.latitude)}, {formatCoordinate(sensor.longitude)}
                      </p>
                      <p>
                        Letzter Wert: {sensor.lastValue ?? '–'} · Aktualisiert: {formatTime(sensor.lastUpdatedAt)}
                      </p>
                      <p>Status: {sensor.lastStatus || '–'}</p>
                      <p
                        className={`sim-lab-verify-status sim-lab-verify-status--${backendConfirmations[sensor.id]?.status || 'idle'}`}
                      >
                        {backendConfirmations[sensor.id]?.status === 'confirmed'
                          ? `Backend: bestätigt (${backendConfirmations[sensor.id]?.latencyMs} ms)`
                          : backendConfirmations[sensor.id]?.status === 'pending'
                          ? 'Backend: warte auf Bestätigung'
                          : backendConfirmations[sensor.id]?.status === 'waiting'
                          ? 'Backend: noch keine Daten'
                          : backendConfirmations[sensor.id]?.status === 'error'
                          ? `Backend: Fehler (${backendConfirmations[sensor.id]?.message})`
                          : 'Backend: kein Vergleich aktiv'}
                      </p>
                    </div>
                    <div className="sim-lab-item-actions">
                      <SimulationSwitch
                        checked={sensor.enabled !== false}
                        onChange={(isEnabled) => toggleSensor(sensor.id, isEnabled)}
                        label="Sensor aktiv"
                      />
                      <button type="button" className="sim-lab-link" onClick={() => editSensor(sensor)}>
                        Bearbeiten
                      </button>
                      <button type="button" className="sim-lab-link sim-lab-link--danger" onClick={() => deleteSensor(sensor.id)}>
                        Löschen
                      </button>
                    </div>
                  </article>
                </li>
              ))}
              {simState.sensors.length === 0 ? <li className="sim-lab-empty">Noch keine Sensoren angelegt.</li> : null}
            </ul>
            </div>
          </section>
        </div>

        <CoordinateModal
          isOpen={coordinateModalTarget === 'gateway' || coordinateModalTarget === 'sensor'}
          latitude={coordinateModalTarget === 'gateway' ? gatewayForm.latitude : sensorForm.latitude}
          longitude={coordinateModalTarget === 'gateway' ? gatewayForm.longitude : sensorForm.longitude}
          onPick={(lat, lng) => {
            if (coordinateModalTarget === 'gateway') {
              setGatewayForm((prev) => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
              return
            }
            setSensorForm((prev) => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
          }}
          onClose={() => setCoordinateModalTarget(null)}
        />
      </section>
    </div>
  )
}
