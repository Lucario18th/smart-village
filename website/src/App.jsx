import React from 'react'
import AdminView from './components/AdminView'
import LoginView from './components/LoginView'
import RegisterView from './components/RegisterView'
import EmailVerificationPending from './components/EmailVerificationPending'
import EmailVerifiedView from './components/EmailVerifiedView'
import { useAdminAuth } from './hooks/useAdminAuth'
import { apiClient } from './api/client'

export default function App() {
  const { session, login, logout } = useAdminAuth()
  const [pendingVerificationEmail, setPendingVerificationEmail] = React.useState('')
  const [verificationResult, setVerificationResult] = React.useState(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('verification')
    const reason = params.get('reason') || undefined

    if (!status) return null

    // Clean up URL to avoid stale verification params on future renders
    window.history.replaceState({}, document.title, window.location.pathname)
    return { status, reason }
  })

  const verificationFailureMessage =
    verificationResult?.status === 'failed'
      ? {
          expired: 'Der Bestätigungslink ist abgelaufen. Bitte fordere einen neuen Link an.',
          invalid: 'Der Bestätigungslink ist ungültig oder wurde bereits verwendet.',
          not_found: 'Das zugehörige Konto wurde nicht gefunden.',
        }[verificationResult.reason] || 'Die E-Mail-Bestätigung ist fehlgeschlagen.'
      : null

  const handleLogin = async ({ email, password }) => {
    const result = await login({ email, password })

    if (!result.success && result.code === 'EMAIL_NOT_VERIFIED') {
      setPendingVerificationEmail(email)
    }

    if (result.success) {
      setPendingVerificationEmail('')
      setVerificationResult(null)
    }

    return result
  }

  const handleRegister = async ({ email, password }) => {
    try {
      await apiClient.auth.register(email, password)
      setPendingVerificationEmail(email)
      setVerificationResult(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  if (verificationResult?.status === 'success') {
    return (
      <EmailVerifiedView
        onGoToLogin={() => {
          setVerificationResult(null)
          setPendingVerificationEmail('')
        }}
      />
    )
  }

  if (!session && pendingVerificationEmail) {
    return (
      <EmailVerificationPending
        email={pendingVerificationEmail}
        onBackToLogin={() => setPendingVerificationEmail('')}
      />
    )
  }

  if (!session) {
    return (
      <LoginView 
        onLogin={handleLogin}
        onRegister={({ onBack, initialEmail }) => (
          <RegisterView
            onRegister={handleRegister}
            onBack={onBack}
            initialEmail={initialEmail}
          />
        )}
        noticeMessage={verificationFailureMessage}
      />
    )
  }

  return <AdminView session={session} onLogout={logout} />
}
