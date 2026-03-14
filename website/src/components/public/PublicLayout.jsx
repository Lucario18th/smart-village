import React from 'react'
import { Link } from 'react-router-dom'

export default function PublicLayout({ children }) {
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-content">
          <Link to="/" className="public-header-title">Smart Village</Link>
          <nav className="public-header-nav">
            <Link to="/admin" className="public-header-admin-link">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="public-main">{children}</main>
      <footer className="public-footer">
        <p>Smart Village · Bürgerportal</p>
      </footer>
    </div>
  )
}
