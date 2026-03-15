const TILE_SIZE = 256
const DEFAULT_ZOOM = 13

const clampNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export const defaultSelectionState = {
  controllers: new Set(),
  sensors: new Set(),
}

export function buildSelectionState(devices = [], sensors = [], previous = defaultSelectionState) {
  const prevControllers = previous?.controllers ?? defaultSelectionState.controllers
  const prevSensors = previous?.sensors ?? defaultSelectionState.sensors
  const isInitialSelection = previous === defaultSelectionState

  const deviceIds = new Set(devices.map((d) => d.id))
  const sensorIds = new Set(sensors.map((s) => s.id))
  const nextControllers = new Set([...prevControllers].filter((id) => deviceIds.has(id)))
  const nextSensors = new Set([...prevSensors].filter((id) => sensorIds.has(id)))

  if (isInitialSelection) {
    devices.forEach((device) => {
      nextControllers.add(device.id)
    })

    sensors.forEach((sensor) => {
      nextSensors.add(sensor.id)
    })
  }

  return {
    controllers: nextControllers,
    sensors: nextSensors,
  }
}

export function toggleControllerSelection(controllerId, sensors = [], selection = defaultSelectionState) {
  const nextControllers = new Set(selection.controllers)
  if (nextControllers.has(controllerId)) {
    nextControllers.delete(controllerId)
  } else {
    nextControllers.add(controllerId)
  }

  // Gateway toggle is independent from sensor toggles.
  return { controllers: nextControllers, sensors: new Set(selection.sensors) }
}

export function toggleSensorSelection(sensorId, sensors = [], selection = defaultSelectionState) {
  const nextSensors = new Set(selection.sensors)
  if (nextSensors.has(sensorId)) {
    nextSensors.delete(sensorId)
  } else {
    nextSensors.add(sensorId)
  }

  // Sensor toggles are intentionally independent of gateway toggles.
  return { controllers: new Set(selection.controllers), sensors: nextSensors }
}

export function getControllerSelectionState(controllerId, sensors = [], selection = defaultSelectionState) {
  // Gateway state is no longer derived from child sensor selection.
  return {
    checked: selection.controllers.has(controllerId),
    indeterminate: false,
  }
}

export function deriveCoords(sensor, deviceMap) {
  const lat = clampNumber(sensor.latitude)
  const lng = clampNumber(sensor.longitude)
  if (lat !== null && lng !== null) {
    return { lat, lng }
  }

  const device = deviceMap.get(sensor.deviceId)
  if (!device) return null
  const dLat = clampNumber(device.latitude)
  const dLng = clampNumber(device.longitude)
  if (dLat === null || dLng === null) return null
  return { lat: dLat, lng: dLng }
}

export function deriveMarkerColor(sensor, numericRange) {
  if (sensor.kind === 'mitfahrbank') {
    const waiting = Number(sensor.waitingCount)
    if (!Number.isFinite(waiting)) return '#7c3aed'
    if (waiting <= 0) return '#00a651'
    if (waiting <= 2) return '#ff9f1a'
    return '#d90429'
  }

  const numericValue = Number(sensor.lastValue)
  if (Number.isFinite(numericValue) && numericRange && Number.isFinite(numericRange.min) && Number.isFinite(numericRange.max)) {
    const { min, max } = numericRange
    if (max === min) {
      return '#0077ff'
    }
    const ratio = (numericValue - min) / (max - min)
    if (ratio <= 1 / 3) return '#0077ff'
    if (ratio <= 2 / 3) return '#ff9f1a'
    return '#d90429'
  }

  return '#7c3aed'
}

export function buildMarkers({ sensors = [], devices = [], selection = defaultSelectionState, includeControllers = false }) {
  const deviceMap = new Map(devices.map((device) => [device.id, device]))
  const numericSensors = sensors.filter(
    (sensor) => selection.sensors.has(sensor.id) && Number.isFinite(Number(sensor.lastValue))
  )
  const numericValues = numericSensors.map((sensor) => Number(sensor.lastValue))
  const numericRange =
    numericValues.length > 0 ? { min: Math.min(...numericValues), max: Math.max(...numericValues) } : null

  const markers = []

  sensors.forEach((sensor) => {
    if (!selection.sensors.has(sensor.id)) return
    const coords = deriveCoords(sensor, deviceMap)
    if (!coords) return
    markers.push({
      id: `sensor-${sensor.id}`,
      label: sensor.name,
      type: sensor.kind === 'mitfahrbank' ? 'Mitfahrbank' : sensor.type || 'Sensor',
      lat: coords.lat,
      lng: coords.lng,
      color: deriveMarkerColor(sensor, numericRange),
      value: sensor.waitingCount ?? sensor.lastValue,
      unit: sensor.unit || '',
      lastTs: sensor.lastTs,
      controllerName: deviceMap.get(sensor.deviceId)?.name || deviceMap.get(sensor.deviceId)?.deviceId || '',
      kind: sensor.kind || 'sensor',
    })
  })

  if (includeControllers) {
    devices.forEach((device) => {
      if (!selection.controllers.has(device.id)) return
      const dLat = clampNumber(device.latitude)
      const dLng = clampNumber(device.longitude)
      if (dLat === null || dLng === null) return
      markers.push({
        id: `device-${device.id}`,
        label: device.name || device.deviceId || 'Controller',
        type: 'Controller',
        lat: dLat,
        lng: dLng,
        color: '#546e7a',
        kind: 'controller',
        value: null,
        unit: '',
        controllerName: '',
      })
    })
  }

  return markers
}

export function projectToPoint(lat, lng, center, size, zoom = DEFAULT_ZOOM) {
  const mapSize = TILE_SIZE * 2 ** zoom
  const project = (la, lo) => {
    const sinLat = Math.sin((la * Math.PI) / 180)
    const x = ((lo + 180) / 360) * mapSize
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * mapSize
    return { x, y }
  }

  const centerPoint = project(center.lat, center.lng)
  const point = project(lat, lng)
  return {
    left: size.width / 2 + (point.x - centerPoint.x),
    top: size.height / 2 + (point.y - centerPoint.y),
  }
}

export const __TESTING__ = {
  clampNumber,
}

export { DEFAULT_ZOOM }
