import React from 'react'

function NavIcon({ sectionId }) {
  const icons = {
    map: 'M3 6.6 9 4l6 2.4L21 4v13.4L15 20l-6-2.4L3 20V6.6Zm12 11.2V8.2l-6-2.4v9.6l6 2.4Z',
    general: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4a1.4 1.4 0 1 0 0 2.8A1.4 1.4 0 0 0 12 7Zm-2 5v5h4v-1.8h-1.1v-3.2H10Z',
    modules: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
    sensors: 'M12 2a6 6 0 0 1 6 6h-2a4 4 0 1 0-8 0H6a6 6 0 0 1 6-6Zm0 5a1.5 1.5 0 0 1 1.5 1.5h2a3.5 3.5 0 1 0-7 0h2A1.5 1.5 0 0 1 12 7Zm0 4.5a3 3 0 0 1 3 3V20h-6v-5.5a3 3 0 0 1 3-3Z',
    statistics: 'M4 20V10h3v10H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z',
    design: 'm12 3 2 3.5 4 .8-2.8 2.7.7 4-3.9-2-3.8 2 .7-4L6 7.3l4-.8L12 3Zm-7 14h14v2H5v-2Z',
  }

  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={icons[sectionId] || icons.general} />
    </svg>
  )
}

export default function AdminNavigation({ sections, activeSectionId, onChange, navAriaLabel = 'Admin Navigation' }) {
  return (
    <nav className="admin-nav" aria-label={navAriaLabel}>
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
            <span className="admin-nav-button-content">
              <NavIcon sectionId={section.id} />
              <span>{section.label}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
