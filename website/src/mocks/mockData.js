export const TEST_ACCOUNT = {
  id: 1,
  sub: 1,
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user'],
}

export const TEST_PASSWORD = 'TestPassword123!'

// JWT payload: { "sub": 1, "email": "test@example.com" }
export const FAKE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.mock-signature'

const SENSOR_TYPES = [
  { id: 1, name: 'Temperatur', unit: '°C' },
  { id: 2, name: 'Luftfeuchte', unit: '%' },
  { id: 3, name: 'Luftqualität', unit: 'AQI' },
  { id: 4, name: 'Mitfahrbank', unit: 'Personen' },
]

const VILLAGE_BY_ACCOUNT_ID = {
  1: {
    id: 1,
    name: 'Musterdorf',
    locationName: 'Ortsmitte',
    phone: '+49 761 12345678',
    statusText: 'Alles läuft stabil.',
    infoText: 'Mock-Daten für die Entwicklung des Sensor-Tabs.',
    contactEmail: 'test@example.com',
    contactPhone: '+49 761 12345678',
    municipalityCode: 'SV-MOCK',
    postalCodeId: 101,
    postalCode: {
      id: 101,
      zipCode: '79098',
      city: 'Freiburg',
      latitude: 47.9959,
      longitude: 7.8522,
    },
    devices: [
      {
        id: 11,
        deviceId: 'gw-freiburg-01',
        name: 'Gateway Rathaus',
        latitude: 47.9964,
        longitude: 7.8518,
        discovered: true,
        status: 'ACTIVE',
      },
      {
        id: 12,
        deviceId: 'gw-freiburg-02',
        name: 'Gateway Marktplatz',
        latitude: 47.9952,
        longitude: 7.8531,
        discovered: true,
        status: 'ACTIVE',
      },
    ],
    sensors: [
      {
        id: 1011,
        name: 'Temp Rathaus',
        sensorTypeId: 1,
        sensorType: { id: 1, name: 'Temperatur', unit: '°C' },
        isActive: true,
        receiveData: true,
        infoText: 'Misst die Temperatur am Rathaus.',
        device: { id: 11, deviceId: 'gw-freiburg-01' },
        latitude: 47.9964,
        longitude: 7.8518,
        discovered: true,
        status: 'ACTIVE',
        lastValue: 21.7,
        lastStatus: 'ok',
        lastTs: '2026-03-07T09:12:00.000Z',
      },
      {
        id: 1012,
        name: 'Luftfeuchte Rathaus',
        sensorTypeId: 2,
        sensorType: { id: 2, name: 'Luftfeuchte', unit: '%' },
        isActive: true,
        receiveData: true,
        infoText: 'Relative Luftfeuchte im Zentrum.',
        device: { id: 11, deviceId: 'gw-freiburg-01' },
        latitude: 47.9965,
        longitude: 7.8516,
        discovered: true,
        status: 'ACTIVE',
        lastValue: 54,
        lastStatus: 'ok',
        lastTs: '2026-03-07T09:10:00.000Z',
      },
      {
        id: 1013,
        name: 'Feinstaub Markt',
        sensorTypeId: 3,
        sensorType: { id: 3, name: 'Luftqualität', unit: 'AQI' },
        isActive: true,
        receiveData: true,
        infoText: 'Luftqualität am Marktplatz.',
        device: { id: 12, deviceId: 'gw-freiburg-02' },
        latitude: 47.9951,
        longitude: 7.8530,
        discovered: true,
        status: 'ACTIVE',
        lastValue: 42,
        lastStatus: 'ok',
        lastTs: '2026-03-07T09:11:00.000Z',
      },
      {
        id: 1014,
        name: 'Mitfahrbank Dorfplatz',
        sensorTypeId: 4,
        sensorType: { id: 4, name: 'Mitfahrbank', unit: 'Personen' },
        isActive: true,
        receiveData: true,
        infoText: 'Wartende Personen am Dorfplatz.',
        device: { id: 12, deviceId: 'gw-freiburg-02' },
        latitude: 47.9950,
        longitude: 7.8533,
        discovered: true,
        status: 'ACTIVE',
        lastValue: 2,
        lastStatus: 'ok',
        lastTs: '2026-03-07T09:09:00.000Z',
      },
    ],
  },
}

export function createMockDb() {
  const villages = JSON.parse(JSON.stringify(VILLAGE_BY_ACCOUNT_ID))
  return {
    villages,
    sensorTypes: [...SENSOR_TYPES],
    nextSensorId: 2000,
    nextDeviceId: 3000,
  }
}
