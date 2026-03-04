import { useState } from 'react'
import { clearSession, persistSession, readSession, validateCredentials } from '../auth/session'

export function useAdminAuth() {
  const [session, setSession] = useState(() => readSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      const nextSession = await validateCredentials(email, password)

      if (!nextSession) {
        const err = 'Ungültiger Benutzername oder Passwort.'
        setError(err)
        return { success: false, error: err }
      }

      persistSession(nextSession)
      setSession(nextSession)

      return { success: true }
    } catch (err) {
      const errorMsg = err.message || 'Anmeldung fehlgeschlagen'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    setSession(null)
    setError(null)
  }

  return {
    session,
    login,
    logout,
    loading,
    error,
  }
}
