import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import {
  createDefaultVillageConfig,
  fromApiPayload,
  getSectionSummary,
  normalizeVillageConfig,
} from '../config/configModel'
import {
  loadConfigFromStorage,
  saveConfigToStorage,
} from '../config/configStorage'
import { applyThemeToDOM, getThemeClass } from '../config/themeManager'

export function useVillageConfig(session) {
  const [config, setConfig] = useState(() => createDefaultVillageConfig('default'))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [storageMessage, setStorageMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load config from API/Storage when session is available
  useEffect(() => {
    if (!session || !session.email) return

    const loadConfigFromAPI = async () => {
      setIsLoading(true)
      try {
        // Try to load from local storage first
        const storedPayload = loadConfigFromStorage(session.email)
        if (storedPayload) {
          setConfig(fromApiPayload(storedPayload, session.email))
          setHasUnsavedChanges(false)
          setStorageMessage('Konfiguration geladen.')
          const themeClass = getThemeClass(storedPayload.config.design.themeMode, storedPayload.config.design.contrast)
          applyThemeToDOM(themeClass)
          return
        }

        // Use defaults if nothing in storage
        const defaultConfig = createDefaultVillageConfig(session.email)
        setConfig(defaultConfig)
        setHasUnsavedChanges(false)
        setStorageMessage('Neue Konfiguration erstellt.')
        applyThemeToDOM('light')
      } catch (error) {
        console.error('Failed to load config:', error)
        const defaultConfig = createDefaultVillageConfig(session.email)
        setConfig(defaultConfig)
        setStorageMessage('Fehler beim Laden - Standardwerte verwendet.')
        applyThemeToDOM('light')
      } finally {
        setIsLoading(false)
      }
    }

    loadConfigFromAPI()
  }, [session?.email])

  const markUpdated = (nextConfig) => ({
    ...nextConfig,
    meta: {
      ...nextConfig.meta,
      updatedAt: new Date().toISOString(),
    },
  })

  const updateGeneralField = (field, value) => {
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
  }

  const updateModuleEnabled = (moduleId, enabled) => {
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
  }

  const addSensor = (moduleId, sensor) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...currentConfig.modules[moduleId],
            sensors: [
              ...(currentConfig.modules[moduleId]?.sensors ?? []),
              sensor,
            ],
          },
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }

  const updateSensor = (moduleId, sensorId, updates) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...currentConfig.modules[moduleId],
            sensors: (currentConfig.modules[moduleId]?.sensors ?? []).map((sensor) =>
              sensor.id === sensorId ? { ...sensor, ...updates } : sensor,
            ),
          },
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }

  const removeSensor = (moduleId, sensorId) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...currentConfig.modules[moduleId],
            sensors: (currentConfig.modules[moduleId]?.sensors ?? []).filter((sensor) => sensor.id !== sensorId),
          },
        },
      }
      setHasUnsavedChanges(true)
      return markUpdated(nextConfig)
    })
  }

  const updateDesignField = (field, value) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        design: {
          ...currentConfig.design,
          [field]: value,
        },
      }
      setHasUnsavedChanges(true)
      const themeClass = getThemeClass(nextConfig.design.themeMode, nextConfig.design.contrast)
      applyThemeToDOM(themeClass)
      return markUpdated(nextConfig)
    })
  }

  const saveConfig = async () => {
    setIsLoading(true)
    try {
      // Save to local storage
      saveConfigToStorage(config)

      setHasUnsavedChanges(false)
      setStorageMessage('Konfiguration erfolgreich gespeichert! ✓')

      // Reset message after 3 seconds
      setTimeout(() => {
        setStorageMessage('Zuletzt gespeichert: ' + new Date().toLocaleString('de-DE'))
      }, 3000)
    } catch (error) {
      setStorageMessage('Fehler beim Speichern: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const storedPayload = loadConfigFromStorage(session.email)
      if (storedPayload) {
        setConfig(fromApiPayload(storedPayload, session.email))
        setHasUnsavedChanges(false)
        setStorageMessage('Konfiguration geladen!')
        setTimeout(() => {
          setStorageMessage('')
        }, 3000)
      } else {
        setStorageMessage('Keine gespeicherte Konfiguration gefunden.')
      }
    } catch (error) {
      setStorageMessage('Fehler beim Laden: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetConfig = async () => {
    setIsLoading(true)
    try {
      const defaultConfig = createDefaultVillageConfig(session.email)
      setConfig(defaultConfig)
      setHasUnsavedChanges(false)
      setStorageMessage('Auf Standardwerte zurückgesetzt.')
      setTimeout(() => {
        setStorageMessage('')
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const getSummaryForSection = (sectionId) => {
    return getSectionSummary(config, sectionId)
  }

  return {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
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
  }
}
