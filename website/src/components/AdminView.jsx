import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminNavigation from './admin/AdminNavigation'
import AdminSectionPanel from './admin/AdminSectionPanel'
import AdminSimulationLab from './admin/AdminSimulationLab'
import { ADMIN_SECTIONS } from '../config/adminSections'
import { useVillageConfig } from '../hooks/useVillageConfig'
import DeleteAccountDialog from './DeleteAccountDialog'
import { apiClient } from '../api/client'
import AiAssistantWidget from './common/AiAssistantWidget'

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
  const [isSimulationLabOpen, setIsSimulationLabOpen] = useState(false)

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

  useEffect(() => {
    const handleShortcut = (event) => {
      const tagName = event.target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        setIsSimulationLabOpen(true)
        return
      }

      if (event.key === 'Escape') {
        setIsSimulationLabOpen(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => {
      window.removeEventListener('keydown', handleShortcut)
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
  const simulationStorageKey = `smart-village-admin-simulation:${session?.sub ?? 'unknown'}:${internalVillageId}`

  const assistantContext = useMemo(() => {
    const sensorList = config?.modules?.sensors?.sensors || []
    const moduleFlags = {
      map: config?.modules?.map?.enabled ?? true,
      sensorData: config?.modules?.sensors?.enabled ?? true,
      weather: config?.modules?.weather?.enabled ?? false,
      messages: config?.modules?.news?.enabled ?? false,
      events: config?.modules?.events?.enabled ?? false,
      rideShare: config?.modules?.rideSharingBench?.enabled ?? false,
      textileContainers: config?.modules?.oldClothesContainer?.enabled ?? false,
    }

    return {
      view: 'admin',
      villageName: config?.general?.villageName || '',
      statusText: config?.general?.statusText || '',
      infoText: config?.general?.infoText || '',
      sensors: sensorList,
      modules: moduleFlags,
      activeSectionId,
    }
  }, [config, activeSectionId])

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
                onClick={(event) => {
                  if (event.shiftKey && (event.altKey || event.ctrlKey || event.metaKey)) {
                    setIsSimulationLabOpen(true)
                    return
                  }

                  setActiveSectionId('map')
                  setIsMobileSidebarOpen(false)
                }}
                aria-label="Zum Start-Tab wechseln"
                title="Start-Tab öffnen · Shift+Alt+Klick: Simulation"
              >
                Smart Village Admin
              </button>
            </h1>
            <div className="admin-header-actions-right">
              <div className="admin-header-links-stack">
                <div className="admin-header-links-row">
                  <Link className="admin-header-link" to="/">
                    Projektübersicht
                  </Link>
                  <Link className="admin-header-link admin-header-link--secondary" to="/user">
                    Bürgerportal
                  </Link>
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
              </div>
              <AiAssistantWidget
                audience="admin"
                contextData={assistantContext}
                placement="floating"
                launcherVariant="compact"
              />
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
          </div>
          <p className="admin-header-user">
            Angemeldet als <strong>{userEmail}</strong>
          </p>
          <p className="admin-shortcut-hint">
            Simulation öffnen: <strong>Strg + Umschalt + S</strong> oder <strong>Shift + Alt + Klick</strong> auf den Titel
          </p>
        </div>
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
            userSub={session?.sub ?? null}
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
            </>
          ) : null}
        </section>
      </div>

      <footer className="app-footer app-page-footer">
        Smart Village Admin · Letzte Änderung:{' '}
        {config.meta.updatedAt ? new Date(config.meta.updatedAt).toLocaleString('de-DE') : 'noch keine'}
        <br />
        <span className="app-footer-copy">
          © {new Date().getFullYear()} Smart Village · Studierendenprojekt der DHBW Lörrach
        </span>
      </footer>

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

      <AdminSimulationLab
        isOpen={isSimulationLabOpen}
        onClose={() => setIsSimulationLabOpen(false)}
        storageKey={simulationStorageKey}
        villageName={config.general?.villageName}
        authToken={session?.token ?? ''}
        accountId={session?.sub ?? null}
        villageId={config.meta?.id ?? null}
        sourceGateways={config.devices}
        sourceSensors={config.sensors}
        sensorTypes={sensorTypes}
      />
    </main>
  )
}
