import { describe, expect, it } from 'vitest'
import {
  buildMarkers,
  buildSelectionState,
  defaultSelectionState,
  deriveMarkerColor,
  getControllerSelectionState,
  projectToPoint,
  toggleControllerSelection,
  toggleSensorSelection,
} from './mapViewUtils'

const baseDevices = [
  { id: 1, name: 'Controller A', latitude: 50.1, longitude: 7.1 },
  { id: 2, name: 'Controller B', latitude: 50.2, longitude: 7.2 },
]

const baseSensors = [
  { id: 10, name: 'Temp', type: 'Temperature', deviceId: 1, latitude: 50.11, longitude: 7.11, lastValue: 12, unit: '°C', kind: 'sensor' },
  { id: 11, name: 'Humidity', type: 'Humidity', deviceId: 1, latitude: 50.12, longitude: 7.12, lastValue: 60, unit: '%', kind: 'sensor' },
]

describe('mapViewUtils selection logic', () => {
  it('toggles controller independently from sensors', () => {
    const initial = buildSelectionState(baseDevices, baseSensors, defaultSelectionState)
    expect(initial.sensors.has(10)).toBe(true)
    expect(initial.sensors.has(11)).toBe(true)

    const toggledOff = toggleControllerSelection(1, baseSensors, initial)
    expect(toggledOff.controllers.has(1)).toBe(false)
    expect(toggledOff.sensors.has(10)).toBe(true)
    expect(toggledOff.sensors.has(11)).toBe(true)

    const toggledOn = toggleControllerSelection(1, baseSensors, toggledOff)
    expect(toggledOn.controllers.has(1)).toBe(true)
  })

  it('keeps controller state stable when sensor selection changes', () => {
    const initial = buildSelectionState(baseDevices, baseSensors, defaultSelectionState)
    const partial = toggleSensorSelection(10, baseSensors, initial)
    const state = getControllerSelectionState(1, baseSensors, partial)
    expect(state.indeterminate).toBe(false)
    expect(state.checked).toBe(true)
  })
})

describe('marker building and positioning', () => {
  it('falls back to controller coordinates when sensor has none', () => {
    const sensors = [
      { id: 1, name: 'NoCoord', type: 'Humidity', deviceId: 1, latitude: '', longitude: '', lastValue: 40, unit: '%', kind: 'sensor' },
    ]
    const selection = { controllers: new Set(), sensors: new Set([1]) }
    const markers = buildMarkers({ sensors, devices: baseDevices, selection })
    expect(markers).toHaveLength(1)
    expect(markers[0].lat).toBeCloseTo(baseDevices[0].latitude)
    expect(markers[0].lng).toBeCloseTo(baseDevices[0].longitude)
  })

  it('applies mitfahrbank color rules and numeric buckets', () => {
    const mitfahrbank = {
      id: 99,
      name: 'Bank',
      type: 'Mitfahrbank',
      deviceId: 2,
      latitude: 50.2,
      longitude: 7.2,
      lastValue: null,
      waitingCount: 3,
      unit: 'Personen',
      kind: 'mitfahrbank',
    }
    const selection = { controllers: new Set(), sensors: new Set([mitfahrbank.id]) }
    const markers = buildMarkers({ sensors: [mitfahrbank], devices: baseDevices, selection })
    expect(markers[0].color).toBe('#c62828')

    const lowColor = deriveMarkerColor({ lastValue: 1, kind: 'sensor' }, { min: 0, max: 30 })
    const midColor = deriveMarkerColor({ lastValue: 15, kind: 'sensor' }, { min: 0, max: 30 })
    const highColor = deriveMarkerColor({ lastValue: 28, kind: 'sensor' }, { min: 0, max: 30 })
    expect([lowColor, midColor, highColor]).toEqual(['#42a5f5', '#ffb300', '#ef5350'])
  })

  it('projects coordinates to stable map points', () => {
    const point = projectToPoint(50, 7, { lat: 50, lng: 7 }, { width: 400, height: 300 })
    expect(point.left).toBeCloseTo(200)
    expect(point.top).toBeCloseTo(150)
  })
})
