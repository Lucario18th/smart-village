const cache = new Map()
const MAX_CACHE_ENTRIES = 100
const STORAGE_KEY = 'sv_geocode_cache'

function loadCacheFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    Object.entries(parsed).forEach(([key, value]) => {
      cache.set(key, value)
    })
  } catch {
    // ignore storage issues
  }
}

function persistCache() {
  try {
    const obj = Object.fromEntries(cache)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // ignore storage issues
  }
}

loadCacheFromStorage()

export async function geocodeCity(zipCode, city) {
  const normalizedZip = (zipCode || '').trim()
  const normalizedCity = (city || '').trim()

  if (!normalizedZip && !normalizedCity) {
    throw new Error('zipCode or city required for geocoding')
  }

  const cacheKey = `${normalizedZip.toLowerCase()}|${normalizedCity.toLowerCase()}`
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const query = [normalizedZip, normalizedCity, 'Deutschland'].filter(Boolean).join(' ')
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'de',
      'User-Agent': 'smart-village-admin/1.0 (contact: contact@smart-village.dev)',
    },
  })

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`)
  }

  const data = await response.json()
  const first = Array.isArray(data) ? data[0] : null
  if (first && first.lat && first.lon) {
    const result = { lat: Number.parseFloat(first.lat), lng: Number.parseFloat(first.lon) }
    cache.set(cacheKey, result)
    if (cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
    persistCache()
    return result
  }

  throw new Error('No geocoding result found')
}
