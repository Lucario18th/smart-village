import React, { useMemo, useState } from 'react'
import AdminNavigation from './admin/AdminNavigation'
import AdminSectionPanel from './admin/AdminSectionPanel'
import { ADMIN_SECTIONS } from '../config/adminSections'
import { useVillageConfig } from '../hooks/useVillageConfig'

export default function AdminView({ session, onLogout }) {
  const [activeSectionId, setActiveSectionId] = useState(ADMIN_SECTIONS[0].id)
  const [selectedModule, setSelectedModule] = useState(null)
  const {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    addSensor,
    updateSensor,
    removeSensor,
    updateDesignField,
    hasUnsavedChanges,
    storageMessage,
    saveConfig,
    loadConfig,
    resetConfig,
    isLoading,
    sensorTypes,
  } = useVillageConfig(session)

  const handleNavigateToSensors = (moduleId) => {
    setSelectedModule(moduleId)
    setActiveSectionId('sensors')
  }

  const activeSection = useMemo(() => {
    return ADMIN_SECTIONS.find((section) => section.id === activeSectionId) ?? ADMIN_SECTIONS[0]
  }, [activeSectionId])

  const sectionEntries = useMemo(() => {
    return getSummaryForSection(activeSection.id)
  }, [activeSection.id, getSummaryForSection])

  const userEmail = session?.email || 'Unbekannt'
  const villageName = config.general.villageName || 'nicht gesetzt'

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Smart Village Admin</h1>
          <p>Angemeldet als: {userEmail} · Gemeinde: {villageName}</p>
        </div>
        <button type="button" className="logout-button" onClick={onLogout} disabled={isLoading}>
          Abmelden
        </button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <AdminNavigation
            sections={ADMIN_SECTIONS}
            activeSectionId={activeSection.id}
            onChange={setActiveSectionId}
          />
        </aside>

        <section className="admin-main-content">
          <AdminSectionPanel
            section={activeSection}
            entries={sectionEntries}
            config={config}
            selectedModule={selectedModule}
            sensorTypes={sensorTypes}
            onGeneralFieldChange={updateGeneralField}
            onModuleEnabledChange={updateModuleEnabled}
            onNavigateToSensors={handleNavigateToSensors}
            onAddSensor={addSensor}
            onUpdateSensor={updateSensor}
            onRemoveSensor={removeSensor}
            onDesignFieldChange={updateDesignField}
          />

          <section className="config-actions" aria-label="Konfiguration">
            <button type="button" onClick={loadConfig} disabled={isLoading}>
              {isLoading ? 'Wird geladen...' : 'Von Server laden'}
            </button>
            <button
              type="button"
              onClick={saveConfig}
              disabled={isLoading || !hasUnsavedChanges}
            >
              {isLoading ? 'Wird gespeichert...' : 'Auf Server speichern'}
            </button>
            <button type="button" onClick={resetConfig} disabled={isLoading}>
              Zurücksetzen
            </button>
          </section>

          <p className="storage-status">
            Status: {storageMessage || '—'} {hasUnsavedChanges ? '· Ungespeicherte Änderungen vorhanden' : ''}
          </p>

          <footer className="app-footer">
            Smart Village Admin · Letzte Änderung:{' '}
            {config.meta.updatedAt ? new Date(config.meta.updatedAt).toLocaleString('de-DE') : 'noch keine'}
          </footer>
        </section>
      </div>
    </main>
  )
}
