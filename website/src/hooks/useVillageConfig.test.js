import { describe, expect, it } from 'vitest'
import { __TESTING__ } from './useVillageConfig'

const { mapSensors, mapDevices, mergeFetchedVillageData, buildDiscoveryToastMessage } = __TESTING__

const baseConfig = {
  meta: {},
  general: {},
  modules: {},
  design: {},
}

describe('useVillageConfig helpers', () => {
  it('merges refreshed data and keeps sensor values up to date', () => {
    const prevConfig = {
      ...baseConfig,
      sensors: mapSensors([
        {
          id: 1,
          name: 'Temperatur',
          sensorType: { id: 1, name: 'Temperature', unit: '°C' },
          isActive: true,
          receiveData: true,
          lastValue: 10,
          lastStatus: 'OK',
          lastTs: '2024-01-01T00:00:00Z',
        },
      ]),
      devices: mapDevices([{ id: 1, deviceId: 'ctrl-1', name: 'Controller' }]),
    }

    const refreshedSensors = mapSensors([
      {
        id: 1,
        name: 'Temperatur',
        sensorType: { id: 1, name: 'Temperature', unit: '°C' },
        isActive: true,
        receiveData: true,
        lastValue: 12.5,
        lastStatus: 'OK',
        lastTs: '2024-01-01T00:01:00Z',
      },
      {
        id: 2,
        name: 'Mitfahrbank Ortsmitte',
        sensorType: { id: 9, name: 'Mitfahrbank', unit: 'Personen' },
        isActive: true,
        receiveData: true,
        lastValue: 3,
        lastStatus: 'OK',
        lastTs: '2024-01-01T00:01:30Z',
      },
    ])
    const refreshedDevices = mapDevices([
      { id: 1, deviceId: 'ctrl-1', name: 'Controller' },
      { id: 2, deviceId: 'ctrl-2', name: 'Neuer Controller' },
    ])

    const { nextConfig, newSensors, newDevices } = mergeFetchedVillageData(
      prevConfig,
      refreshedSensors,
      refreshedDevices
    )

    expect(nextConfig.sensors).toHaveLength(2)
    expect(nextConfig.sensors.find((s) => s.id === 1)?.lastValue).toBe(12.5)
    expect(nextConfig.sensors.find((s) => s.id === 2)?.waitingCount).toBe(3)
    expect(newSensors.map((s) => s.id)).toContain(2)
    expect(newDevices.map((d) => d.id)).toContain(2)
  })

  it('builds grouped discovery messages for sensors and devices', () => {
    const message = buildDiscoveryToastMessage(
      [
        { id: 10, name: 'Temperatur' },
        { id: 11, name: 'Mitfahrbank' },
      ],
      [{ id: 99, name: 'Controller A', deviceId: 'ctrl-a' }]
    )

    expect(message).toContain('Neuer Sensor')
    expect(message).toContain('Mitfahrbank')
    expect(message).toContain('Neues Gerät')
  })
})
