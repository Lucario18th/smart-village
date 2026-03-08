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

      persistSession(nextSession)
      setSession(nextSession)

      return { success: true }
    } catch (err) {
      const friendlyMessageByCode = {
        USER_NOT_FOUND: 'Kein Konto gefunden. Konto jetzt erstellen?',
        INVALID_PASSWORD: 'Passwort ist ungültig.',
        EMAIL_NOT_VERIFIED:
          'Bitte bestätigen Sie zuerst Ihre E-Mail mit dem 6-stelligen Code, den wir Ihnen geschickt haben.',
      }

      const errorMsg =
        friendlyMessageByCode[err.code] || err.message || 'Anmeldung fehlgeschlagen'
      setError(errorMsg)
      return { success: false, error: errorMsg, code: err.code }
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
