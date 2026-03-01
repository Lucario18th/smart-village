import { toApiPayload } from './configModel'

const STORAGE_PREFIX = 'smart-village-config'

function getStorageKey(villageId) {
  return `${STORAGE_PREFIX}:${villageId}`
}

export function loadConfigFromStorage(villageId) {
  const rawPayload = localStorage.getItem(getStorageKey(villageId))

  if (!rawPayload) {
    return null
  }

  return JSON.parse(rawPayload)
}

export function saveConfigToStorage(config) {
  const payload = toApiPayload(config)
  localStorage.setItem(getStorageKey(payload.villageId), JSON.stringify(payload))

  return {
    savedAt: new Date().toISOString(),
  }
}

export function clearConfigInStorage(villageId) {
  localStorage.removeItem(getStorageKey(villageId))
}
