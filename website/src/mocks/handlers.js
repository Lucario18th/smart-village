import { http, HttpResponse } from 'msw'
import {
  TEST_ACCOUNT,
  TEST_PASSWORD,
  FAKE_TOKEN,
  createMockDb,
} from './mockData'

const db = createMockDb()

const clone = (value) => JSON.parse(JSON.stringify(value))

const findVillageBySensorId = (sensorId) => {
  const numericId = Number(sensorId)
  return Object.values(db.villages).find((village) =>
    (village.sensors || []).some((sensor) => sensor.id === numericId)
  )
}

const findVillageByDeviceId = (deviceId) => {
  const numericId = Number(deviceId)
  return Object.values(db.villages).find((village) =>
    (village.devices || []).some((device) => device.id === numericId)
  )
}

const applyVillagePatch = (village, patch) => {
  village.name = patch.name ?? village.name
  village.locationName = patch.locationName ?? village.locationName
  village.phone = patch.phone ?? village.phone
  village.infoText = patch.infoText ?? village.infoText
  village.contactEmail = patch.contactEmail ?? village.contactEmail
  village.contactPhone = patch.contactPhone ?? village.contactPhone
  village.municipalityCode = patch.municipalityCode ?? village.municipalityCode
  if (patch.postalCodeId !== undefined) {
    village.postalCodeId = patch.postalCodeId
  }
}

const toSensorType = (sensorTypeId) =>
  db.sensorTypes.find((sensorType) => sensorType.id === Number(sensorTypeId)) || db.sensorTypes[0]

const defaultLocations = [
  { id: 101, zipCode: '79098', city: 'Freiburg', state: 'BW', latitude: 47.9959, longitude: 7.8522 },
  { id: 102, zipCode: '79100', city: 'Freiburg', state: 'BW', latitude: 47.9804, longitude: 7.8421 },
  { id: 103, zipCode: '10115', city: 'Berlin', state: 'BE', latitude: 52.532, longitude: 13.3849 },
]

/**
 * Authentication handlers
 */
const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    const { email, password } = body

    // Debug: verify handler is hit (do not log plaintext password)
    console.log('MSW login handler hit', { email, password: '[REDACTED]' })

    // Validate test user credentials
    if (email === TEST_ACCOUNT.email && password === TEST_PASSWORD) {
      // IMPORTANT: match real backend response shape
      return HttpResponse.json(
        {
          accessToken: FAKE_TOKEN, // camelCase like real API
          user: TEST_ACCOUNT,
        },
        { status: 200 },
      )
    }

    // Distinguish between unknown user and wrong password for the known user
    if (email !== TEST_ACCOUNT.email) {
      return HttpResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User does not exist',
          code: 'USER_NOT_FOUND',
        },
        { status: 401 },
      )
    }

    return HttpResponse.json(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid password',
        code: 'INVALID_PASSWORD',
      },
      { status: 401 },
    )
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token === FAKE_TOKEN) {
      return HttpResponse.json(TEST_ACCOUNT, { status: 200 })
    }

    return HttpResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing token',
      },
      { status: 401 },
    )
  }),
]

const additionalHandlers = [
  http.get('/api/sensor-types', () => HttpResponse.json(clone(db.sensorTypes), { status: 200 })),

  http.get('/api/villages/:villageId', ({ params }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }
    return HttpResponse.json(clone(village), { status: 200 })
  }),

  http.put('/api/villages/:villageId', async ({ params, request }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }
    const body = await request.json()
    applyVillagePatch(village, body || {})
    return HttpResponse.json(clone(village), { status: 200 })
  }),

  http.get('/api/sensors/village/:villageId', ({ params }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }
    return HttpResponse.json(clone(village.sensors || []), { status: 200 })
  }),

  http.post('/api/sensors/village/:villageId', async ({ params, request }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }

    const body = await request.json()
    const sensorType = toSensorType(body?.sensorTypeId)
    const resolvedDevice = (village.devices || []).find((device) => device.id === Number(body?.deviceId)) || null

    const created = {
      id: db.nextSensorId++,
      name: body?.name || `Mock Sensor ${db.nextSensorId}`,
      sensorTypeId: sensorType.id,
      sensorType,
      isActive: body?.isActive ?? true,
      receiveData: body?.receiveData ?? true,
      infoText: body?.infoText || '',
      device: resolvedDevice
        ? { id: resolvedDevice.id, deviceId: resolvedDevice.deviceId }
        : null,
      latitude: body?.latitude ?? null,
      longitude: body?.longitude ?? null,
      discovered: false,
      status: 'ACTIVE',
      lastValue: null,
      lastStatus: null,
      lastTs: null,
    }

    village.sensors = [...(village.sensors || []), created]
    return HttpResponse.json(clone(created), { status: 201 })
  }),

  http.patch('/api/sensors/:sensorId', async ({ params, request }) => {
    const village = findVillageBySensorId(params.sensorId)
    if (!village) {
      return HttpResponse.json({ message: 'Sensor not found' }, { status: 404 })
    }

    const body = await request.json()
    const sensorId = Number(params.sensorId)
    const nextSensors = (village.sensors || []).map((sensor) => {
      if (sensor.id !== sensorId) return sensor
      const sensorType = body?.sensorTypeId ? toSensorType(body.sensorTypeId) : sensor.sensorType
      const resolvedDevice = body?.deviceId !== undefined
        ? (village.devices || []).find((device) => device.id === Number(body.deviceId)) || null
        : sensor.device

      return {
        ...sensor,
        name: body?.name ?? sensor.name,
        infoText: body?.infoText ?? sensor.infoText,
        isActive: body?.isActive ?? sensor.isActive,
        receiveData: body?.receiveData ?? sensor.receiveData,
        sensorTypeId: sensorType.id,
        sensorType,
        device: resolvedDevice
          ? { id: resolvedDevice.id, deviceId: resolvedDevice.deviceId }
          : null,
        latitude: body?.latitude ?? sensor.latitude,
        longitude: body?.longitude ?? sensor.longitude,
      }
    })

    village.sensors = nextSensors
    const updated = nextSensors.find((sensor) => sensor.id === sensorId)
    return HttpResponse.json(clone(updated), { status: 200 })
  }),

  http.delete('/api/sensors/:sensorId', ({ params }) => {
    const village = findVillageBySensorId(params.sensorId)
    if (!village) {
      return HttpResponse.json({ message: 'Sensor not found' }, { status: 404 })
    }

    const sensorId = Number(params.sensorId)
    village.sensors = (village.sensors || []).filter((sensor) => sensor.id !== sensorId)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/devices/village/:villageId', ({ params }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }
    return HttpResponse.json(clone(village.devices || []), { status: 200 })
  }),

  http.post('/api/devices/village/:villageId', async ({ params, request }) => {
    const village = db.villages[String(params.villageId)]
    if (!village) {
      return HttpResponse.json({ message: 'Village not found' }, { status: 404 })
    }
    const body = await request.json()
    const created = {
      id: db.nextDeviceId++,
      deviceId: body?.deviceId || `mock-device-${db.nextDeviceId}`,
      name: body?.name || 'Neues Mock Geraet',
      latitude: body?.latitude ?? null,
      longitude: body?.longitude ?? null,
      discovered: false,
      status: 'ACTIVE',
    }
    village.devices = [...(village.devices || []), created]
    return HttpResponse.json(clone(created), { status: 201 })
  }),

  http.patch('/api/devices/:deviceId', async ({ params, request }) => {
    const village = findVillageByDeviceId(params.deviceId)
    if (!village) {
      return HttpResponse.json({ message: 'Device not found' }, { status: 404 })
    }
    const body = await request.json()
    const deviceId = Number(params.deviceId)
    const nextDevices = (village.devices || []).map((device) =>
      device.id === deviceId
        ? {
            ...device,
            name: body?.name ?? device.name,
            latitude: body?.latitude ?? device.latitude,
            longitude: body?.longitude ?? device.longitude,
          }
        : device
    )
    village.devices = nextDevices
    const updated = nextDevices.find((device) => device.id === deviceId)
    return HttpResponse.json(clone(updated), { status: 200 })
  }),

  http.get('/api/locations/search', ({ request }) => {
    const url = new URL(request.url)
    const query = (url.searchParams.get('query') || '').trim().toLowerCase()
    if (query.length < 2) {
      return HttpResponse.json([], { status: 200 })
    }

    const results = defaultLocations.filter((location) => {
      const zip = location.zipCode.toLowerCase()
      const city = location.city.toLowerCase()
      const state = (location.state || '').toLowerCase()
      return zip.includes(query) || city.includes(query) || state.includes(query)
    })

    return HttpResponse.json(clone(results), { status: 200 })
  }),
]

/**
 * All handlers for MSW
 */
export const handlers = [...authHandlers, ...additionalHandlers]
