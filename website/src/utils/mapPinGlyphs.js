const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const ICONS = {
  default: {
    key: 'default',
    viewBox: '0 0 24 24',
    paths: [
      'M9 3h6v2h2a2 2 0 0 1 2 2v2h2v2h-2v2h2v2h-2v2a2 2 0 0 1-2 2h-2v2H9v-2H7a2 2 0 0 1-2-2v-2H3v-2h2v-2H3V9h2V7a2 2 0 0 1 2-2h2V3Zm-2 4v10h10V7H7Zm2 2h6v6H9V9Z',
    ],
  },
  temperature: {
    key: 'temperature',
    viewBox: '0 0 24 24',
    paths: [
      'M12 2a3 3 0 0 1 3 3v9.35a5 5 0 1 1-6 0V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v10.35l-.45.3a3 3 0 1 0 2.9 0l-.45-.3V5a1 1 0 0 0-1-1Zm0 5a1 1 0 0 1 1 1v4.76a2.5 2.5 0 1 1-2 0V10a1 1 0 0 1 1-1Z',
    ],
  },
  humidity: {
    key: 'humidity',
    viewBox: '0 0 24 24',
    paths: ['M12 2c3.2 3.9 6 7 6 11a6 6 0 1 1-12 0c0-4 2.8-7.1 6-11Zm0 3.16C9.8 8.02 8 10.18 8 13a4 4 0 0 0 8 0c0-2.82-1.8-4.98-4-7.84Z'],
  },
  rideshare: {
    key: 'rideshare',
    viewBox: '0 0 24 24',
    paths: [
      'M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5Z',
    ],
  },
  particulate: {
    key: 'particulate',
    viewBox: '0 0 24 24',
    paths: [
      'M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM7.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    ],
  },
  clothing: {
    key: 'clothing',
    viewBox: '0 0 24 24',
    paths: [
      'M9 3h6l2 2 3-1 2 5-3 2-2-2v12H7V9L5 11 2 9l2-5 3 1 2-2Zm1.2 2L9 6.2V19h6V6.2L13.8 5h-3.6Z',
    ],
  },
  airquality: {
    key: 'airquality',
    viewBox: '0 0 24 24',
    paths: [
      'M3 10h9a2 2 0 1 0 0-4h-1V4h1a4 4 0 1 1 0 8H3v-2Zm0 5h13a2 2 0 1 0 0-4h-1v-2h1a4 4 0 1 1 0 8H3v-2Zm10 5h5a2 2 0 1 0 0-4h-1v-2h1a4 4 0 1 1 0 8h-5v-2Z',
    ],
  },
}

const TYPE_ICON_RULES = [
  { matches: ['mitfahrbank', 'rideshare', 'covoiturage'], icon: 'rideshare' },
  { matches: ['temperatur', 'temperature', 'temp'], icon: 'temperature' },
  { matches: ['feuchtigkeit', 'luftfeuchte', 'humidity', 'moisture'], icon: 'humidity' },
  { matches: ['feinstaub', 'particulate', 'pm10', 'pm2.5', 'dust'], icon: 'particulate' },
  { matches: ['altkleider', 'textil', 'clothing'], icon: 'clothing' },
  { matches: ['luftqualitat', 'air quality', 'airquality'], icon: 'airquality' },
]

export const resolveMapPinIcon = (marker = {}) => {
  if (marker.kind === 'mitfahrbank') return ICONS.rideshare

  const typeText = normalizeText(marker.type)
  if (!typeText) return ICONS.default

  const matched = TYPE_ICON_RULES.find((rule) =>
    rule.matches.some((candidate) => typeText.includes(candidate))
  )

  return ICONS[matched?.icon] || ICONS.default
}

export const renderMapPinGlyph = (icon, color) => {
  if (!icon) return ''

  const safeColor = escapeHtml(color || '#7c3aed')
  const pathsMarkup = (icon.paths || [])
    .map((path) => `<path fill="currentColor" d="${path}"/>`)
    .join('')

  return `<span class="map-pin-glyph" style="color:${safeColor}" aria-hidden="true"><svg class="map-pin-glyph-svg" viewBox="${icon.viewBox}" focusable="false">${pathsMarkup}</svg></span>`
}
