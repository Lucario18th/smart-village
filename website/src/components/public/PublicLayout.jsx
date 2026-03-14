import React from 'react'

export default function PublicLayout({ children }) {
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-header-content">
          <a href="/" className="public-header-title">Smart Village</a>
          <nav className="public-header-nav">
            <a href="/admin" className="public-header-admin-link">Admin</a>
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
