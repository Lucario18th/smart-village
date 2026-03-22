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

const ADMIN_PREFS_KEY = 'smart-village-admin-preferences'

const DEFAULT_ADMIN_PREFS = {
  language: 'de',
}

const ADMIN_I18N = {
  de: {
    unknownUser: 'Unbekannt',
    title: 'Smart Village Admin',
    switchToHomeTab: 'Zum Start-Tab wechseln',
    openHomeTabTitle: 'Start-Tab öffnen · Shift+Alt+Klick: Simulation',
    closeHint: 'Hinweis schließen',
    closeNavigation: 'Navigation schließen',
    openNavigation: 'Navigation öffnen',
    loggedInAs: 'Angemeldet als',
    simulationHint: 'Simulation öffnen: Strg + Umschalt + S oder Shift + Alt + Klick auf den Titel',
    externalNavigation: 'Externe Navigation',
    toStartPage: 'Zur Startseite',
    projectOverview: 'Projektübersicht',
    toCitizenPortal: 'Zum Bürgerportal',
    citizenPortal: 'Bürgerportal',
    logout: 'Abmelden',
    configuration: 'Konfiguration',
    save: 'Speichern',
    saving: 'Speichern...',
    statusPrefix: 'Status:',
    unsavedChanges: '· Ungespeicherte Änderungen vorhanden',
    emptyState: '—',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    lastChange: 'Letzte Änderung:',
    noChangeYet: 'noch keine',
    copyright: 'Studierendenprojekt der DHBW Lörrach',
    sectionSummary: {
      map: { label: 'Home', title: 'Startseite', description: 'Gemeindekarte auf Basis von OpenStreetMap.' },
      general: { label: 'Allgemein', title: 'Allgemeine Einstellungen', description: 'Grunddaten der Gemeinde verwalten.' },
      modules: { label: 'Module', title: 'Module und Dienste', description: 'Funktionen für die Gemeinde aktivieren oder deaktivieren.' },
      sensors: { label: 'Sensoren', title: 'Sensor-Verwaltung', description: 'Sensoren und Datenquellen pro Modul konfigurieren.' },
      statistics: { label: 'Statistiken', title: 'Sensor-Statistiken', description: 'Daten und Kennzahlen der Sensoren anzeigen.' },
      design: { label: 'Einstellungen', title: 'Einstellungen', description: 'Design, Darstellung und Kontoverwaltung der App konfigurieren.' },
    },
  },
  en: {
    unknownUser: 'Unknown',
    title: 'Smart Village Admin',
    switchToHomeTab: 'Switch to home tab',
    openHomeTabTitle: 'Open home tab · Shift+Alt+Click: Simulation',
    closeHint: 'Close notice',
    closeNavigation: 'Close navigation',
    openNavigation: 'Open navigation',
    loggedInAs: 'Logged in as',
    simulationHint: 'Open simulation: Ctrl + Shift + S or Shift + Alt + click on the title',
    externalNavigation: 'External navigation',
    toStartPage: 'Go to landing page',
    projectOverview: 'Project overview',
    toCitizenPortal: 'Go to citizen portal',
    citizenPortal: 'Citizen portal',
    logout: 'Log out',
    configuration: 'Configuration',
    save: 'Save',
    saving: 'Saving...',
    statusPrefix: 'Status:',
    unsavedChanges: '· Unsaved changes available',
    emptyState: '—',
    imprint: 'Legal notice',
    privacy: 'Privacy policy',
    lastChange: 'Last change:',
    noChangeYet: 'none yet',
    copyright: 'Student project of DHBW Lörrach',
    sectionSummary: {
      map: { label: 'Home', title: 'Home', description: 'Municipality map based on OpenStreetMap.' },
      general: { label: 'General', title: 'General Settings', description: 'Manage core municipality data.' },
      modules: { label: 'Modules', title: 'Modules and Services', description: 'Enable or disable functions for the municipality.' },
      sensors: { label: 'Sensors', title: 'Sensor Management', description: 'Configure sensors and data sources per module.' },
      statistics: { label: 'Statistics', title: 'Sensor Statistics', description: 'View sensor data and key metrics.' },
      design: { label: 'Settings', title: 'Settings', description: 'Configure design, appearance, and account management.' },
    },
  },
  fr: {
    unknownUser: 'Inconnu',
    title: 'Administration Smart Village',
    switchToHomeTab: 'Revenir à l’onglet d’accueil',
    openHomeTabTitle: 'Ouvrir l’accueil · Shift+Alt+Clic : simulation',
    closeHint: 'Fermer la notification',
    closeNavigation: 'Fermer la navigation',
    openNavigation: 'Ouvrir la navigation',
    loggedInAs: 'Connecté en tant que',
    simulationHint: 'Ouvrir la simulation : Ctrl + Maj + S ou Shift + Alt + clic sur le titre',
    externalNavigation: 'Navigation externe',
    toStartPage: 'Aller à la page d’accueil',
    projectOverview: 'Vue d’ensemble du projet',
    toCitizenPortal: 'Aller au portail citoyen',
    citizenPortal: 'Portail citoyen',
    logout: 'Se déconnecter',
    configuration: 'Configuration',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    statusPrefix: 'Statut :',
    unsavedChanges: '· Modifications non enregistrées',
    emptyState: '—',
    imprint: 'Mentions légales',
    privacy: 'Protection des données',
    lastChange: 'Dernière modification :',
    noChangeYet: 'aucune pour le moment',
    copyright: 'Projet étudiant de la DHBW Lörrach',
    sectionSummary: {
      map: { label: 'Accueil', title: 'Accueil', description: 'Carte communale basée sur OpenStreetMap.' },
      general: { label: 'Général', title: 'Paramètres généraux', description: 'Gérer les informations de base de la commune.' },
      modules: { label: 'Modules', title: 'Modules et services', description: 'Activer ou désactiver les fonctions de la commune.' },
      sensors: { label: 'Capteurs', title: 'Gestion des capteurs', description: 'Configurer les capteurs et les sources de données par module.' },
      statistics: { label: 'Statistiques', title: 'Statistiques des capteurs', description: 'Afficher les données et indicateurs des capteurs.' },
      design: { label: 'Paramètres', title: 'Paramètres', description: 'Configurer le design, l’affichage et la gestion du compte.' },
    },
  },
}

const DATE_LOCALE_MAP = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
}

function loadAdminPrefs() {
  try {
    const raw = localStorage.getItem(ADMIN_PREFS_KEY)
    if (!raw) return DEFAULT_ADMIN_PREFS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_ADMIN_PREFS,
      ...parsed,
    }
  } catch {
    return DEFAULT_ADMIN_PREFS
  }
}

function persistAdminPrefs(prefs) {
  localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(prefs))
}

export default function AdminView({ session, onLogout }) {
  const [activeSectionId, setActiveSectionId] = useState(ADMIN_SECTIONS[0].id)
  const [isGeneralEditing, setIsGeneralEditing] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [adminPrefs, setAdminPrefs] = useState(() => loadAdminPrefs())
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
  const locale = adminPrefs.language || 'de'
  const text = ADMIN_I18N[locale] || ADMIN_I18N.de
  const dateLocale = DATE_LOCALE_MAP[locale] || DATE_LOCALE_MAP.de

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
    const applyAdminPrefsFromStorage = () => setAdminPrefs(loadAdminPrefs())

    window.addEventListener('storage', applyAdminPrefsFromStorage)
    window.addEventListener('smart-village-admin-prefs-changed', applyAdminPrefsFromStorage)

    return () => {
      window.removeEventListener('storage', applyAdminPrefsFromStorage)
      window.removeEventListener('smart-village-admin-prefs-changed', applyAdminPrefsFromStorage)
    }
  }, [])

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

  const localizedSections = useMemo(() => {
    return ADMIN_SECTIONS.map((section) => {
      const localized = text.sectionSummary?.[section.id]
      if (!localized) return section
      return {
        ...section,
        ...localized,
      }
    })
  }, [text])

  const activeSection = useMemo(() => {
    return localizedSections.find((section) => section.id === activeSectionId) ?? localizedSections[0]
  }, [activeSectionId, localizedSections])

  const sectionEntries = useMemo(() => {
    return getSummaryForSection(activeSection.id)
  }, [activeSection.id, getSummaryForSection])

  const userEmail = session?.email || text.unknownUser
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
                aria-label={text.switchToHomeTab}
                title={text.openHomeTabTitle}
              >
                {text.title}
              </button>
            </h1>
            <div className="admin-header-actions-right">
              {toast && (
                <div className="admin-header-toast-slot" role="status" aria-live="polite">
                  <div className="toast-notification">
                    <span>{toast.message}</span>
                    <button type="button" aria-label={text.closeHint} onClick={dismissToast}>
                      ×
                    </button>
                  </div>
                </div>
              )}
              <AiAssistantWidget
                audience="admin"
                contextData={assistantContext}
                placement="floating"
                launcherVariant="compact"
              />
              <button
                type="button"
                className={`admin-sidebar-toggle${isMobileSidebarOpen ? ' is-open' : ''}`}
                aria-label={isMobileSidebarOpen ? text.closeNavigation : text.openNavigation}
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
            {text.loggedInAs} <strong>{userEmail}</strong>
          </p>
          <p className="admin-shortcut-hint">
            {text.simulationHint}
          </p>
        </div>
      </header>

      <div className="admin-layout" style={{ '--mobile-header-height': `${mobileHeaderHeight}px` }}>
        {isMobileSidebarOpen ? (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label={text.closeNavigation}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        ) : null}
        <aside id="admin-sidebar" className={`admin-sidebar${isMobileSidebarOpen ? ' is-open' : ''}`}>
          <AdminNavigation
            sections={localizedSections}
            activeSectionId={activeSection.id}
            onChange={handleSectionChange}
            navAriaLabel={text.title}
          />

          <nav className="admin-nav-external" aria-label={text.externalNavigation}>
            <Link to="/" className="admin-nav-external-link" title={text.toStartPage}>
              <svg className="admin-nav-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M17 7H9M17 7V15" />
              </svg>
              <span>{text.projectOverview}</span>
            </Link>
            <Link to="/user" className="admin-nav-external-link" title={text.toCitizenPortal}>
              <svg className="admin-nav-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17L17 7M17 7H9M17 7V15" />
              </svg>
              <span>{text.citizenPortal}</span>
            </Link>
          </nav>

          <div className="admin-sidebar-actions">
            <button
              type="button"
              className="sidebar-logout-button"
              onClick={onLogout}
              disabled={isLoading}
            >
              {text.logout}
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
            <section className="config-actions" aria-label={text.configuration}>
              <button
                type="button"
                onClick={saveConfig}
                disabled={isLoading || !hasUnsavedChanges}
              >
                {isLoading ? text.saving : text.save}
              </button>
            </section>
          ) : null}

          {activeSection.id !== 'map' ? (
            <>
              <p className="storage-status">
                {text.statusPrefix} {storageMessage || text.emptyState} {hasUnsavedChanges ? text.unsavedChanges : ''}
              </p>
            </>
          ) : null}
        </section>
      </div>

      <footer className="app-footer app-page-footer">
        <div className="app-footer-links">
          <Link to="/impressum" className="app-footer-link">{text.imprint}</Link>
          <Link to="/datenschutz" className="app-footer-link">{text.privacy}</Link>
        </div>
        {text.title} · {text.lastChange}{' '}
        {config.meta.updatedAt ? new Date(config.meta.updatedAt).toLocaleString(dateLocale) : text.noChangeYet}
        <br />
        <span className="app-footer-copy">
          © {new Date().getFullYear()} Smart Village · {text.copyright}
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
