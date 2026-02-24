import { ACCOUNTS } from './accounts'

const SESSION_KEY = 'smart-village-admin-session'

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

export function validateCredentials(username, password) {
  const normalizedUsername = normalizeUsername(username)
  const expectedPassword = ACCOUNTS[normalizedUsername]

  if (!expectedPassword || password !== expectedPassword) {
    return null
  }

  return { username: normalizedUsername }
}

export function readSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY)
    if (!rawSession) {
      return null
    }

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.username || !ACCOUNTS[parsedSession.username]) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return parsedSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function persistSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
