import { useEffect, useState } from 'react'
import {
  createDefaultVillageConfig,
  fromApiPayload,
  getSectionSummary,
} from '../config/configModel'
import {
  clearConfigInStorage,
  loadConfigFromStorage,
  saveConfigToStorage,
} from '../config/configStorage'

export function useVillageConfig(username) {
  const [config, setConfig] = useState(() => createDefaultVillageConfig(username))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [storageMessage, setStorageMessage] = useState('')

  useEffect(() => {
    try {
      const storedPayload = loadConfigFromStorage(username)

      if (storedPayload) {
        setConfig(fromApiPayload(storedPayload, username))
        setHasUnsavedChanges(false)
        setStorageMessage('Lokale Konfiguration geladen.')
        return
      }

      setConfig(createDefaultVillageConfig(username))
      setHasUnsavedChanges(false)
      setStorageMessage('Keine lokale Konfiguration gefunden. Standardwerte aktiv.')
    } catch {
      setConfig(createDefaultVillageConfig(username))
      setHasUnsavedChanges(false)
      setStorageMessage('Lokale Konfiguration konnte nicht gelesen werden.')
    }
  }, [username])

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

  const updateModuleSource = (moduleId, source) => {
    setConfig((currentConfig) => {
      const nextConfig = {
        ...currentConfig,
        modules: {
          ...currentConfig.modules,
          [moduleId]: {
            ...currentConfig.modules[moduleId],
            source,
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
      return markUpdated(nextConfig)
    })
  }

  const saveConfig = () => {
    try {
      const result = saveConfigToStorage(config)
      setHasUnsavedChanges(false)
      setStorageMessage(`Gespeichert: ${new Date(result.savedAt).toLocaleString('de-DE')}`)
    } catch {
      setStorageMessage('Speichern fehlgeschlagen.')
    }
  }

  const loadConfig = () => {
    try {
      const storedPayload = loadConfigFromStorage(username)

      if (!storedPayload) {
        setStorageMessage('Keine gespeicherte Konfiguration vorhanden.')
        return
      }

      setConfig(fromApiPayload(storedPayload, username))
      setHasUnsavedChanges(false)
      setStorageMessage('Gespeicherte Konfiguration geladen.')
    } catch {
      setStorageMessage('Laden fehlgeschlagen.')
    }
  }

  const resetConfig = () => {
    const defaultConfig = createDefaultVillageConfig(username)
    clearConfigInStorage(username)
    setConfig(defaultConfig)
    setHasUnsavedChanges(true)
    setStorageMessage('Auf Standardwerte zurückgesetzt. Bitte speichern, um den Stand lokal abzulegen.')
  }

  const getSummaryForSection = (sectionId) => getSectionSummary(config, sectionId)

  return {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateModuleSource,
    updateDesignField,
    hasUnsavedChanges,
    storageMessage,
    saveConfig,
    loadConfig,
    resetConfig,
  }
}
