import { useEffect, useCallback, useState } from 'react'
import { apiClient } from '../api/client'
import {
  createDefaultVillageConfig,
  getSectionSummary,
} from '../config/configModel'
import { applyThemeToDOM, getThemeClass } from '../config/themeManager'

const DEFAULT_MODULES = {
  weather: { enabled: true, sensors: [] },
  rideShareBench: { enabled: true, sensors: [] },
  textileContainer: { enabled: true, sensors: [] },
  energyMonitor: { enabled: true, sensors: [] },
  wasteCalendar: { enabled: false, sensors: [] },
}

const DEFAULT_CONTENT = {
  news: { enabled: true },
  events: { enabled: true },
}

function normalizeFeatureToggles(config) {
  return {
    ...config,
    modules: {
      ...DEFAULT_MODULES,
      ...(config.modules || {}),
    },
    content: {
      ...DEFAULT_CONTENT,
      ...(config.content || {}),
    },
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

  // Load village data and sensor types from API
  useEffect(() => {
    if (!session || !session.email || !session.token) return

    const loadDataFromAPI = async () => {
      setIsLoading(true)
      try {
        // Use sub from session (now extracted during login)
        const accountId = session.sub
        if (!accountId) {
          setStorageMessage('Daten konnten nicht geladen werden.')
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
          },
          modules: {
            weather: { enabled: true, sensors: [] },
            rideShareBench: { enabled: true, sensors: [] },
            textileContainer: { enabled: true, sensors: [] },
            energyMonitor: { enabled: true, sensors: [] },
            wasteCalendar: { enabled: false, sensors: [] },
          },
          content: {
            news: { enabled: true },
            events: { enabled: true },
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
          })),
        }

        setConfig(normalizeFeatureToggles(newConfig))
        setHasUnsavedChanges(false)
        setStorageMessage('Konfiguration vom Server geladen')
        applyThemeToDOM('light')
      } catch (error) {
        console.error('Failed to load config from API:', error)
        setStorageMessage('Daten konnten nicht geladen werden.')
        // Fallback to defaults
        const defaultConfig = createDefaultVillageConfig(session.email)
        setConfig(normalizeFeatureToggles(defaultConfig))
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

  const updateContentEnabled = useCallback((contentId, enabled) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        content: {
          ...(currentConfig.content || {}),
          [contentId]: {
            ...(currentConfig.content?.[contentId] || {}),
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
        active: true,
        infoText: sensorData.infoText || '',
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
      setStorageMessage('Speichern aktuell nicht möglich.')
      return false
    }

    setIsLoading(true)
    try {
      // Update village data
      await apiClient.villages.update(villageId, {
        name: config.general.villageName,
        locationName: config.general.locationName,
        phone: config.general.phone,
        infoText: config.general.infoText,
        contactEmail: config.general.contactEmail,
        contactPhone: config.general.contactPhone,
        municipalityCode: config.general.municipalityCode,
      })

      // Handle sensors
      for (const sensor of config.sensors || []) {
        if (sensor.id < 0) {
          // New sensor - create
          const created = await apiClient.sensors.create(
            villageId,
            sensor.sensorTypeId,
            sensor.name,
            sensor.infoText
          )
          // Update the sensor ID in config
          setConfig(prev => ({
            ...prev,
            sensors: (prev.sensors || []).map(s =>
              s.id === sensor.id ? { ...s, id: created.id } : s
            ),
          }))
        } else {
          // Existing sensor - update
          await apiClient.sensors.update(sensor.id, {
            name: sensor.name,
            infoText: sensor.infoText,
            isActive: sensor.active,
          })
        }
      }

      setHasUnsavedChanges(false)
      setStorageMessage('Erfolgreich gespeichert')
      return true
    } catch (error) {
      console.error('Save failed:', error)
      setStorageMessage('Änderungen konnten nicht gespeichert werden.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [villageId, config])

  // Reload from API
  const loadConfig = useCallback(async () => {
    if (!villageId) {
      setStorageMessage('Laden aktuell nicht möglich.')
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
        },
        sensors: (village.sensors || []).map(sensor => ({
          id: sensor.id,
          name: sensor.name,
          type: sensor.sensorType?.name || 'Unknown',
          sensorTypeId: sensor.sensorTypeId,
          active: sensor.isActive,
          infoText: sensor.infoText || '',
        })),
      }

      setConfig(normalizeFeatureToggles(newConfig))
      setHasUnsavedChanges(false)
      setStorageMessage('Von Server neu geladen')
    } catch (error) {
      console.error('Load failed:', error)
      setStorageMessage('Daten konnten nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }, [villageId, config])

  // Reset to defaults
  const resetConfig = useCallback(async () => {
    const defaultConfig = createDefaultVillageConfig(session.email)
    setConfig(normalizeFeatureToggles(defaultConfig))
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
    updateContentEnabled,
    addSensor,
    updateSensor,
    removeSensor,
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
