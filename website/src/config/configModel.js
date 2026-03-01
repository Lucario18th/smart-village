const CONFIG_SCHEMA_VERSION = 1

const BASE_CONFIG = {
  general: {
    villageName: '',
    municipalityCode: '',
    contactEmail: '',
    contactPhone: '',
    infoText: '',
  },
  modules: {
    rideShareBench: {
      enabled: true,
      sensors: [
        {
          id: 'rideShareBench-1',
          name: 'Mitfahrbank Standard',
          source: 'simulated',
          config: {},
        },
      ],
    },
    textileContainer: {
      enabled: true,
      sensors: [
        {
          id: 'textileContainer-1',
          name: 'Altkleider Container A',
          source: 'simulated',
          config: {},
        },
      ],
    },
    energyMonitor: {
      enabled: true,
      sensors: [
        {
          id: 'energyMonitor-1',
          name: 'Hauptstromzähler',
          source: 'simulated',
          config: {},
        },
      ],
    },
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
    return [
      `Ortsname: ${config.general.villageName || 'nicht gesetzt'}`,
      `Gemeinde-ID: ${config.general.municipalityCode || 'nicht gesetzt'}`,
      `Kontakt: ${config.general.contactEmail || 'nicht gesetzt'}`,
    ]
  }

  if (sectionId === 'modules') {
    return [
      `Mitfahrbank: ${config.modules.rideShareBench.enabled ? 'aktiv' : 'inaktiv'} (${config.modules.rideShareBench.sensors?.length ?? 0} Sensor${config.modules.rideShareBench.sensors?.length !== 1 ? 'en' : ''})`,
      `Altkleider-Sensor: ${config.modules.textileContainer.enabled ? 'aktiv' : 'inaktiv'} (${config.modules.textileContainer.sensors?.length ?? 0} Sensor${config.modules.textileContainer.sensors?.length !== 1 ? 'en' : ''})`,
      `Strommonitoring: ${config.modules.energyMonitor.enabled ? 'aktiv' : 'inaktiv'} (${config.modules.energyMonitor.sensors?.length ?? 0} Sensor${config.modules.energyMonitor.sensors?.length !== 1 ? 'en' : ''})`,
    ]
  }

  if (sectionId === 'design') {
    return [
      `Theme: ${config.design.themeMode}`,
      `Kontrast: ${config.design.contrast}`,
      `Icon-Set: ${config.design.iconSet}`,
    ]
  }

  return []
}
