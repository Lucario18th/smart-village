import React, { useMemo, useState } from 'react'
import AdminNavigation from './admin/AdminNavigation'
import AdminSectionPanel from './admin/AdminSectionPanel'
import { ADMIN_SECTIONS } from '../config/adminSections'
import { useVillageConfig } from '../hooks/useVillageConfig'
import DeleteAccountDialog from './DeleteAccountDialog'
import { apiClient } from '../api/client'

export default function AdminView({ session, onLogout }) {
  const [activeSectionId, setActiveSectionId] = useState(ADMIN_SECTIONS[0].id)
  const [selectedModule, setSelectedModule] = useState(null)
  const {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateSensor,
    updateDevice,
    updateDesignField,
    hasUnsavedChanges,
    storageMessage,
    saveConfig,
    isLoading,
    sensorTypes,
    toast,
    dismissToast,
  } = useVillageConfig(session)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

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
  const villageLocation =
    config.general.zipCode && config.general.city
      ? `${config.general.zipCode} ${config.general.city}`
      : 'nicht gesetzt'
  const internalVillageId = config.meta?.id ?? '—'

  const handleDeleteAccount = async () => {
    if (!session?.sub) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await apiClient.admin.deleteAccount(session.sub)
      alert('Konto wurde vollständig gelöscht.')
      onLogout()
    } catch (error) {
      setDeleteError(error.message || 'Löschen fehlgeschlagen')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Smart Village Admin</h1>
          <p className="admin-header-user">
            Angemeldet als <strong>{userEmail}</strong>
          </p>
          <div className="admin-header-meta" aria-label="Gemeindeinformationen">
            <span className="admin-header-meta-item">Gemeinde: {villageName}</span>
            <span className="admin-header-meta-item">Ort: {villageLocation}</span>
            <span className="admin-header-meta-item">ID: {internalVillageId}</span>
          </div>
        </div>
      </header>

      <div className="admin-layout">
        {toast && (
          <div className="toast-notification" role="alert">
            <span>{toast.message}</span>
            <button type="button" aria-label="Toast schließen" onClick={dismissToast}>
              ×
            </button>
          </div>
        )}
        <aside className="admin-sidebar">
          <AdminNavigation
            sections={ADMIN_SECTIONS}
            activeSectionId={activeSection.id}
            onChange={setActiveSectionId}
          />
          <div className="admin-sidebar-actions">
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={onLogout}
              disabled={isLoading}
            >
              Abmelden
            </button>
          </div>
        </aside>

        <section className={`admin-main-content${activeSection.id === 'map' ? ' is-map-home' : ''}`}>
          <AdminSectionPanel
            section={activeSection}
            entries={sectionEntries}
            config={config}
            selectedModule={selectedModule}
            sensorTypes={sensorTypes}
            onGeneralFieldChange={updateGeneralField}
            onModuleEnabledChange={updateModuleEnabled}
            onNavigateToSensors={handleNavigateToSensors}
            onUpdateSensor={updateSensor}
            onUpdateDevice={updateDevice}
            onDesignFieldChange={updateDesignField}
            onDeleteAccount={() => setShowDeleteDialog(true)}
            isDeleteLoading={deleteLoading || isLoading}
          />

          {activeSection.id !== 'map' && activeSection.id !== 'design' ? (
            <section className="config-actions" aria-label="Konfiguration">
              <button
                type="button"
                onClick={saveConfig}
                disabled={isLoading || !hasUnsavedChanges}
              >
                {isLoading ? 'Wird gespeichert...' : 'Auf Server speichern'}
              </button>
            </section>
          ) : null}

          {activeSection.id !== 'map' ? (
            <>
              <p className="storage-status">
                Status: {storageMessage || '—'} {hasUnsavedChanges ? '· Ungespeicherte Änderungen vorhanden' : ''}
              </p>

              <footer className="app-footer">
                Smart Village Admin · Letzte Änderung:{' '}
                {config.meta.updatedAt ? new Date(config.meta.updatedAt).toLocaleString('de-DE') : 'noch keine'}
              </footer>
            </>
          ) : null}
        </section>
      </div>

      <DeleteAccountDialog
        accountEmail={userEmail}
        isOpen={showDeleteDialog}
        onCancel={() => {
          setShowDeleteDialog(false)
          setDeleteError('')
        }}
        onConfirm={handleDeleteAccount}
        isLoading={deleteLoading}
        error={deleteError}
      />
    </main>
  )
}
