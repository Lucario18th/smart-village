import React, { useMemo, useState } from 'react'
import AdminNavigation from './admin/AdminNavigation'
import AdminSectionPanel from './admin/AdminSectionPanel'
import { ADMIN_SECTIONS } from '../config/adminSections'
import { useVillageConfig } from '../hooks/useVillageConfig'

export default function AdminView({ username, onLogout }) {
  const [activeSectionId, setActiveSectionId] = useState(ADMIN_SECTIONS[0].id)
  const {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateModuleSource,
    updateDesignField,
    hasUnsavedChanges,
    storageMessage,
    saveConfig,
    loadConfig,
    resetConfig,
  } = useVillageConfig(username)

  const activeSection = useMemo(() => {
    return ADMIN_SECTIONS.find((section) => section.id === activeSectionId) ?? ADMIN_SECTIONS[0]
  }, [activeSectionId])

  const sectionEntries = useMemo(() => {
    return getSummaryForSection(activeSection.id)
  }, [activeSection.id, getSummaryForSection])

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Smart Village Admin</h1>
          <p>
            Angemeldet als: {username} · Gemeinde: {config.general.villageName || 'nicht gesetzt'}
          </p>
        </div>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <AdminNavigation
        sections={ADMIN_SECTIONS}
        activeSectionId={activeSection.id}
        onChange={setActiveSectionId}
      />

      <AdminSectionPanel
        section={activeSection}
        entries={sectionEntries}
        config={config}
        onGeneralFieldChange={updateGeneralField}
        onModuleEnabledChange={updateModuleEnabled}
        onModuleSourceChange={updateModuleSource}
        onDesignFieldChange={updateDesignField}
      />

      <section className="config-actions" aria-label="Lokale Konfiguration">
        <button type="button" onClick={loadConfig}>
          Laden
        </button>
        <button type="button" className="primary" onClick={saveConfig}>
          Speichern
        </button>
        <button type="button" onClick={resetConfig}>
          Standard laden
        </button>
      </section>

      <p className="storage-status">
        Status: {storageMessage || '—'} {hasUnsavedChanges ? '• Ungespeicherte Änderungen vorhanden' : ''}
      </p>

      <footer className="app-footer">
        MVP-Stand: Login, Session und Formulare aktiv · Letzte Änderung:{' '}
        {config.meta.updatedAt ? new Date(config.meta.updatedAt).toLocaleString('de-DE') : 'noch keine'}
      </footer>
    </main>
  )
}
