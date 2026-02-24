import { useState } from 'react'
import { clearSession, persistSession, readSession, validateCredentials } from '../auth/session'

export function useAdminAuth() {
  const [session, setSession] = useState(() => readSession())

  const login = ({ username, password }) => {
    const nextSession = validateCredentials(username, password)

    if (!nextSession) {
      return { success: false, error: 'Ungültiger Benutzername oder Passwort.' }
    }

    persistSession(nextSession)
    setSession(nextSession)

    return { success: true }
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  return {
    session,
    login,
    logout,
  }
}
