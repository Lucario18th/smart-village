import { apiClient } from '../api/client'
import { FIXED_ADMIN_ACCOUNT } from './accounts'

const SESSION_KEY = 'smart-village-admin-session'
const TOKEN_KEY = 'access_token'

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
  if (email === FIXED_ADMIN_ACCOUNT.email && password === FIXED_ADMIN_ACCOUNT.password) {
    return {
      email,
      token: 'local-dev-token',
      sub: 1,
      loginTime: new Date().toISOString(),
    }
  }

  try {
    const result = await apiClient.auth.login(email, password)
    if (result.accessToken) {
      const decoded = decodeToken(result.accessToken)
      return {
        email,
        token: result.accessToken,
        sub: decoded?.sub,
        loginTime: new Date().toISOString(),
      }
    }
    return null
  } catch (error) {
    console.error('Login failed:', error)
    return null
  }
}

export function readSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY)
    if (!rawSession) {
      return null
    }

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.token || !parsedSession?.email) {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(TOKEN_KEY)
      return null
    }

    return parsedSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function persistSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(TOKEN_KEY, session.token)
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}
