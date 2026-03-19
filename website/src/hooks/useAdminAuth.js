import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../api/client'
import {
  clearSession,
  persistSession,
  readSession,
  touchSession,
  validateCredentials,
} from '../auth/session'

export function useAdminAuth() {
  const [session, setSession] = useState(() => readSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const timeoutRef = useRef(null)
  const lastTouchRef = useRef(0)

  const clearIdleTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const logoutByInactivity = useCallback(() => {
    clearSession()
    setSession(null)
    setNotice('Sitzung beendet: Bitte erneut anmelden (5 Minuten Inaktivität).')
    setError(null)
    clearIdleTimer()
  }, [clearIdleTimer])

  const scheduleIdleTimer = useCallback(
    (activeSession) => {
      clearIdleTimer()
      if (!activeSession?.idleExpiresAt) return

      const expiresAt = Date.parse(activeSession.idleExpiresAt)
      if (!Number.isFinite(expiresAt)) {
        logoutByInactivity()
        return
      }

      const timeoutMs = Math.max(0, expiresAt - Date.now())
      timeoutRef.current = window.setTimeout(() => {
        logoutByInactivity()
      }, timeoutMs + 50)
    },
    [clearIdleTimer, logoutByInactivity]
  )

  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      const nextSession = await validateCredentials(email, password)

      const persistedSession = persistSession(nextSession)
      setSession(persistedSession)
      setNotice(null)
      scheduleIdleTimer(persistedSession)

      return { success: true }
    } catch (err) {
      const friendlyMessageByCode = {
        USER_NOT_FOUND: 'Kein Konto gefunden. Konto jetzt erstellen?',
        INVALID_PASSWORD: 'Passwort ist ungültig.',
        ADMIN_ACCOUNT_LOCKED: 'Admin-Konto ist vorübergehend gesperrt.',
        ADMIN_SESSION_ACTIVE: 'Dieses Admin-Konto ist bereits aktiv angemeldet.',
        EMAIL_NOT_VERIFIED:
          'Bitte bestätigen Sie zuerst Ihre E-Mail mit dem 6-stelligen Code, den wir Ihnen geschickt haben.',
      }

      const retryAt =
        err?.details?.lockedUntil ||
        err?.details?.activeUntil ||
        null

      const errorMsg =
        friendlyMessageByCode[err.code] || err.message || 'Anmeldung fehlgeschlagen'
      setError(errorMsg)
      return {
        success: false,
        error: errorMsg,
        code: err.code,
        retryAt,
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    apiClient.auth.logout().catch(() => {
      // Local cleanup still runs even if backend logout request fails.
    })
    clearSession()
    setSession(null)
    setError(null)
    setNotice(null)
    clearIdleTimer()
  }

  useEffect(() => {
    if (!session) {
      clearIdleTimer()
      return undefined
    }

    scheduleIdleTimer(session)

    const maybeRefreshSession = () => {
      if (document.hidden) return

      const now = Date.now()
      if (now - lastTouchRef.current < 15000) {
        return
      }
      lastTouchRef.current = now

      const refreshed = touchSession()
      if (!refreshed) {
        logoutByInactivity()
        return
      }

      setSession(refreshed)
      scheduleIdleTimer(refreshed)
    }

    const events = ['pointerdown', 'keydown', 'scroll', 'mousemove', 'touchstart', 'focus']
    events.forEach((eventName) => {
      window.addEventListener(eventName, maybeRefreshSession, { passive: true })
    })
    document.addEventListener('visibilitychange', maybeRefreshSession)

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, maybeRefreshSession)
      })
      document.removeEventListener('visibilitychange', maybeRefreshSession)
    }
  }, [session, clearIdleTimer, logoutByInactivity, scheduleIdleTimer])

  return {
    session,
    login,
    logout,
    loading,
    error,
    notice,
  }
}
