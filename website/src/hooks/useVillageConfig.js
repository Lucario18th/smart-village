import { useEffect, useCallback, useState, useRef } from 'react'
import { apiClient } from '../api/client'
import {
  createDefaultVillageConfig,
  getSectionSummary,
} from '../config/configModel'
import { applyThemeToDOM, getThemeClass } from '../config/themeManager'

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
const DEFAULT_DISCOVERY_POLL_INTERVAL_MS = 10000
const DISCOVERY_POLL_INTERVAL_MS =
  Number.parseInt(import.meta.env?.VITE_DISCOVERY_POLL_INTERVAL_MS ?? DEFAULT_DISCOVERY_POLL_INTERVAL_MS, 10) ||
  DEFAULT_DISCOVERY_POLL_INTERVAL_MS
const MAX_TOAST_LENGTH = 160
const TOAST_DISMISS_MS = 4000
const truncateToast = (text) =>
  text.length > MAX_TOAST_LENGTH ? `${text.slice(0, MAX_TOAST_LENGTH - 3)}…` : text
const getSensorDisplayName = (sensor) => sensor.name ?? `Sensor ${sensor.id}`
const getDeviceDisplayName = (device) =>
  device.name ?? device.deviceId ?? TOAST_MESSAGES.deviceFallback
const mapSensors = (sensorsFromApi) =>
  (sensorsFromApi || []).map((sensor) => {
    const statusValue =
      sensor.status?.status ||
      sensor.status ||
      (sensor.isActive ? STATUS.ACTIVE : STATUS.INACTIVE)
    return {
      id: sensor.id,
      name: sensor.name,
      type: sensor.sensorType?.name || 'Unknown',
      sensorTypeId: sensor.sensorTypeId,
      active: sensor.isActive,
      receiveData: sensor.receiveData ?? true,
      infoText: sensor.infoText || '',
      deviceId: sensor.device?.id ?? null,
      deviceIdentifier: sensor.device?.deviceId || '',
      latitude: sensor.latitude ?? '',
      longitude: sensor.longitude ?? '',
      discovered: !!sensor.discovered,
      status: statusValue,
      lastValue: sensor.lastValue ?? null,
      lastStatus: sensor.lastStatus ?? null,
      lastTs: sensor.lastTs ?? null,
      unit: sensor.sensorType?.unit || sensor.lastUnit || '',
    }
  })
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

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    configRef.current = config
    sensorIdsRef.current = new Set((config.sensors || []).map((s) => s.id))
    deviceIdsRef.current = new Set((config.devices || []).map((d) => d.id))
  }, [config])

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

        setVillageId(accountId)

        // Load sensor types
        const types = await apiClient.sensorTypes.list()
        setSensorTypes(types)

        // Load village data
        const village = await apiClient.villages.get(accountId)

        // Build config from API response
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
            infoText: village.infoText || '',
            contactEmail: village.contactEmail || session.email,
            contactPhone: village.contactPhone || '',
            municipalityCode: village.municipalityCode || '',
            postalCode: village.postalCode?.postalCode || '',
            city: village.postalCode?.city || '',
            postalCodeId: village.postalCodeId || village.postalCode?.id || null,
            lat: village.postalCode?.lat ?? null,
            lng: village.postalCode?.lng ?? null,
          },
          modules: {
            sensors: { enabled: true },
            weather: { enabled: false },
            news: { enabled: false },
            events: { enabled: false },
          },
          design: {
            themeMode: 'light',
            contrast: 'normal',
            primaryColor: '#3498db',
          },
          sensors: mapSensors(village.sensors),
          devices: mapDevices(village.devices),
        }

        setConfig(newConfig)
        setHasUnsavedChanges(false)
        setStorageMessage('Konfiguration vom Server geladen')
        applyThemeToDOM('light')
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

  // Update bestehenden sensor
  const updateSensor = useCallback((sensorId, updates) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        sensors: (currentConfig.sensors || []).map(sensor =>
          sensor.id === sensorId ? { ...sensor, ...updates } : sensor
        ),
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

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

  const updateDevice = useCallback((deviceId, updates) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        devices: (currentConfig.devices || []).map(device =>
          device.id === deviceId ? { ...device, ...updates } : device
        ),
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }, [])

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
        infoText: config.general.infoText,
        contactEmail: config.general.contactEmail,
        contactPhone: config.general.contactPhone,
        municipalityCode: config.general.municipalityCode,
        postalCodeId: config.general.postalCodeId,
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
          infoText: village.infoText || '',
          contactEmail: village.contactEmail || config.meta.email,
          contactPhone: village.contactPhone || '',
          municipalityCode: village.municipalityCode || '',
          postalCode: village.postalCode?.postalCode || '',
          city: village.postalCode?.city || '',
          postalCodeId: village.postalCodeId || village.postalCode?.id || null,
          lat: village.postalCode?.lat ?? null,
          lng: village.postalCode?.lng ?? null,
        },
        sensors: mapSensors(village.sensors),
        devices: mapDevices(village.devices),
      }

      setConfig(newConfig)
      setHasUnsavedChanges(false)
      setStorageMessage('Von Server neu geladen')
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
  }, [session.email])

  const getSummaryForSection = useCallback((sectionId) => {
    return getSectionSummary(config, sectionId)
  }, [config])

  // Auto-refresh to pick up discovered devices/sensors
  useEffect(() => {
    if (!villageId || !session?.token) return undefined
    const interval = setInterval(async () => {
      // Avoid overwriting local edits while unsaved changes are pending
      if (hasUnsavedChanges) return
      try {
        const village = await apiClient.villages.get(villageId)
        const fetchedSensors = mapSensors(village.sensors)
        const fetchedDevices = mapDevices(village.devices)
        const sensorMap = new Map(fetchedSensors.map((s) => [s.id, s]))
        const deviceMap = new Map(fetchedDevices.map((d) => [d.id, d]))

        const newSensors = fetchedSensors.filter((s) => !sensorIdsRef.current.has(s.id))
        const newDevices = fetchedDevices.filter((d) => !deviceIdsRef.current.has(d.id))

        if (newSensors.length === 0 && newDevices.length === 0) {
          return
        }

        setConfig((prev) => {
          const existingSensorIdsPrev = new Set((prev.sensors || []).map((s) => s.id))
          const existingDeviceIdsPrev = new Set((prev.devices || []).map((d) => d.id))

          const updatedSensors = (prev.sensors || []).map((sensor) => {
            const latest = sensorMap.get(sensor.id)
            if (!latest) return sensor
            if (latest.status !== sensor.status || latest.discovered !== sensor.discovered) {
              return { ...sensor, status: latest.status, discovered: latest.discovered }
            }
            return sensor
          })

          const updatedDevices = (prev.devices || []).map((device) => {
            const latest = deviceMap.get(device.id)
            if (!latest) return device
            if (latest.status !== device.status || latest.discovered !== device.discovered) {
              return { ...device, status: latest.status, discovered: latest.discovered }
            }
            return device
          })

          return {
            ...prev,
            sensors: [
              ...updatedSensors,
              ...newSensors.filter((s) => !existingSensorIdsPrev.has(s.id)),
            ],
            devices: [
              ...updatedDevices,
              ...newDevices.filter((d) => !existingDeviceIdsPrev.has(d.id)),
            ],
          }
        })

        const toastParts = []
        if (newSensors.length > 0) {
          const names = newSensors.map((s) => getSensorDisplayName(s)).join(', ')
          toastParts.push(`${TOAST_MESSAGES.sensor}${names}`)
        }
        if (newDevices.length > 0) {
          const names = newDevices
            .map((d) => getDeviceDisplayName(d))
            .join(', ')
          toastParts.push(`${TOAST_MESSAGES.device}${names}`)
        }
        if (toastParts.length > 0) {
          const combined = toastParts.join(' · ')
          showToast(truncateToast(combined))
        }
      } catch (err) {
        console.error('Auto-refresh failed while syncing discovered items', err)
      }
    }, DISCOVERY_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [villageId, hasUnsavedChanges, session?.token, showToast])

  return {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
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
