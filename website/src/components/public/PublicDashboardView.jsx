import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { applyThemeToDOM, getThemeClass } from '../../config/themeManager'
import PublicMapPanel from './PublicMapPanel'
import AiAssistantWidget from '../common/AiAssistantWidget'

const PUBLIC_PREFS_KEY = 'smart-village-public-preferences'
const PUBLIC_LAST_VILLAGE_KEY = 'smart-village-public-last-village-id'
const PUBLIC_REFRESH_INTERVAL_MS =
  Number.parseInt(import.meta.env?.VITE_PUBLIC_REFRESH_INTERVAL_MS ?? '5000', 10) || 5000

const DATE_LOCALES = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
}

const I18N = {
  de: {
    appTitle: 'Smart Village Bürgerportal',
    navOpen: 'Navigation öffnen',
    navClose: 'Navigation schließen',
    navAria: 'Nutzer Navigation',
    compactInfoAria: 'Dorfinformationen kompakt',
    statusLabel: 'Status',
    chooseVillage: 'Bitte Gemeinde auswählen',
    villagesLoadError: 'Gemeinden konnten nicht geladen werden.',
    villageDataLoadError: 'Gemeindedaten konnten nicht geladen werden.',
    villageLoading: 'Gemeindedaten werden geladen...',
    noSensors: 'Keine Sensoren verfügbar.',
    noReadings: 'Keine Messwerte',
    noWeather: 'Keine Wetterdaten verfügbar.',
    weatherValue: 'Wetterwert',
    noMessages: 'Keine Nachrichten vorhanden.',
    noEvents: 'Keine Veranstaltungen verfügbar.',
    noRideshare: 'Keine Mitfahrbank-Daten vorhanden.',
    onePerson: 'Person',
    manyPeople: 'Personen',
    waiting: 'wartend',
    noTextile: 'Keine Containerdaten verfügbar.',
    textileFallback: 'Container',
    noVillageFooter: 'nicht ausgewählt',
    footerVillage: 'Gemeinde',
    settings: {
      villageTitle: 'Gemeinde',
      villageSelectLabel: 'Gemeinde auswählen',
      selectPlaceholder: 'Bitte auswählen',
      languageTitle: 'Sprache',
      languageLabel: 'Anzeigesprache',
      designTitle: 'Farbschema',
      designHint: 'Wird automatisch gespeichert und beim nächsten Besuch wiederhergestellt.',
      themeMode: 'Theme-Modus',
      themeLight: 'Hell',
      themeDark: 'Dunkel',
      contrast: 'Kontrast',
      contrastStandard: 'Standard',
      contrastHigh: 'Hoch',
      currentVillage: 'Aktuelle Gemeinde',
      active: 'Aktiv',
      inactive: 'Deaktiviert',
      supportTitle: 'Mitmachen und Unterstützen',
      supportHint: 'Hilf mit durch Feedback, Reichweite oder Unterstützung.',
    },
    sections: {
      map: { label: 'Home', title: 'Startseite', heading: 'Karte' },
      sensors: { label: 'Sensoren', title: 'Sensoren', heading: 'Sensoren' },
      weather: { label: 'Wetter', title: 'Wetter', heading: 'Wetter' },
      messages: { label: 'Nachrichten', title: 'Nachrichten', heading: 'Nachrichten' },
      rideshare: { label: 'Mitfahrbank', title: 'Mitfahrbänke', heading: 'Mitfahrbänke' },
      events: { label: 'Events', title: 'Veranstaltungen', heading: 'Veranstaltungen' },
      textile: { label: 'Container', title: 'Altkleidercontainer', heading: 'Altkleidercontainer' },
      settings: { label: 'Einstellungen', title: 'Einstellungen', heading: 'Einstellungen' },
    },
    modules: {
      map: 'Karte',
      sensorData: 'Sensordaten',
      weather: 'Wetter',
      messages: 'Nachrichten',
      rideShare: 'Mitfahrbänke',
      events: 'Events',
      textileContainers: 'Altkleidercontainer',
    },
    community: {
      support: 'Uns unterstützen',
      feedback: 'Feedback senden',
      newsletter: 'Newsletter',
      volunteer: 'Mitmachen',
      pendingSuffix: 'bald',
    },
  },
  en: {
    appTitle: 'Smart Village Bürgerportal',
    navOpen: 'Open navigation',
    navClose: 'Close navigation',
    navAria: 'User navigation',
    compactInfoAria: 'Village info compact',
    statusLabel: 'Status',
    chooseVillage: 'Please select a village',
    villagesLoadError: 'Villages could not be loaded.',
    villageDataLoadError: 'Village data could not be loaded.',
    villageLoading: 'Loading village data...',
    noSensors: 'No sensors available.',
    noReadings: 'No readings',
    noWeather: 'No weather data available.',
    weatherValue: 'Weather value',
    noMessages: 'No messages available.',
    noEvents: 'No events available.',
    noRideshare: 'No rideshare data available.',
    onePerson: 'person',
    manyPeople: 'people',
    waiting: 'waiting',
    noTextile: 'No container data available.',
    textileFallback: 'Container',
    noVillageFooter: 'not selected',
    footerVillage: 'Village',
    settings: {
      villageTitle: 'Village',
      villageSelectLabel: 'Select village',
      selectPlaceholder: 'Please select',
      languageTitle: 'Language',
      languageLabel: 'Display language',
      designTitle: 'Color scheme',
      designHint: 'Saved automatically and restored on your next visit.',
      themeMode: 'Theme mode',
      themeLight: 'Light',
      themeDark: 'Dark',
      contrast: 'Contrast',
      contrastStandard: 'Standard',
      contrastHigh: 'High',
      currentVillage: 'Current village',
      active: 'Active',
      inactive: 'Disabled',
      supportTitle: 'Join and support',
      supportHint: 'Help with feedback, outreach, or support.',
    },
    sections: {
      map: { label: 'Home', title: 'Home', heading: 'Map' },
      sensors: { label: 'Sensors', title: 'Sensors', heading: 'Sensors' },
      weather: { label: 'Weather', title: 'Weather', heading: 'Weather' },
      messages: { label: 'Messages', title: 'Messages', heading: 'Messages' },
      rideshare: { label: 'Rideshare', title: 'Rideshare benches', heading: 'Rideshare benches' },
      events: { label: 'Events', title: 'Events', heading: 'Events' },
      textile: { label: 'Containers', title: 'Textile containers', heading: 'Textile containers' },
      settings: { label: 'Settings', title: 'Settings', heading: 'Settings' },
    },
    modules: {
      map: 'Map',
      sensorData: 'Sensor data',
      weather: 'Weather',
      messages: 'Messages',
      rideShare: 'Rideshare benches',
      events: 'Events',
      textileContainers: 'Textile containers',
    },
    community: {
      support: 'Support us',
      feedback: 'Send feedback',
      newsletter: 'Newsletter',
      volunteer: 'Get involved',
      pendingSuffix: 'soon',
    },
  },
  fr: {
    appTitle: 'Smart Village Bürgerportal',
    navOpen: 'Ouvrir la navigation',
    navClose: 'Fermer la navigation',
    navAria: 'Navigation utilisateur',
    compactInfoAria: 'Informations compactes de la commune',
    statusLabel: 'Statut',
    chooseVillage: 'Veuillez choisir une commune',
    villagesLoadError: 'Impossible de charger les communes.',
    villageDataLoadError: 'Impossible de charger les données de la commune.',
    villageLoading: 'Chargement des données de la commune...',
    noSensors: 'Aucun capteur disponible.',
    noReadings: 'Aucune mesure',
    noWeather: 'Aucune donnée météo disponible.',
    weatherValue: 'Valeur météo',
    noMessages: 'Aucun message disponible.',
    noEvents: 'Aucun événement disponible.',
    noRideshare: 'Aucune donnée de covoiturage disponible.',
    onePerson: 'personne',
    manyPeople: 'personnes',
    waiting: 'en attente',
    noTextile: 'Aucune donnée de conteneur disponible.',
    textileFallback: 'Conteneur',
    noVillageFooter: 'non sélectionnée',
    footerVillage: 'Commune',
    settings: {
      villageTitle: 'Commune',
      villageSelectLabel: 'Choisir une commune',
      selectPlaceholder: 'Veuillez choisir',
      languageTitle: 'Langue',
      languageLabel: "Langue d'affichage",
      designTitle: 'Thème visuel',
      designHint: 'Enregistre automatiquement et restaure à la prochaine visite.',
      themeMode: 'Mode du thème',
      themeLight: 'Clair',
      themeDark: 'Sombre',
      contrast: 'Contraste',
      contrastStandard: 'Standard',
      contrastHigh: 'Élevé',
      currentVillage: 'Commune active',
      active: 'Actif',
      inactive: 'Désactivé',
      supportTitle: 'Participer et soutenir',
      supportHint: 'Aidez via vos retours, votre réseau ou votre soutien.',
    },
    sections: {
      map: { label: 'Accueil', title: 'Accueil', heading: 'Carte' },
      sensors: { label: 'Capteurs', title: 'Capteurs', heading: 'Capteurs' },
      weather: { label: 'Météo', title: 'Météo', heading: 'Météo' },
      messages: { label: 'Messages', title: 'Messages', heading: 'Messages' },
      rideshare: { label: 'Covoiturage', title: 'Bancs de covoiturage', heading: 'Bancs de covoiturage' },
      events: { label: 'Événements', title: 'Événements', heading: 'Événements' },
      textile: { label: 'Conteneurs', title: 'Conteneurs textiles', heading: 'Conteneurs textiles' },
      settings: { label: 'Paramètres', title: 'Paramètres', heading: 'Paramètres' },
    },
    modules: {
      map: 'Carte',
      sensorData: 'Données capteurs',
      weather: 'Météo',
      messages: 'Messages',
      rideShare: 'Bancs de covoiturage',
      events: 'Événements',
      textileContainers: 'Conteneurs textiles',
    },
    community: {
      support: 'Nous soutenir',
      feedback: 'Envoyer un retour',
      newsletter: 'Newsletter',
      volunteer: 'Participer',
      pendingSuffix: 'bientôt',
    },
  },
}

const PUBLIC_COMMUNITY_LINKS = [
  {
    id: 'support',
    href: import.meta.env?.VITE_PUBLIC_SUPPORT_URL || '#',
  },
  {
    id: 'feedback',
    href: import.meta.env?.VITE_PUBLIC_FEEDBACK_URL || '#',
  },
  {
    id: 'newsletter',
    href: import.meta.env?.VITE_PUBLIC_NEWSLETTER_URL || '#',
  },
  {
    id: 'volunteer',
    href: import.meta.env?.VITE_PUBLIC_VOLUNTEER_URL || '#',
  },
]

function PublicCommunityLink({ href, label, pendingSuffix }) {
  const isPlaceholder = !href || href === '#'
  if (isPlaceholder) {
    return <span className="public-community-link is-pending">{label} ({pendingSuffix})</span>
  }

  const isExternal = /^https?:\/\//i.test(href)
  return (
    <a
      className="public-community-link"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      {label}
    </a>
  )
}

const DEFAULT_PREFS = {
  language: 'de',
  themeMode: 'dark',
  contrast: 'standard',
  iconSet: 'default',
}

function loadPublicPrefs() {
  try {
    const raw = localStorage.getItem(PUBLIC_PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function persistPublicPrefs(prefs) {
  localStorage.setItem(PUBLIC_PREFS_KEY, JSON.stringify(prefs))
}

function loadLastVillageId() {
  try {
    return localStorage.getItem(PUBLIC_LAST_VILLAGE_KEY) || ''
  } catch {
    return ''
  }
}

function persistLastVillageId(villageId) {
  try {
    if (!villageId) {
      localStorage.removeItem(PUBLIC_LAST_VILLAGE_KEY)
      return
    }
    localStorage.setItem(PUBLIC_LAST_VILLAGE_KEY, String(villageId))
  } catch {
    // ignore storage write errors
  }
}

function UserNavIcon({ sectionId, iconKey }) {
  const icons = {
    map: 'M3 6.6 9 4l6 2.4L21 4v13.4L15 20l-6-2.4L3 20V6.6Zm12 11.2V8.2l-6-2.4v9.6l6 2.4Z',
    sensors: 'M12 2a6 6 0 0 1 6 6h-2a4 4 0 1 0-8 0H6a6 6 0 0 1 6-6Zm0 5a1.5 1.5 0 0 1 1.5 1.5h2a3.5 3.5 0 1 0-7 0h2A1.5 1.5 0 0 1 12 7Zm0 4.5a3 3 0 0 1 3 3V20h-6v-5.5a3 3 0 0 1 3-3Z',
    weather: 'M6 17h11a4 4 0 1 0-.8-7.9A5.5 5.5 0 0 0 5.6 11 3 3 0 0 0 6 17Z',
    messages: 'M4 5h16v10H7l-3 3V5Zm3 3v2h10V8H7Zm0 3v2h7v-2H7Z',
    rideshare: 'M3 15.5 8 12l4 3 9-6v4.5L12 20l-9-4.5v-0Z',
    events: 'M4 20V10h3v10H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z',
    textile: 'M5 4h14v16H5V4Zm3 3v10h8V7H8Zm2 2h4v2h-4V9Z',
    tree: 'M12 3 7 10h3v3H8l4 5 4-5h-2v-3h3L12 3ZM11 18h2v3h-2v-3Z',
    water: 'M12 3c3 3.3 5 5.6 5 8a5 5 0 1 1-10 0c0-2.4 2-4.7 5-8Zm0 4.4c-1.6 2-2.5 3.1-2.5 4.6a2.5 2.5 0 0 0 5 0c0-1.5-.9-2.6-2.5-4.6Z',
    camera: 'M4 7h3l1.4-2h5.2L15 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    energy: 'M13 2 6 13h4l-1 9 7-11h-4l1-9Z',
    settings: 'm12 3 2 3.5 4 .8-2.8 2.7.7 4-3.9-2-3.8 2 .7-4L6 7.3l4-.8L12 3Zm-7 14h14v2H5v-2Z',
  }
  const resolvedIconKey = sectionId.startsWith('module-') ? (iconKey || 'sensors') : sectionId

  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d={icons[resolvedIconKey] || icons.settings} />
    </svg>
  )
}

function buildUserSections(text) {
  return [
    { id: 'map', label: text.sections.map.label, title: text.sections.map.title },
    { id: 'sensors', label: text.sections.sensors.label, title: text.sections.sensors.title },
    { id: 'weather', label: text.sections.weather.label, title: text.sections.weather.title },
    { id: 'messages', label: text.sections.messages.label, title: text.sections.messages.title },
    { id: 'events', label: text.sections.events.label, title: text.sections.events.title },
    { id: 'settings', label: text.sections.settings.label, title: text.sections.settings.title },
  ]
}

function buildModuleSection(module) {
  return {
    id: `module-${module.id}`,
    label: module.name,
    title: module.name,
    moduleId: module.id,
    iconKey: module.iconKey || 'sensors',
  }
}

export default function PublicDashboardView({ initialVillageId = null }) {
  const headerRef = useRef(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0)

  const [villages, setVillages] = useState([])
  const [isVillagesLoading, setIsVillagesLoading] = useState(true)
  const [villagesError, setVillagesError] = useState(null)

  const [selectedVillageId, setSelectedVillageId] = useState(() =>
    initialVillageId ? String(initialVillageId) : loadLastVillageId()
  )
  const [activeSectionId, setActiveSectionId] = useState('map')
  const [selectedSensorId, setSelectedSensorId] = useState(null)

  const [config, setConfig] = useState(null)
  const [initialData, setInitialData] = useState(null)
  const [isVillageLoading, setIsVillageLoading] = useState(false)
  const [villageError, setVillageError] = useState(null)

  const [prefs, setPrefs] = useState(() => loadPublicPrefs())
  const locale = DATE_LOCALES[prefs.language] ? prefs.language : 'de'
  const text = I18N[locale]
  const baseSections = useMemo(() => buildUserSections(text), [text])

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
    applyThemeToDOM(getThemeClass(prefs.themeMode, prefs.contrast))
    persistPublicPrefs(prefs)
  }, [prefs])

  useEffect(() => {
    let cancelled = false

    async function loadVillages() {
      try {
        const response = await apiClient.appApi.getVillages()
        if (!cancelled) {
          setVillages(response.data || [])
        }
      } catch (error) {
        if (!cancelled) {
          setVillagesError(error.message || text.villagesLoadError)
        }
      } finally {
        if (!cancelled) {
          setIsVillagesLoading(false)
        }
      }
    }

    loadVillages()
    return () => {
      cancelled = true
    }
  }, [text.villagesLoadError])

  useEffect(() => {
    if (isVillagesLoading || villages.length === 0) return

    const availableIds = new Set(villages.map((village) => String(village.villageId)))
    if (selectedVillageId && availableIds.has(selectedVillageId)) {
      return
    }

    const lastVillageId = loadLastVillageId()
    if (lastVillageId && availableIds.has(lastVillageId)) {
      setSelectedVillageId(lastVillageId)
      return
    }

    if (availableIds.has('1')) {
      setSelectedVillageId('1')
      return
    }

    setSelectedVillageId(String(villages[0].villageId))
  }, [isVillagesLoading, villages, selectedVillageId])

  useEffect(() => {
    persistLastVillageId(selectedVillageId)
  }, [selectedVillageId])

  useEffect(() => {
    if (!selectedVillageId) {
      setConfig(null)
      setInitialData(null)
      setVillageError(null)
      return
    }

    let cancelled = false

    async function loadVillageData() {
      setIsVillageLoading(true)
      setVillageError(null)
      try {
        const [configRes, dataRes] = await Promise.all([
          apiClient.appApi.getVillageConfig(selectedVillageId),
          apiClient.appApi.getVillageInitialData(selectedVillageId),
        ])

        if (!cancelled) {
          setConfig(configRes.data || null)
          setInitialData(dataRes.data || null)
        }
      } catch (error) {
        if (!cancelled) {
          setVillageError(error.message || text.villageDataLoadError)
          setConfig(null)
          setInitialData(null)
        }
      } finally {
        if (!cancelled) {
          setIsVillageLoading(false)
        }
      }
    }

    loadVillageData()
    return () => {
      cancelled = true
    }
  }, [selectedVillageId, text.villageDataLoadError])

  const selectedVillage = useMemo(
    () => villages.find((village) => String(village.villageId) === selectedVillageId) || null,
    [villages, selectedVillageId]
  )

  const villageStatusText = (config?.statusText || '').trim()
  const villageInfoText = (config?.infoText || '').trim()

  const features = config?.features || {}
  const visibility = config?.sensorDetailVisibility || {}
  const sensors = initialData?.sensors || []
  const customModules = initialData?.modules || config?.modules || []
  const messages = initialData?.messages || []
  const weatherEntries = initialData?.weather || []
  const events = initialData?.events || []

  const userSections = useMemo(() => {
    const moduleSections = customModules.map(buildModuleSection)
    return baseSections.flatMap((section) => {
      if (section.id === 'sensors') {
        return [section, ...moduleSections]
      }
      return [section]
    })
  }, [baseSections, customModules])

  const enabledSections = useMemo(() => {
    if (!selectedVillageId || !config) {
      return userSections
    }

    return userSections.filter((section) => {
      if (section.id === 'map') return features.map !== false
      if (section.id === 'sensors') return features.sensorData !== false
      if (section.id === 'weather') return features.weather === true
      if (section.id === 'messages') return features.messages !== false
      if (section.id === 'events') return features.events === true
      if (section.id.startsWith('module-')) return features.sensorData !== false
      return true
    })
  }, [selectedVillageId, config, features, userSections])

  useEffect(() => {
    if (!enabledSections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(enabledSections[0]?.id || 'settings')
    }
  }, [enabledSections, activeSectionId])

  useEffect(() => {
    if (!selectedVillageId) return undefined

    let cancelled = false

    const refreshPublicData = async () => {
      try {
        const [configRes, dataRes] = await Promise.all([
          apiClient.appApi.getVillageConfig(selectedVillageId),
          apiClient.appApi.getVillageInitialData(selectedVillageId),
        ])

        if (cancelled) return
        setConfig(configRes.data || null)
        setInitialData(dataRes.data || null)
      } catch {
        // Keep last known public state if a refresh request fails.
      }
    }

    const interval = setInterval(refreshPublicData, PUBLIC_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [selectedVillageId])

  const activeSection = useMemo(
    () => enabledSections.find((section) => section.id === activeSectionId) || enabledSections[0] || userSections[0],
    [enabledSections, activeSectionId, userSections]
  )

  const assistantContext = useMemo(
    () => ({
      view: 'public',
      locale,
      language: prefs.language,
      villageId: Number(selectedVillageId) || null,
      villageName: selectedVillage?.name || config?.name || '',
      statusText: villageStatusText,
      infoText: villageInfoText,
      sensors,
      modules: {
        map: features.map !== false,
        sensorData: features.sensorData !== false,
        weather: features.weather === true,
        messages: features.messages !== false,
        events: features.events === true,
      },
      activeSectionId,
    }),
    [
      selectedVillage,
      config,
      locale,
      prefs.language,
      selectedVillageId,
      villageStatusText,
      villageInfoText,
      sensors,
      features,
      activeSectionId,
    ]
  )

  const renderTabContent = () => {
    if (!selectedVillageId) {
      return (
        <section className="public-dashboard-empty">
          <h3>{text.chooseVillage}</h3>
        </section>
      )
    }

    if (isVillageLoading) {
      return (
        <section className="public-loading">
          <p>{text.villageLoading}</p>
        </section>
      )
    }

    if (villageError) {
      return (
        <section className="public-error" role="alert">
          <p>{villageError}</p>
        </section>
      )
    }

    if (activeSection.id === 'map') {
      return (
        <div className="village-map-section">
          <h3>{text.sections.map.heading}</h3>
          <PublicMapPanel
            zipCode={config?.postalCode?.zipCode}
            city={config?.postalCode?.city}
            sensors={sensors}
            rideshares={[]}
            locale={locale}
            selectedSensorId={selectedSensorId}
            onSensorDeselect={() => setSelectedSensorId(null)}
          />
        </div>
      )
    }

    if (activeSection.id === 'sensors') {
      return (
        <div>
          <h3>{text.sections.sensors.heading}</h3>
          {sensors.length === 0 ? (
            <p className="village-section-empty">{text.noSensors}</p>
          ) : (
            <div className="sensor-card-grid">
              {sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="sensor-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSensorId(sensor.id)
                    setActiveSectionId('map')
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedSensorId(sensor.id)
                      setActiveSectionId('map')
                    }
                  }}
                >
                  {visibility.name !== false ? <h4 className="sensor-card-name">{sensor.name}</h4> : null}
                  {visibility.type !== false ? <p className="sensor-card-type">{sensor.type}</p> : null}
                  {sensor.lastReading ? (
                    <div className="sensor-card-reading">
                      <span className="sensor-card-value">{sensor.lastReading.value}</span>
                      <span className="sensor-card-unit">{sensor.unit}</span>
                    </div>
                  ) : (
                    <p className="sensor-card-no-data">{text.noReadings}</p>
                  )}
                  {visibility.coordinates !== false && sensor.latitude != null && sensor.longitude != null ? (
                    <p className="sensor-card-coords">
                      {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (activeSection.id.startsWith('module-')) {
      const moduleInfo = customModules.find((module) => module.id === activeSection.moduleId)
      const moduleSensorIds = new Set(moduleInfo?.sensorIds || [])
      const moduleSensors = sensors.filter((sensor) => moduleSensorIds.has(sensor.id))

      return (
        <div className="village-module-section">
          <h3>{activeSection.title}</h3>
          {moduleInfo?.description ? (
            <p className="village-module-description">{moduleInfo.description}</p>
          ) : null}

          {moduleSensors.length === 0 ? (
            <p className="village-section-empty">{text.noSensors}</p>
          ) : (
            <div className="sensor-card-grid">
              {moduleSensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="sensor-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSensorId(sensor.id)
                    setActiveSectionId('map')
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedSensorId(sensor.id)
                      setActiveSectionId('map')
                    }
                  }}
                >
                  {visibility.name !== false ? <h4 className="sensor-card-name">{sensor.name}</h4> : null}
                  {visibility.type !== false ? <p className="sensor-card-type">{sensor.type}</p> : null}
                  {sensor.lastReading ? (
                    <div className="sensor-card-reading">
                      <span className="sensor-card-value">{sensor.lastReading.value}</span>
                      <span className="sensor-card-unit">{sensor.unit}</span>
                    </div>
                  ) : (
                    <p className="sensor-card-no-data">{text.noReadings}</p>
                  )}
                  {visibility.coordinates !== false && sensor.latitude != null && sensor.longitude != null ? (
                    <p className="sensor-card-coords">
                      {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (activeSection.id === 'weather') {
      return (
        <div>
          <h3>{text.sections.weather.heading}</h3>
          {weatherEntries.length === 0 ? (
            <p className="village-section-empty">{text.noWeather}</p>
          ) : (
            <div className="sensor-card-grid">
              {weatherEntries.map((entry) => (
                <div key={entry.id || entry.label} className="sensor-card">
                  <h4 className="sensor-card-name">{entry.label || text.weatherValue}</h4>
                  <div className="sensor-card-reading">
                    <span className="sensor-card-value">{entry.value}</span>
                    <span className="sensor-card-unit">{entry.unit || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (activeSection.id === 'messages') {
      return (
        <div>
          <h3>{text.sections.messages.heading}</h3>
          {messages.length === 0 ? (
            <p className="village-section-empty">{text.noMessages}</p>
          ) : (
            <ul className="message-list">
              {messages.map((msg) => (
                <li key={msg.id} className={`message-item message-priority-${msg.priority}`}>
                  <p className="message-text">{msg.text}</p>
                  <time className="message-time">{new Date(msg.createdAt).toLocaleString(DATE_LOCALES[locale])}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }

    if (activeSection.id === 'events') {
      return (
        <div className="public-events-panel">
          <h3>{text.sections.events.heading}</h3>
          {events.length === 0 ? (
            <p className="village-section-empty">{text.noEvents}</p>
          ) : (
            <ul className="message-list">
              {events.map((event) => (
                <li key={event.id} className="message-item message-priority-normal">
                  <p className="message-text">{event.title || event.name || 'Event'}</p>
                  {event.startAt ? (
                    <time className="message-time">{new Date(event.startAt).toLocaleString(DATE_LOCALES[locale])}</time>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }

    if (activeSection.id === 'settings') {
      return (
        <div className="public-settings-panel">
          <section className="public-settings-block">
            <h3>{text.settings.villageTitle}</h3>
            <div className="public-village-picker public-village-picker--settings">
              <label htmlFor="public-village-select-settings">{text.settings.villageSelectLabel}</label>
              <select
                id="public-village-select-settings"
                value={selectedVillageId}
                onChange={(event) => setSelectedVillageId(event.target.value)}
                disabled={isVillagesLoading}
              >
                <option value="">{text.settings.selectPlaceholder}</option>
                {villages.map((village) => (
                  <option key={village.villageId} value={String(village.villageId)}>
                    {village.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="public-settings-block">
            <h3>{text.settings.languageTitle}</h3>
            <div className="public-village-picker public-village-picker--settings">
              <label htmlFor="public-language-select">{text.settings.languageLabel}</label>
              <select
                id="public-language-select"
                value={locale}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    language: event.target.value,
                  }))
                }
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </section>

          <section className="design-card">
            <div className="design-card-header">
              <h3 className="design-card-title">{text.settings.designTitle}</h3>
              <p className="design-card-hint">{text.settings.designHint}</p>
            </div>
            <div className="design-card-fields">
              <div className="design-select-field">
                <span className="design-select-label">{text.settings.themeMode}</span>
                <div className="design-toggle-group" role="group" aria-label={text.settings.themeMode}>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.themeMode === 'light' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        themeMode: 'light',
                      }))
                    }
                    aria-pressed={prefs.themeMode === 'light'}
                  >
                    {text.settings.themeLight}
                  </button>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.themeMode === 'dark' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        themeMode: 'dark',
                      }))
                    }
                    aria-pressed={prefs.themeMode === 'dark'}
                  >
                    {text.settings.themeDark}
                  </button>
                </div>
              </div>
              <div className="design-select-field">
                <span className="design-select-label">{text.settings.contrast}</span>
                <div className="design-toggle-group" role="group" aria-label={text.settings.contrast}>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.contrast === 'standard' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        contrast: 'standard',
                      }))
                    }
                    aria-pressed={prefs.contrast === 'standard'}
                  >
                    {text.settings.contrastStandard}
                  </button>
                  <button
                    type="button"
                    className={`design-toggle-btn${prefs.contrast === 'high' ? ' is-active' : ''}`}
                    onClick={() =>
                      setPrefs((current) => ({
                        ...current,
                        contrast: 'high',
                      }))
                    }
                    aria-pressed={prefs.contrast === 'high'}
                  >
                    {text.settings.contrastHigh}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="public-settings-summary">
            <p>{text.settings.currentVillage}: {selectedVillage?.name || '-'}</p>
            <p>{text.modules.map}: {features.map === false ? text.settings.inactive : text.settings.active}</p>
            <p>{text.modules.sensorData}: {features.sensorData === false ? text.settings.inactive : text.settings.active}</p>
            <p>{text.modules.weather}: {features.weather === true ? text.settings.active : text.settings.inactive}</p>
            <p>{text.modules.messages}: {features.messages === false ? text.settings.inactive : text.settings.active}</p>
            <p>{text.modules.rideShare}: {features.rideShare === false ? text.settings.inactive : text.settings.active}</p>
            <p>{text.modules.events}: {features.events === true ? text.settings.active : text.settings.inactive}</p>
            <p>{text.modules.textileContainers}: {features.textileContainers === true ? text.settings.active : text.settings.inactive}</p>
          </div>

          <section className="public-settings-block">
            <h3>{text.settings.supportTitle}</h3>
            <p className="public-settings-hint">{text.settings.supportHint}</p>
            <div className="public-community-links public-community-links--settings">
              {PUBLIC_COMMUNITY_LINKS.map((link) => (
                <PublicCommunityLink
                  key={link.id}
                  href={link.href}
                  label={text.community[link.id]}
                  pendingSuffix={text.community.pendingSuffix}
                />
              ))}
            </div>
          </section>
        </div>
      )
    }

    return null
  }

  return (
    <main className="admin-page public-user-page">
      <header ref={headerRef} className="admin-header public-user-header">
        <div className="admin-header-content">
          <div className="admin-header-title-row">
            <h1>{text.appTitle}</h1>
            <div className="admin-header-actions-right">
              <Link className="admin-header-link" to="/">
                Projektübersicht
              </Link>
              <Link className="admin-header-link admin-header-link--secondary" to="/admin">
                Dorf Administration
              </Link>
              {features.userAssistant !== false ? (
                <AiAssistantWidget
                  audience="user"
                  contextData={assistantContext}
                  placement="floating"
                  launcherVariant="compact"
                  locale={locale}
                />
              ) : null}
              <button
                type="button"
                className={`admin-sidebar-toggle${isMobileSidebarOpen ? ' is-open' : ''}`}
                aria-label={isMobileSidebarOpen ? text.navClose : text.navOpen}
                aria-expanded={isMobileSidebarOpen}
                aria-controls="public-sidebar"
                onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              >
                <span className="admin-sidebar-toggle-line" />
                <span className="admin-sidebar-toggle-line" />
                <span className="admin-sidebar-toggle-line" />
              </button>
            </div>
          </div>
          {selectedVillageId && (villageStatusText || villageInfoText) ? (
            <div className="public-user-header-meta" aria-label={text.compactInfoAria}>
              {villageStatusText ? <p className="public-user-header-status">{text.statusLabel}: {villageStatusText}</p> : null}
              {villageInfoText ? <p className="public-user-header-info">{villageInfoText}</p> : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="admin-layout public-user-layout" style={{ '--mobile-header-height': `${mobileHeaderHeight}px` }}>
        {isMobileSidebarOpen ? (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label={text.navClose}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        ) : null}

        <aside id="public-sidebar" className={`admin-sidebar public-user-sidebar${isMobileSidebarOpen ? ' is-open' : ''}`}>
          <nav className="admin-nav" aria-label={text.navAria}>
            {enabledSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`admin-nav-button${activeSection.id === section.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveSectionId(section.id)
                  setIsMobileSidebarOpen(false)
                }}
                aria-pressed={activeSection.id === section.id}
              >
                <span className="admin-nav-button-content">
                  <UserNavIcon sectionId={section.id} iconKey={section.iconKey} />
                  <span>{section.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className={`admin-main-content public-user-main${activeSection.id === 'map' ? ' is-map-home' : ''}`}>
          {villagesError ? (
            <section className="public-error" role="alert">
              <p>{villagesError}</p>
            </section>
          ) : null}

          {activeSection.id !== 'map' ? (
            <header className="admin-section-header">
              <h2>{activeSection.title}</h2>
            </header>
          ) : null}

          {renderTabContent()}

        </section>
      </div>

      <footer className="app-footer app-page-footer public-user-footer">
        {text.footerVillage}: {selectedVillage?.name || text.noVillageFooter}
        <br />
        <span className="app-footer-copy">
          © {new Date().getFullYear()} Smart Village · Studierendenprojekt der DHBW Lörrach
        </span>
      </footer>
    </main>
  )
}
