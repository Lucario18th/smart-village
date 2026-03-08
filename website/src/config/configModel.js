const CONFIG_SCHEMA_VERSION = 1
export const FALLBACK_LOCATION = { lat: 47.615, lng: 7.664 } // Lörrach

const BASE_CONFIG = {
  general: {
    villageName: '',
    municipalityCode: '',
    contactEmail: '',
    contactPhone: '',
    statusText: '',
    infoText: '',
    zipCode: '',
    city: '',
    postalCodeId: null,
  },
  devices: [],
  modules: {
    sensors: { enabled: true, sensors: [] },
    weather: { enabled: false, sensors: [] },
    news: { enabled: false, sensors: [] },
    events: { enabled: false, sensors: [] },
  },
  design: {
    themeMode: 'light',
    contrast: 'standard',
    iconSet: 'default',
  },
}

const VILLAGE_OVERRIDES = {
  dorf1: {
    general: {
      villageName: 'Dorf 1',
      municipalityCode: 'SV-D1',
      contactEmail: 'verwaltung@dorf1.local',
    },
    design: {
      themeMode: 'light',
      contrast: 'standard',
    },
  },
  dorf2: {
    general: {
      villageName: 'Dorf 2',
      municipalityCode: 'SV-D2',
      contactEmail: 'verwaltung@dorf2.local',
    },
    modules: {
      energyMonitor: {
        enabled: false,
      },
    },
    design: {
      themeMode: 'dark',
      contrast: 'medium',
    },
  },
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeDeep(base, override) {
  if (!isObject(base) || !isObject(override)) {
    return override ?? base
  }

  const result = { ...base }

  Object.keys(override).forEach((key) => {
    const overrideValue = override[key]
    const baseValue = base[key]

    if (isObject(baseValue) && isObject(overrideValue)) {
      result[key] = mergeDeep(baseValue, overrideValue)
      return
    }

    result[key] = overrideValue
  })

  return result
}

export function createDefaultVillageConfig(villageId) {
  const villageOverride = VILLAGE_OVERRIDES[villageId] ?? {}
  const config = mergeDeep(BASE_CONFIG, villageOverride)

  return {
    meta: {
      villageId,
      schemaVersion: CONFIG_SCHEMA_VERSION,
      updatedAt: null,
    },
    ...config,
  }
}

export function normalizeVillageConfig(rawConfig, villageId) {
  const fallback = createDefaultVillageConfig(villageId)

  if (!isObject(rawConfig)) {
    return fallback
  }

  const normalizedConfig = mergeDeep(fallback, rawConfig)

  return {
    ...normalizedConfig,
    meta: {
      ...fallback.meta,
      ...normalizedConfig.meta,
      villageId,
      schemaVersion: CONFIG_SCHEMA_VERSION,
    },
  }
}

export function fromApiPayload(payload, villageId) {
  if (!payload) {
    return createDefaultVillageConfig(villageId)
  }

  return normalizeVillageConfig(payload.config, villageId)
}

export function toApiPayload(config) {
  const safeConfig = normalizeVillageConfig(config, config?.meta?.villageId ?? 'unknown')

  return {
    villageId: safeConfig.meta.villageId,
    schemaVersion: safeConfig.meta.schemaVersion,
    config: safeConfig,
  }
}

export function getSectionSummary(config, sectionId) {
  if (sectionId === 'general') {
    return []
  }

  if (sectionId === 'map') {
    if (config.general.zipCode && config.general.city) {
      return [`Zentrum: ${config.general.zipCode} ${config.general.city}`]
    }

    return []
  }

  if (sectionId === 'modules') {
    return []
  }

  if (sectionId === 'design') {
    return []
  }

  return []
}
