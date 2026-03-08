import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminNavigation from './admin/AdminNavigation'
import AdminSectionPanel from './admin/AdminSectionPanel'
import { ADMIN_SECTIONS } from '../config/adminSections'
import { useVillageConfig } from '../hooks/useVillageConfig'
import DeleteAccountDialog from './DeleteAccountDialog'
import { apiClient } from '../api/client'

export default function AdminView({ session, onLogout }) {
  const [activeSectionId, setActiveSectionId] = useState(ADMIN_SECTIONS[0].id)
  const [isGeneralEditing, setIsGeneralEditing] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const headerRef = useRef(null)
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0)
  const {
    config,
    getSummaryForSection,
    updateGeneralField,
    updateModuleEnabled,
    updateModuleFieldEnabled,
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

  const handleSectionChange = useCallback((sectionId) => {
    setActiveSectionId(sectionId)
    setIsMobileSidebarOpen(false)
  }, [])

  const handleGeneralEditingChange = useCallback((isEditing) => {
    setIsGeneralEditing(isEditing)
  }, [])

  useEffect(() => {
    if (activeSectionId !== 'general') {
      setIsGeneralEditing(false)
    }
  }, [activeSectionId])

  useEffect(() => {
    const updateHeaderHeight = () => {
      const nextHeight = Math.round(headerRef.current?.getBoundingClientRect().height || 0)
      setMobileHeaderHeight(nextHeight)
    }

    updateHeaderHeight()

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      resizeObserver = new ResizeObserver(updateHeaderHeight)
      resizeObserver.observe(headerRef.current)
    }

    window.addEventListener('resize', updateHeaderHeight)
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [])

  const activeSection = useMemo(() => {
    return ADMIN_SECTIONS.find((section) => section.id === activeSectionId) ?? ADMIN_SECTIONS[0]
  }, [activeSectionId])

  const sectionEntries = useMemo(() => {
    return getSummaryForSection(activeSection.id)
  }, [activeSection.id, getSummaryForSection])

  const userEmail = session?.email || 'Unbekannt'
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
      <header ref={headerRef} className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-title-row">
            <h1>
              <button
                type="button"
                className="admin-home-button"
                onClick={() => {
                  setActiveSectionId('map')
                  setIsMobileSidebarOpen(false)
                }}
                aria-label="Zum Start-Tab wechseln"
              >
                Smart Village Admin
              </button>
            </h1>
            <button
              type="button"
              className={`admin-sidebar-toggle${isMobileSidebarOpen ? ' is-open' : ''}`}
              aria-label={isMobileSidebarOpen ? 'Navigation schließen' : 'Navigation öffnen'}
              aria-expanded={isMobileSidebarOpen}
              aria-controls="admin-sidebar"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            >
              <span className="admin-sidebar-toggle-line" />
              <span className="admin-sidebar-toggle-line" />
              <span className="admin-sidebar-toggle-line" />
            </button>
          </div>
          <p className="admin-header-user">
            Angemeldet als <strong>{userEmail}</strong>
          </p>
        </div>
        {toast && (
          <div className="admin-header-toast-slot" role="status" aria-live="polite">
            <div className="toast-notification">
              <span>{toast.message}</span>
              <button type="button" aria-label="Hinweis schließen" onClick={dismissToast}>
                ×
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="admin-layout" style={{ '--mobile-header-height': `${mobileHeaderHeight}px` }}>
        {isMobileSidebarOpen ? (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Navigation schließen"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        ) : null}
        <aside id="admin-sidebar" className={`admin-sidebar${isMobileSidebarOpen ? ' is-open' : ''}`}>
          <AdminNavigation
            sections={ADMIN_SECTIONS}
            activeSectionId={activeSection.id}
            onChange={handleSectionChange}
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
            sensorTypes={sensorTypes}
            onGeneralFieldChange={updateGeneralField}
            onModuleEnabledChange={updateModuleEnabled}
            onModuleFieldEnabledChange={updateModuleFieldEnabled}
            onUpdateSensor={updateSensor}
            onUpdateDevice={updateDevice}
            onDesignFieldChange={updateDesignField}
            internalVillageId={internalVillageId}
            onGeneralEditingChange={handleGeneralEditingChange}
            onGeneralSave={saveConfig}
            isGeneralSaving={isLoading}
            canGeneralSave={hasUnsavedChanges}
            onDeleteAccount={() => setShowDeleteDialog(true)}
            isDeleteLoading={deleteLoading || isLoading}
          />

          {activeSection.id !== 'map' &&
          activeSection.id !== 'design' &&
          activeSection.id !== 'general' &&
          activeSection.id !== 'statistics' &&
          activeSection.id !== 'sensors' &&
          activeSection.id !== 'modules' ? (
            <section className="config-actions" aria-label="Konfiguration">
              <button
                type="button"
                onClick={saveConfig}
                disabled={isLoading || !hasUnsavedChanges}
              >
                {isLoading ? 'Speichern...' : 'Speichern'}
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
