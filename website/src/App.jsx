import React from 'react'
import AdminView from './components/AdminView'
import LoginView from './components/LoginView'
import { useAdminAuth } from './hooks/useAdminAuth'

export default function App() {
  const { session, login, logout } = useAdminAuth()

  if (!session) {
    return <LoginView onLogin={login} />
  }

  return <AdminView username={session.username} onLogout={logout} />
}

