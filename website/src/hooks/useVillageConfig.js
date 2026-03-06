import { useEffect, useCallback, useState } from 'react'
import { apiClient } from '../api/client'
import {
  createDefaultVillageConfig,
  getSectionSummary,
} from '../config/configModel'
import { applyThemeToDOM, getThemeClass } from '../config/themeManager'

export function useVillageConfig(session) {
  const [config, setConfig] = useState(() => createDefaultVillageConfig('default'))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [storageMessage, setStorageMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [villageId, setVillageId] = useState(null)
  const [sensorTypes, setSensorTypes] = useState([])
  const [nextSensorId, setNextSensorId] = useState(-1) // Für neue Sensoren
  const [nextDeviceId, setNextDeviceId] = useState(-1)

  const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

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
          sensors: (village.sensors || []).map(sensor => ({
            id: sensor.id,
            name: sensor.name,
            type: sensor.sensorType?.name || 'Unknown',
            sensorTypeId: sensor.sensorTypeId,
            active: sensor.isActive,
            infoText: sensor.infoText || '',
            deviceId: sensor.device?.id ?? null,
            deviceIdentifier: sensor.device?.deviceId || '',
            latitude: sensor.latitude ?? '',
            longitude: sensor.longitude ?? '',
          })),
          devices: (village.devices || []).map(device => ({
            id: device.id,
            deviceId: device.deviceId,
            name: device.name || '',
            latitude: device.latitude ?? '',
            longitude: device.longitude ?? '',
          })),
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
        sensors: (village.sensors || []).map(sensor => ({
          id: sensor.id,
          name: sensor.name,
          type: sensor.sensorType?.name || 'Unknown',
          sensorTypeId: sensor.sensorTypeId,
          active: sensor.isActive,
          infoText: sensor.infoText || '',
          deviceId: sensor.device?.id ?? null,
          deviceIdentifier: sensor.device?.deviceId || '',
          latitude: sensor.latitude ?? '',
          longitude: sensor.longitude ?? '',
        })),
        devices: (village.devices || []).map(device => ({
          id: device.id,
          deviceId: device.deviceId,
          name: device.name || '',
          latitude: device.latitude ?? '',
          longitude: device.longitude ?? '',
        })),
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
  }
}
