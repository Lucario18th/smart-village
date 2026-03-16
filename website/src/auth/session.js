import { apiClient } from '../api/client'

const SESSION_KEY = 'smart-village-admin-session'
const TOKEN_KEY = 'access_token'
const IDLE_TIMEOUT_MS = 5 * 60 * 1000
const MAP_VIEW_STATE_PREFIX = 'smart-village-admin-map-view:'

function clearMapViewSessionState() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(MAP_VIEW_STATE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage errors during logout cleanup.
  }
}

function clearStorage() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
  clearMapViewSessionState()
}

function withIdleExpiry(session) {
  return {
    ...session,
    idleExpiresAt: new Date(Date.now() + IDLE_TIMEOUT_MS).toISOString(),
  }
}

export function isSessionExpired(session) {
  if (!session?.idleExpiresAt) return true
  const expiresAt = Date.parse(session.idleExpiresAt)
  if (!Number.isFinite(expiresAt)) return true
  return expiresAt <= Date.now()
}

// Helper: Decode JWT to extract user ID
function decodeToken(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(atob(parts[1]))
    return decoded
  } catch (e) {
    console.error('Failed to decode token:', e)
    return null
  }
}

/**
 * Validate credentials against backend API
 */
export async function validateCredentials(email, password) {
  const result = await apiClient.auth.login(email, password)
  if (!result.accessToken) {
    throw new Error('Ungültige Anmeldeinformationen')
  }

  const decoded = decodeToken(result.accessToken)
  return {
    email,
    token: result.accessToken,
    sub: decoded?.sub,
    loginTime: new Date().toISOString(),
  }
}

export function readSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY)
    if (!rawSession) {
      return null
    }

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.token || !parsedSession?.email || isSessionExpired(parsedSession)) {
      clearStorage()
      return null
    }

    return parsedSession
  } catch {
    clearStorage()
    return null
  }
}

export function persistSession(session) {
  const nextSession = withIdleExpiry(session)
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
  localStorage.setItem(TOKEN_KEY, nextSession.token)
  return nextSession
}

export function touchSession() {
  const activeSession = readSession()
  if (!activeSession) {
    clearStorage()
    return null
  }
  return persistSession(activeSession)
}

export function clearSession() {
  clearStorage()
}
