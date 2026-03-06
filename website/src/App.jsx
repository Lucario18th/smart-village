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
  const [pendingVerificationEmail, setPendingVerificationEmail] = React.useState(() =>
    sessionStorage.getItem('pending_verification_email') || ''
  )
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
          expired: 'Der Bestätigungscode ist abgelaufen. Bitte fordere einen neuen Code an.',
          invalid: 'Der eingegebene Bestätigungscode ist ungültig.',
          not_found: 'Das zugehörige Konto wurde nicht gefunden.',
        }[verificationResult.reason] || 'Die E-Mail-Bestätigung ist fehlgeschlagen.'
      : null

  React.useEffect(() => {
    if (pendingVerificationEmail) {
      sessionStorage.setItem('pending_verification_email', pendingVerificationEmail)
    } else {
      sessionStorage.removeItem('pending_verification_email')
    }
  }, [pendingVerificationEmail])

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

  const handleRegister = async ({ email, password, postalCodeId }) => {
    try {
      await apiClient.auth.register({ email, password, postalCodeId })
      setPendingVerificationEmail(email)
      setVerificationResult(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleVerifyCode = async (code) => {
    try {
      await apiClient.auth.verifyCode(pendingVerificationEmail, code)
      setVerificationResult({ status: 'success' })
      setPendingVerificationEmail('')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        code: error.code,
        message: error.message || 'Die E-Mail-Bestätigung ist fehlgeschlagen.',
      }
    }
  }

  const handleResendCode = async () => {
    try {
      await apiClient.auth.resendVerification(pendingVerificationEmail)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        code: error.code,
        message: error.message || 'Der Code konnte nicht gesendet werden.',
      }
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
        onVerifyCode={handleVerifyCode}
        onResendCode={handleResendCode}
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
