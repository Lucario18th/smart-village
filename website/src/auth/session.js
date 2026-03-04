import { apiClient } from '../api/client'

const SESSION_KEY = 'smart-village-admin-session'
const TOKEN_KEY = 'access_token'

/**
 * Validate credentials against backend API
 */
export async function validateCredentials(email, password) {
  try {
    const result = await apiClient.auth.login(email, password)
    if (result.accessToken) {
      return {
        email,
        token: result.accessToken,
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
