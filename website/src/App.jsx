import React from 'react'
import AdminView from './components/AdminView'
import LoginView from './components/LoginView'
import RegisterView from './components/RegisterView'
import { useAdminAuth } from './hooks/useAdminAuth'
import { apiClient } from './api/client'

export default function App() {
  const { session, login, logout } = useAdminAuth()

  const handleRegister = async ({ email, password }) => {
    try {
      await apiClient.auth.register(email, password)
      
      // After successful registration, login with the new credentials
      const result = await login({ email, password })
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  if (!session) {
    return (
      <LoginView 
        onLogin={login}
        onRegister={({ onBack, initialEmail }) => (
          <RegisterView
            onRegister={handleRegister}
            onBack={onBack}
            initialEmail={initialEmail}
          />
        )}
      />
    )
  }

  return <AdminView session={session} onLogout={logout} />
}
