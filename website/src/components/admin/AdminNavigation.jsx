import React from 'react'

export default function AdminNavigation({ sections, activeSectionId, onChange }) {
  return (
    <nav className="admin-nav" aria-label="Admin Navigation">
      {sections.map((section) => {
        const isActive = section.id === activeSectionId

        return (
          <button
            key={section.id}
            type="button"
            className={`admin-nav-button${isActive ? ' active' : ''}`}
            onClick={() => onChange(section.id)}
            aria-pressed={isActive}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
