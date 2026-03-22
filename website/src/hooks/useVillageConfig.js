import { useEffect, useCallback, useState, useRef } from 'react'
import { apiClient } from '../api/client'
import {
  createDefaultVillageConfig,
  getSectionSummary,
} from '../config/configModel'
import { applyThemeToDOM, getThemeClass } from '../config/themeManager'

const ADMIN_DESIGN_STORAGE_PREFIX = 'smart-village-admin-design'

const TOAST_MESSAGES = {
  sensor: 'Neuer Sensor entdeckt: ',
  device: 'Neues Gerät entdeckt: ',
  deviceFallback: 'Neues Gerät',
}
const STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}
// Default set to 5s to satisfy auto-refresh requirement while remaining configurable via env
const DEFAULT_DISCOVERY_POLL_INTERVAL_MS = 5000
const DISCOVERY_POLL_INTERVAL_MS =
  Number.parseInt(import.meta.env?.VITE_DISCOVERY_POLL_INTERVAL_MS ?? DEFAULT_DISCOVERY_POLL_INTERVAL_MS, 10) ||
  DEFAULT_DISCOVERY_POLL_INTERVAL_MS
const AUTO_REFRESH_ENABLED = (import.meta.env?.VITE_AUTO_REFRESH_ENABLED ?? 'true') !== 'false'
const TOAST_BUFFER_MS = 1200
const MAX_TOAST_LENGTH = 160
const TOAST_DISMISS_MS = 7000
const truncateToast = (text) =>
  text.length > MAX_TOAST_LENGTH ? `${text.slice(0, MAX_TOAST_LENGTH - 3)}…` : text
const getSensorDisplayName = (sensor) => sensor.name ?? `Sensor ${sensor.id}`
const getDeviceDisplayName = (device) =>
  device.name ?? device.deviceId ?? TOAST_MESSAGES.deviceFallback
const SENSOR_TYPE_NAME_MAP = {
  temperature: 'Temperatur',
  humidity: 'Luftfeuchte',
  'air quality': 'Luftqualität',
  pressure: 'Luftdruck',
  rainfall: 'Niederschlag',
  'wind speed': 'Windgeschwindigkeit',
  'solar radiation': 'Solarstrahlung',
  'soil moisture': 'Bodenfeuchte',
  co2: 'CO₂',
  people: 'Personen',
}
const SENSOR_UNIT_MAP = {
  degc: '°C',
  celsius: '°C',
  people: 'Personen',
}
const localizeSensorTypeName = (name) => {
  if (!name || typeof name !== 'string') return 'Unbekannt'
  return SENSOR_TYPE_NAME_MAP[name.trim().toLowerCase()] || name
}
const localizeSensorUnit = (unit) => {
  if (!unit || typeof unit !== 'string') return ''
  return SENSOR_UNIT_MAP[unit.trim().toLowerCase()] || unit
}
const isMitfahrbankSensor = (sensorTypeName) =>
  typeof sensorTypeName === 'string' && sensorTypeName.trim().toLowerCase() === 'mitfahrbank'

const getDesignStorageKey = (accountId) => `${ADMIN_DESIGN_STORAGE_PREFIX}:${accountId}`

const loadStoredDesign = (accountId) => {
  if (!accountId) return null
  try {
    const raw = localStorage.getItem(getDesignStorageKey(accountId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
      contrast: parsed.contrast === 'high' ? 'high' : 'standard',
      primaryColor: typeof parsed.primaryColor === 'string' ? parsed.primaryColor : '#3498db',
    }
  } catch {
    return null
  }
}

const persistDesign = (accountId, design) => {
  if (!accountId || !design) return
  try {
    localStorage.setItem(getDesignStorageKey(accountId), JSON.stringify(design))
  } catch {
    // Ignore storage write errors.
  }
}

const mapSensors = (sensorsFromApi) =>
  (sensorsFromApi || []).map((sensor) => {
    const statusValue =
      sensor.status?.status ||
      sensor.status ||
      (sensor.isActive ? STATUS.ACTIVE : STATUS.INACTIVE)
    const isMitfahrbank = isMitfahrbankSensor(sensor.sensorType?.name)
    return {
      id: sensor.id,
      name: sensor.name,
      type: localizeSensorTypeName(sensor.sensorType?.name),
      sensorTypeId: sensor.sensorTypeId,
      active: sensor.isActive,
      exposeToApp: sensor.exposeToApp ?? true,
      receiveData: sensor.receiveData ?? true,
      infoText: sensor.infoText || '',
      deviceId: sensor.device?.id ?? null,
      deviceIdentifier: sensor.device?.deviceId || '',
      latitude: sensor.latitude ?? '',
      longitude: sensor.longitude ?? '',
      discovered: !!sensor.discovered,
      status: statusValue,
      dataStale: sensor.dataStale ?? false,
      lastValue: sensor.lastValue ?? null,
      lastStatus: sensor.lastStatus ?? null,
      lastTs: sensor.lastTs ?? null,
      unit: localizeSensorUnit(sensor.sensorType?.unit || sensor.lastUnit || ''),
      kind: isMitfahrbank ? 'mitfahrbank' : 'sensor',
      waitingCount: isMitfahrbank ? sensor.lastValue ?? null : null,
    }
  })
const mapSensorTypes = (typesFromApi) =>
  (typesFromApi || []).map((type) => ({
    ...type,
    name: localizeSensorTypeName(type.name),
    unit: localizeSensorUnit(type.unit),
  }))
const mapDevices = (devicesFromApi) =>
  (devicesFromApi || []).map((device) => ({
    id: device.id,
    deviceId: device.deviceId,
    name: device.name || '',
    latitude: device.latitude ?? '',
    longitude: device.longitude ?? '',
    discovered: !!device.discovered,
    status: device.status || STATUS.ACTIVE,
  }))

export const buildDiscoveryToastMessage = (newSensors, newDevices) => {
  const parts = []
  if (newSensors.length > 0) {
    const names = newSensors.map((s) => getSensorDisplayName(s)).join(', ')
    parts.push(`${TOAST_MESSAGES.sensor}${names}`)
  }
  if (newDevices.length > 0) {
    const names = newDevices.map((d) => getDeviceDisplayName(d)).join(', ')
    parts.push(`${TOAST_MESSAGES.device}${names}`)
  }
  if (parts.length === 0) return ''
  return truncateToast(parts.join(' · '))
}

export const mergeFetchedVillageData = (prevConfig, fetchedSensors, fetchedDevices) => {
  const prevSensorIds = new Set((prevConfig.sensors || []).map((s) => s.id))
  const prevDeviceIds = new Set((prevConfig.devices || []).map((d) => d.id))

  const newSensors = fetchedSensors.filter((s) => !prevSensorIds.has(s.id))
  const newDevices = fetchedDevices.filter((d) => !prevDeviceIds.has(d.id))

  return {
    nextConfig: {
      ...prevConfig,
      sensors: fetchedSensors,
      devices: fetchedDevices,
    },
    newSensors,
    newDevices,
  }
}

export function useVillageConfig(session) {
  const [config, setConfig] = useState(() => createDefaultVillageConfig('default'))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [storageMessage, setStorageMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [villageId, setVillageId] = useState(null)
  const [sensorTypes, setSensorTypes] = useState([])
  const [nextSensorId, setNextSensorId] = useState(-1) // Für neue Sensoren
  const [nextDeviceId, setNextDeviceId] = useState(-1)
  const [toast, setToast] = useState(null)
  const configRef = useRef(config)
  const toastTimeoutRef = useRef(null)
  const sensorIdsRef = useRef(new Set())
  const deviceIdsRef = useRef(new Set())
  const discoveryBufferRef = useRef({ sensors: [], devices: [] })
  const discoveryToastTimeoutRef = useRef(null)

  const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast({ id: Date.now(), message })
    toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DISMISS_MS)
  }, [])

  const scheduleDiscoveryToast = useCallback(
    (newSensors, newDevices) => {
      if (newSensors.length === 0 && newDevices.length === 0) return

      const current = discoveryBufferRef.current
      const mergedSensors = [...current.sensors]
      const mergedDevices = [...current.devices]

      newSensors.forEach((sensor) => {
        if (!mergedSensors.some((s) => s.id === sensor.id)) {
          mergedSensors.push(sensor)
        }
      })
      newDevices.forEach((device) => {
        if (!mergedDevices.some((d) => d.id === device.id)) {
          mergedDevices.push(device)
        }
      })

      discoveryBufferRef.current = { sensors: mergedSensors, devices: mergedDevices }

      if (discoveryToastTimeoutRef.current) {
        clearTimeout(discoveryToastTimeoutRef.current)
      }
      discoveryToastTimeoutRef.current = setTimeout(() => {
        const message = buildDiscoveryToastMessage(
          discoveryBufferRef.current.sensors,
          discoveryBufferRef.current.devices
        )
        if (message) {
          showToast(message)
        }
        discoveryBufferRef.current = { sensors: [], devices: [] }
        discoveryToastTimeoutRef.current = null
      }, TOAST_BUFFER_MS)
    },
    [showToast]
  )

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
      if (discoveryToastTimeoutRef.current) {
        clearTimeout(discoveryToastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    configRef.current = config
    sensorIdsRef.current = new Set((config.sensors || []).map((s) => s.id))
    deviceIdsRef.current = new Set((config.devices || []).map((d) => d.id))
  }, [config])

  useEffect(() => {
    if (!session?.sub) return
    persistDesign(session.sub, config.design)
  }, [session?.sub, config.design])

  // Load village data and sensor types from API
  useEffect(() => {
    if (!session || !session.email || !session.token) return

    const loadDataFromAPI = async () => {
      setIsLoading(true)
      try {
        // Use sub from session (now extracted during login)
        const accountId = session.sub
        if (!accountId) {
          setStorageMessage('Fehler: Account ID nicht gefunden')
          return
        }

        const me = await apiClient.auth.getMe()
        const managedVillageId = me?.villages?.[0]?.id ?? accountId
        setVillageId(managedVillageId)

        // Load sensor types
        const types = await apiClient.sensorTypes.list()
        setSensorTypes(mapSensorTypes(types))

        // Load village data
        const village = await apiClient.villages.get(managedVillageId)

        // Build config from API response
        const storedDesign = loadStoredDesign(accountId)
        const newConfig = {
          meta: {
            id: village.id,
            email: session.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          general: {
            villageName: village.name || '',
            locationName: village.locationName || '',
            phone: village.phone || '',
            statusText: village.statusText || '',
            infoText: village.infoText || '',
            contactEmail: village.contactEmail || session.email,
            contactPhone: village.contactPhone || '',
            municipalityCode: village.municipalityCode || '',
            zipCode: village.postalCode?.zipCode || '',
            city: village.postalCode?.city || '',
            postalCodeId: village.postalCodeId || village.postalCode?.id || null,
            accountType: me?.accountType || 'MUNICIPAL',
            isPublicAppApiEnabled: me?.isPublicAppApiEnabled ?? true,
          },
          modules: {
            sensors: {
              enabled: village.features?.enableSensorData ?? true,
              fields: {
                name: village.features?.showSensorName ?? true,
                type: village.features?.showSensorType ?? true,
                description: village.features?.showSensorDescription ?? true,
                gateway: true,
                coordinates: village.features?.showSensorCoordinates ?? true,
                status: true,
              },
            },
            weather: { enabled: village.features?.enableWeather ?? false },
            news: { enabled: village.features?.enableMessages ?? false },
            events: { enabled: village.features?.enableEvents ?? false },
            map: { enabled: village.features?.enableMap ?? true },
            rideSharingBench: { enabled: village.features?.enableRideShare ?? true },
            oldClothesContainer: { enabled: village.features?.enableTextileContainers ?? false },
            userAssistantAi: { enabled: village.features?.enableUserAssistant ?? true },
          },
          design: {
            themeMode: storedDesign?.themeMode || 'light',
            contrast: storedDesign?.contrast || 'standard',
            primaryColor: storedDesign?.primaryColor || '#3498db',
          },
          sensors: mapSensors(village.sensors),
          devices: mapDevices(village.devices),
        }

        setConfig(newConfig)
        setHasUnsavedChanges(false)
        setStorageMessage('Konfiguration vom Server geladen')
        applyThemeToDOM(getThemeClass(newConfig.design.themeMode, newConfig.design.contrast))
      } catch (error) {
        console.error('Failed to load config from API:', error)
        setStorageMessage(`Fehler beim Laden: ${error.message}`)
        // Fallback to defaults
        const defaultConfig = createDefaultVillageConfig(session.email)
        setConfig(defaultConfig)
      } finally {
        setIsLoading(false)
      }
    }

    loadDataFromAPI()
  }, [session?.email, session?.token])

  const markUpdated = (nextConfig) => ({
    ...nextConfig,
    meta: {
      ...nextConfig.meta,
      updatedAt: new Date().toISOString(),
    },
  })

  const updateGeneralField = useCallback((field, value) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        general: {
          ...currentConfig.general,
          [field]: value,
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

  const updateModuleEnabled = useCallback((moduleId, enabled) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...currentConfig.modules[moduleId],
            enabled,
          },
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

  const updateModuleFieldEnabled = useCallback((moduleId, fieldId, enabled) => {
    setConfig((currentConfig) => {
      const moduleConfig = currentConfig.modules?.[moduleId] || {}
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...moduleConfig,
            fields: {
              ...(moduleConfig.fields || {}),
              [fieldId]: enabled,
            },
          },
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

  // Add sensor mit temporärer ID
  const addSensor = useCallback((sensorData) => {
    setConfig((currentConfig) => {
      const newSensor = {
        id: nextSensorId, // Negative IDs sind neue Sensoren
        name: sensorData.name || 'Neuer Sensor',
        type: sensorData.type || '',
        sensorTypeId: sensorData.sensorTypeId || 1,
        active: sensorData.active ?? true,
        infoText: sensorData.infoText || '',
        deviceId: sensorData.deviceId ?? null,
        latitude: sensorData.latitude ?? '',
        longitude: sensorData.longitude ?? '',
        discovered: false,
        status: STATUS.PENDING,
      }

      const nextConfig = {
        ...currentConfig,
        sensors: [...(currentConfig.sensors || []), newSensor],
      }

      setHasUnsavedChanges(true)
      setNextSensorId(nextSensorId - 1) // Decrement for next new sensor
      return markUpdated(nextConfig)
    })
  }, [nextSensorId])

  // Update bestehenden Sensor; bei persistierten IDs sofort per API speichern.
  const updateSensor = useCallback(async (sensorId, updates) => {
    const currentSensor = (configRef.current.sensors || []).find((sensor) => sensor.id === sensorId)
    const mergedSensor = currentSensor ? { ...currentSensor, ...updates } : null

    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        sensors: (currentConfig.sensors || []).map((sensor) =>
          sensor.id === sensorId ? { ...sensor, ...updates } : sensor
        ),
      }
      return markUpdated(nextConfig)
    })

    if (!mergedSensor || sensorId < 0 || !villageId) {
      setHasUnsavedChanges(true)
      return false
    }

    try {
      await apiClient.sensors.update(sensorId, {
        name: mergedSensor.name,
        infoText: mergedSensor.infoText,
        isActive: mergedSensor.active,
        receiveData: mergedSensor.receiveData,
        exposeToApp: mergedSensor.exposeToApp,
        deviceId: mergedSensor.deviceId ?? null,
        latitude: toNumberOrNull(mergedSensor.latitude),
        longitude: toNumberOrNull(mergedSensor.longitude),
      })
      setStorageMessage('Sensor erfolgreich gespeichert')
      return true
    } catch (error) {
      setHasUnsavedChanges(true)
      setStorageMessage(`Sensor konnte nicht gespeichert werden: ${error.message}`)
      return false
    }
  }, [villageId])

  const addDevice = useCallback((deviceData) => {
    setConfig((currentConfig) => {
      const newDevice = {
        id: nextDeviceId,
        deviceId: deviceData.deviceId || '',
        name: deviceData.name || '',
        latitude: deviceData.latitude ?? '',
        longitude: deviceData.longitude ?? '',
        discovered: false,
        status: STATUS.PENDING,
      }

      const nextConfig = {
        ...currentConfig,
        devices: [...(currentConfig.devices || []), newDevice],
      }
      setHasUnsavedChanges(true)
      setNextDeviceId(nextDeviceId - 1)
      return markUpdated(nextConfig)
    })
  }, [nextDeviceId])

  const updateDevice = useCallback(async (deviceId, updates) => {
    const currentDevice = (configRef.current.devices || []).find((device) => device.id === deviceId)
    const mergedDevice = currentDevice ? { ...currentDevice, ...updates } : null

    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        devices: (currentConfig.devices || []).map((device) =>
          device.id === deviceId ? { ...device, ...updates } : device
        ),
      }
      return markUpdated(nextConfig)
    })

    if (!mergedDevice || deviceId < 0 || !villageId) {
      setHasUnsavedChanges(true)
      return false
    }

    try {
      await apiClient.devices.update(deviceId, {
        name: mergedDevice.name,
        latitude: toNumberOrNull(mergedDevice.latitude),
        longitude: toNumberOrNull(mergedDevice.longitude),
      })
      setStorageMessage('Gateway erfolgreich gespeichert')
      return true
    } catch (error) {
      setHasUnsavedChanges(true)
      setStorageMessage(`Gateway konnte nicht gespeichert werden: ${error.message}`)
      return false
    }
  }, [villageId])

  // Mark sensor for deletion
  const removeSensor = useCallback((sensorId) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        sensors: (currentConfig.sensors || []).filter(sensor => sensor.id !== sensorId),
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

  const updateDesignField = useCallback((field, value) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        design: {
          ...currentConfig.design,
          [field]: value,
        },
      }

      if (field === 'themeMode' || field === 'contrast') {
        const themeClass = getThemeClass(nextConfig.design.themeMode, nextConfig.design.contrast)
        applyThemeToDOM(themeClass)
      }

      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

  // Save to backend API
  const saveConfig = useCallback(async () => {
    if (!villageId) {
      setStorageMessage('Fehler: Village ID nicht gefunden')
      return false
    }

    setIsLoading(true)
    try {
      const deviceIdMap = new Map()
      let devicesState = config.devices || []
      let sensorsState = config.sensors || []

      for (const device of config.devices || []) {
        const latitude = toNumberOrNull(device.latitude)
        const longitude = toNumberOrNull(device.longitude)

        if (device.id < 0) {
          const created = await apiClient.devices.create(villageId, {
            deviceId: device.deviceId,
            name: device.name,
            latitude,
            longitude,
          })
          deviceIdMap.set(device.id, created.id)
          devicesState = devicesState.map(d =>
            d.id === device.id
              ? {
                  ...d,
                  id: created.id,
                  latitude: created.latitude ?? '',
                  longitude: created.longitude ?? '',
                }
              : d
          )
        } else {
          const updated = await apiClient.devices.update(device.id, {
            name: device.name,
            latitude,
            longitude,
          })
          devicesState = devicesState.map(d =>
            d.id === device.id
              ? {
                  ...d,
                  name: updated.name ?? d.name,
                  latitude: updated.latitude ?? '',
                  longitude: updated.longitude ?? '',
                }
              : d
          )
        }
      }

      if (deviceIdMap.size > 0) {
        sensorsState = sensorsState.map(sensor => {
          const mappedId = deviceIdMap.get(sensor.deviceId)
          return mappedId ? { ...sensor, deviceId: mappedId } : sensor
        })
      }

      // Update village data
      await apiClient.villages.update(villageId, {
        name: config.general.villageName,
        locationName: config.general.locationName,
        phone: config.general.phone,
        statusText: config.general.statusText,
        infoText: config.general.infoText,
        contactEmail: config.general.contactEmail,
        contactPhone: config.general.contactPhone,
        municipalityCode: config.general.municipalityCode,
        postalCodeId: config.general.postalCodeId,
      })

      await apiClient.auth.updateAccountSettings(
        config.general.accountType || 'MUNICIPAL',
        config.general.isPublicAppApiEnabled ?? true,
      )

      // Update village features (module flags and sensor detail visibility)
      const modules = config.modules || {}
      await apiClient.villages.updateFeatures(villageId, {
        enableSensorData: modules.sensors?.enabled ?? true,
        enableWeather: modules.weather?.enabled ?? false,
        enableMessages: modules.news?.enabled ?? false,
        enableEvents: modules.events?.enabled ?? false,
        enableMap: modules.map?.enabled ?? true,
        enableRideShare: modules.rideSharingBench?.enabled ?? true,
        enableTextileContainers: modules.oldClothesContainer?.enabled ?? false,
        enableUserAssistant: modules.userAssistantAi?.enabled ?? true,
        showSensorName: modules.sensors?.fields?.name ?? true,
        showSensorType: modules.sensors?.fields?.type ?? true,
        showSensorDescription: modules.sensors?.fields?.description ?? true,
        showSensorCoordinates: modules.sensors?.fields?.coordinates ?? true,
      })

      // Handle sensors
      for (const sensor of config.sensors || []) {
        const latitude = toNumberOrNull(sensor.latitude)
        const longitude = toNumberOrNull(sensor.longitude)

        if (sensor.id < 0) {
          // New sensor - create
          const resolvedDeviceId =
            sensor.deviceId && sensor.deviceId < 0
              ? deviceIdMap.get(sensor.deviceId) ?? null
              : sensor.deviceId ?? null

          const created = await apiClient.sensors.create(
            villageId,
            sensor.sensorTypeId,
            sensor.name,
            sensor.infoText,
            resolvedDeviceId,
            latitude,
            longitude
          )
          sensorsState = sensorsState.map(s =>
            s.id === sensor.id ? { ...s, id: created.id } : s
          )
        } else {
          // Existing sensor - update
          const resolvedDeviceId =
            sensor.deviceId && sensor.deviceId < 0
              ? deviceIdMap.get(sensor.deviceId) ?? null
              : sensor.deviceId ?? null

          await apiClient.sensors.update(sensor.id, {
            name: sensor.name,
            infoText: sensor.infoText,
            isActive: sensor.active,
            receiveData: sensor.receiveData,
            exposeToApp: sensor.exposeToApp,
            deviceId: resolvedDeviceId,
            latitude,
            longitude,
          })
          sensorsState = sensorsState.map(s =>
            s.id === sensor.id
              ? {
                  ...s,
                  name: sensor.name,
                  infoText: sensor.infoText,
                  active: sensor.active,
                  receiveData: sensor.receiveData,
                  exposeToApp: sensor.exposeToApp,
                  deviceId: resolvedDeviceId,
                  latitude: sensor.latitude ?? '',
                  longitude: sensor.longitude ?? '',
                }
              : s
          )
        }
      }

      setConfig((prev) => ({
        ...prev,
        devices: devicesState,
        sensors: sensorsState,
      }))
      setHasUnsavedChanges(false)
      setStorageMessage('Erfolgreich gespeichert')
      return true
    } catch (error) {
      console.error('Save failed:', error)
      setStorageMessage(`Speichern fehlgeschlagen: ${error.message}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [villageId, config])

  // Reload from API
  const loadConfig = useCallback(async () => {
    if (!villageId) {
      setStorageMessage('Fehler: Village ID nicht gefunden')
      return
    }

    setIsLoading(true)
    try {
      const village = await apiClient.villages.get(villageId)
      const types = await apiClient.sensorTypes.list()
      setSensorTypes(types)

      const newConfig = {
        ...config,
        general: {
          villageName: village.name || '',
          locationName: village.locationName || '',
          phone: village.phone || '',
          statusText: village.statusText || '',
          infoText: village.infoText || '',
          contactEmail: village.contactEmail || config.meta.email,
          contactPhone: village.contactPhone || '',
          municipalityCode: village.municipalityCode || '',
          zipCode: village.postalCode?.zipCode || '',
          city: village.postalCode?.city || '',
          postalCodeId: village.postalCodeId || village.postalCode?.id || null,
          accountType: config.general.accountType || 'MUNICIPAL',
          isPublicAppApiEnabled: config.general.isPublicAppApiEnabled ?? true,
        },
        sensors: mapSensors(village.sensors),
        devices: mapDevices(village.devices),
      }

      setConfig(newConfig)
      setHasUnsavedChanges(false)
      setStorageMessage('Von Server neu geladen')
      applyThemeToDOM(getThemeClass(newConfig.design.themeMode, newConfig.design.contrast))
    } catch (error) {
      console.error('Load failed:', error)
      setStorageMessage(`Laden fehlgeschlagen: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [villageId, config])

  // Reset to defaults
  const resetConfig = useCallback(async () => {
    const defaultConfig = createDefaultVillageConfig(session.email)
    setConfig(defaultConfig)
    setHasUnsavedChanges(false)
    setStorageMessage('Auf Standardwerte zurückgesetzt')
    applyThemeToDOM(getThemeClass(defaultConfig.design.themeMode, defaultConfig.design.contrast))
  }, [session.email])

  const getSummaryForSection = useCallback((sectionId) => {
    return getSectionSummary(config, sectionId)
  }, [config])

  // Auto-refresh to pick up discovered devices/sensors
  useEffect(() => {
    if (!villageId || !session?.token || !AUTO_REFRESH_ENABLED) return undefined
    const refresh = async () => {
      if (hasUnsavedChanges) return
      try {
        const village = await apiClient.villages.get(villageId)
        const fetchedSensors = mapSensors(village.sensors)
        const fetchedDevices = mapDevices(village.devices)

        setConfig((prev) => {
          const { nextConfig, newSensors, newDevices } = mergeFetchedVillageData(
            prev,
            fetchedSensors,
            fetchedDevices
          )
          if (newSensors.length > 0 || newDevices.length > 0) {
            scheduleDiscoveryToast(newSensors, newDevices)
          }
          return nextConfig
        })
      } catch (err) {
        console.error('Auto-refresh failed while syncing discovered items', err)
      }
    }

    refresh()
    const interval = setInterval(refresh, DISCOVERY_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [villageId, hasUnsavedChanges, session?.token, scheduleDiscoveryToast])

  return {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateModuleFieldEnabled,
    addSensor,
    updateSensor,
    removeSensor,
    addDevice,
    updateDevice,
    updateDesignField,
    hasUnsavedChanges,
    storageMessage,
    saveConfig,
    loadConfig,
    resetConfig,
    isLoading,
    sensorTypes,
    toast,
    dismissToast: () => setToast(null),
  }
}

export const __TESTING__ = {
  mapSensors,
  mapDevices,
  mergeFetchedVillageData,
  buildDiscoveryToastMessage,
  isMitfahrbankSensor,
}

export { isMitfahrbankSensor }
