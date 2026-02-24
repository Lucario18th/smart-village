import { useEffect, useState } from 'react'
import { createDefaultVillageConfig, getSectionSummary } from '../config/configModel'

export function useVillageConfig(username) {
  const [config, setConfig] = useState(() => createDefaultVillageConfig(username))

  useEffect(() => {
    setConfig(createDefaultVillageConfig(username))
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

      return markUpdated(nextConfig)
    })
  }

  const getSummaryForSection = (sectionId) => getSectionSummary(config, sectionId)

  return {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateModuleSource,
    updateDesignField,
  }
}
