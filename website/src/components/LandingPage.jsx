import React from 'react'
import { Link } from 'react-router-dom'

const LANDING_PREFS_KEY = 'smart-village-landing-preferences'

const I18N = {
  de: {
    languageLabel: 'Sprache',
    heroKicker: 'Studienarbeit · DHBW',
    heroTitle: 'Smart Village',
    heroLead:
      'Diese Website ist Teil einer Studienarbeit von DHBW-Studierenden. Wir demonstrieren, wie digitale Dienste, Sensordaten und lokale Informationen in einer modernen Smart-Village-Plattform zusammenkommen.',
    mainNavigation: 'Hauptnavigation',
    citizenPortal: 'Bürgerportal',
    administration: 'Administration',
    androidApp: 'Android-App',
    carouselAria: 'Projektgalerie und Vorführungen',
    carouselKicker: 'Projektgalerie',
    carouselTitle: 'Echte Einblicke in Sensorik und Vorführungen',
    carouselLead:
      'Erfahren Sie, wie Smart Village in der Praxis funktioniert: von der Installation der Sensoren in der Natur über die digitale Verwaltung bis hin zu den Bürgerapps. Unsere Projektgalerie zeigt alle Facetten des Systems.',
    previousSlide: 'Vorheriges Projektbild',
    nextSlide: 'Nächstes Projektbild',
    slidesAria: 'Projekt-Slides',
    slideLabelPrefix: 'Slide',
    teamAria: 'Unser Team',
    teamTitle: 'Unser Team',
    teamRole: 'DHBW-Student',
    footerAria: 'Footer',
    copy: 'Studierendenprojekt der DHBW Lörrach',
    links: {
      repo: 'GitHub-Repository',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      privacy: 'Datenschutz',
      imprint: 'Impressum',
      comingSoon: 'bald',
    },
    slides: [
      {
        title: 'Sensor-Setup im Feld',
        category: 'Praxis',
        alt: 'Illustration eines Sensor-Setups vor Ort mit Team und Messgeräten',
        description:
          'Der praktische Aufbau beginnt vor Ort: Unsere LoRaWAN-Gateways werden strategisch platziert und mit dem Netzwerk verbunden. Danach installieren wir die Umweltsensoren an optimalen Positionen, von der Bodenfeuchte bis zur Luftqualität. Jedes Gerät wird konfiguriert und sofort in der Admin-Oberfläche sichtbar gemacht, damit der Betrieb starten kann.',
        highlights: 'Gateway-Reichweite optimieren, Sensor-Netzwerk aufbauen, Live-Daten überprüfen',
      },
      {
        title: 'Admin-Konfiguration live',
        category: 'Software',
        alt: 'Illustration einer Admin-Oberfläche mit Modulen und Kartenansicht',
        description:
          'Im Admin-Dashboard verwalten Gemeinden ihre Smart-Village-Funktionen zentral: Module wie Wetter, Mitfahrbank oder Mitteilungen können flexibel aktiviert oder deaktiviert werden. Die Sichtbarkeit für Bürger lässt sich granular steuern. Alle Änderungen sind sofort live. Eine intuitive Kartendarstellung zeigt alle Geräte und deren Status im Überblick.',
        highlights: 'Module flexibel verwalten, Rechte für Nutzergruppen setzen, Daten in Echtzeit visualisieren',
      },
      {
        title: 'MQTT-Datenfluss',
        category: 'Infrastruktur',
        alt: 'Illustration eines Datenflusses von Sensoren über MQTT ins Backend',
        description:
          'Sensordaten fließen über das MQTT-Protokoll durch den Mosquitto-Broker direkt ins Backend. Unsere Ingestion-Pipeline verarbeitet tausende Messwerte pro Minute, validiert sie und speichert sie in der Datenbank. Die Echtzeitverarbeitung ermöglicht Live-Updates in App und Weboberfläche.',
        highlights: 'Echtzeit-Datenströme verarbeiten, Qualitätschecks durchführen, niedrige Latenz gewährleisten',
      },
      {
        title: 'Bürgernahe Vorführungen',
        category: 'Community',
        alt: 'Illustration einer Projektvorführung mit Gemeinde und Team',
        description:
          'Im direkten Austausch mit der Gemeinde zeigen wir, wie Smart Village im Alltag hilft: Die Bürger-App bietet schnellen Zugriff auf Schule, Wetter und Mitfahrgelegenheiten. Wir sammeln Feedback, erklären die Sensorik und diskutieren die Weiterentwicklung. So wird die Plattform wirklich nutzerfreundlich.',
        highlights: 'Use-Cases mit Bürgern entwickeln, Feedback direkt aufnehmen, Transparenz über Technologie',
      },
    ],
  },
  en: {
    languageLabel: 'Language',
    heroKicker: 'Study Project · DHBW',
    heroTitle: 'Smart Village',
    heroLead:
      'This website is part of a DHBW student project. We demonstrate how digital services, sensor data, and local information come together in a modern smart village platform.',
    mainNavigation: 'Main navigation',
    citizenPortal: 'Citizen Portal',
    administration: 'Administration',
    androidApp: 'Android App',
    carouselAria: 'Project gallery and showcases',
    carouselKicker: 'Project Gallery',
    carouselTitle: 'Real insights into sensors and live showcases',
    carouselLead:
      'See how Smart Village works in practice: from installing sensors in the field to digital administration and citizen applications. Our project gallery highlights every aspect of the system.',
    previousSlide: 'Previous project slide',
    nextSlide: 'Next project slide',
    slidesAria: 'Project slides',
    slideLabelPrefix: 'Slide',
    teamAria: 'Our Team',
    teamTitle: 'Our Team',
    teamRole: 'DHBW Student',
    footerAria: 'Footer',
    copy: 'Student project of DHBW Lörrach',
    links: {
      repo: 'GitHub Repository',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      privacy: 'Privacy Policy',
      imprint: 'Legal Notice',
      comingSoon: 'coming soon',
    },
    slides: [
      {
        title: 'Sensor setup on site',
        category: 'Field Work',
        alt: 'Illustration of an on-site sensor setup with team and measuring devices',
        description:
          'Practical deployment starts on site: our LoRaWAN gateways are placed strategically and connected to the network. We then install environmental sensors at optimal positions, from soil moisture to air quality. Each device is configured and immediately visible in the admin interface.',
        highlights: 'Optimize gateway coverage, build sensor network, verify live data',
      },
      {
        title: 'Live admin configuration',
        category: 'Software',
        alt: 'Illustration of an admin interface with modules and map view',
        description:
          'In the admin dashboard, municipalities manage Smart Village features centrally. Modules such as weather, rideshare bench, and announcements can be enabled or disabled flexibly. Visibility for citizens can be controlled in detail, and all changes are live instantly.',
        highlights: 'Manage modules flexibly, set user permissions, visualize data in real time',
      },
      {
        title: 'MQTT data flow',
        category: 'Infrastructure',
        alt: 'Illustration of a data flow from sensors via MQTT to the backend',
        description:
          'Sensor data streams through MQTT and the Mosquitto broker directly into the backend. Our ingestion pipeline processes thousands of readings per minute, validates them, and stores them in the database. Real-time processing enables low-latency updates in app and web.',
        highlights: 'Process real-time streams, run quality checks, guarantee low latency',
      },
      {
        title: 'Citizen-focused demos',
        category: 'Community',
        alt: 'Illustration of a project showcase with municipality and team',
        description:
          'In direct exchange with the municipality, we demonstrate how Smart Village helps in daily life. The citizen app provides quick access to schools, weather forecasts, and ride sharing. We collect feedback, explain sensor technology, and discuss next development steps.',
        highlights: 'Develop use cases with citizens, collect feedback directly, ensure transparency',
      },
    ],
  },
  fr: {
    languageLabel: 'Langue',
    heroKicker: 'Projet d’études · DHBW',
    heroTitle: 'Smart Village',
    heroLead:
      'Ce site fait partie d’un projet d’études des étudiants de la DHBW. Nous montrons comment les services numériques, les données de capteurs et les informations locales se réunissent dans une plateforme Smart Village moderne.',
    mainNavigation: 'Navigation principale',
    citizenPortal: 'Portail citoyen',
    administration: 'Administration',
    androidApp: 'Application Android',
    carouselAria: 'Galerie du projet et démonstrations',
    carouselKicker: 'Galerie du projet',
    carouselTitle: 'Aperçus concrets de la capteurisation et des démonstrations',
    carouselLead:
      'Découvrez le fonctionnement pratique de Smart Village : de l’installation des capteurs sur le terrain à la gestion numérique et aux applications citoyennes. Notre galerie présente toutes les facettes du système.',
    previousSlide: 'Diapositive précédente',
    nextSlide: 'Diapositive suivante',
    slidesAria: 'Diapositives du projet',
    slideLabelPrefix: 'Diapositive',
    teamAria: 'Notre équipe',
    teamTitle: 'Notre équipe',
    teamRole: 'Étudiant DHBW',
    footerAria: 'Pied de page',
    copy: 'Projet étudiant de la DHBW Lörrach',
    links: {
      repo: 'Dépôt GitHub',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      privacy: 'Protection des données',
      imprint: 'Mentions légales',
      comingSoon: 'bientôt',
    },
    slides: [
      {
        title: 'Installation des capteurs sur le terrain',
        category: 'Terrain',
        alt: 'Illustration d’une installation de capteurs sur site avec équipe et appareils de mesure',
        description:
          'Le déploiement pratique commence sur place : nos passerelles LoRaWAN sont positionnées stratégiquement et connectées au réseau. Ensuite, nous installons les capteurs environnementaux aux emplacements optimaux, de l’humidité du sol à la qualité de l’air. Chaque appareil est configuré et visible immédiatement dans l’interface admin.',
        highlights: 'Optimiser la portée des passerelles, construire le réseau de capteurs, vérifier les données en direct',
      },
      {
        title: 'Configuration admin en direct',
        category: 'Logiciel',
        alt: 'Illustration d’une interface administrateur avec modules et vue cartographique',
        description:
          'Dans le tableau de bord admin, les communes gèrent les fonctionnalités Smart Village de manière centralisée. Des modules comme la météo, le banc de covoiturage ou les actualités peuvent être activés ou désactivés facilement. Les modifications sont appliquées instantanément.',
        highlights: 'Gérer les modules avec souplesse, définir les permissions, visualiser les données en temps réel',
      },
      {
        title: 'Flux de données MQTT',
        category: 'Infrastructure',
        alt: 'Illustration d’un flux de données des capteurs via MQTT vers le backend',
        description:
          'Les données des capteurs transitent via MQTT et le broker Mosquitto directement vers le backend. Notre pipeline d’ingestion traite des milliers de mesures par minute, les valide et les enregistre en base de données. Le traitement en temps réel permet des mises à jour quasi instantanées.',
        highlights: 'Traiter des flux en temps réel, effectuer des contrôles qualité, garantir une faible latence',
      },
      {
        title: 'Démonstrations proches des citoyens',
        category: 'Communauté',
        alt: 'Illustration d’une démonstration du projet avec la commune et l’équipe',
        description:
          'En échange direct avec la commune, nous montrons comment Smart Village aide au quotidien. L’application citoyenne donne un accès rapide à l’école, à la météo et au covoiturage. Nous recueillons les retours, expliquons la technologie des capteurs et discutons des évolutions futures.',
        highlights: 'Construire les cas d’usage avec les citoyens, recueillir les retours, assurer la transparence technologique',
      },
    ],
  },
}

const DEFAULT_LANDING_PREFS = {
  language: 'de',
}

function loadLandingPrefs() {
  try {
    const raw = localStorage.getItem(LANDING_PREFS_KEY)
    if (!raw) return DEFAULT_LANDING_PREFS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_LANDING_PREFS,
      ...parsed,
    }
  } catch {
    return DEFAULT_LANDING_PREFS
  }
}

function persistLandingPrefs(prefs) {
  localStorage.setItem(LANDING_PREFS_KEY, JSON.stringify(prefs))
}

const LANDING_LINKS = {
  repo: {
    href: import.meta.env?.VITE_GITHUB_URL || 'https://github.com/Lucario18th/smart-village',
  },
  github: {
    href: import.meta.env?.VITE_GITHUB_URL || 'https://github.com/Lucario18th/smart-village',
  },
  linkedin: {
    href: import.meta.env?.VITE_SOCIAL_LINKEDIN_URL || '#',
  },
  instagram: {
    href: import.meta.env?.VITE_SOCIAL_INSTAGRAM_URL || '#',
  },
  privacy: {
    href: '/datenschutz',
  },
  imprint: {
    href: '/impressum',
  },
}

const TEAM_MEMBERS = [
    {
    id: 'member-1',
    name: 'Manuel Keßler',
    image: '/team/member-3.svg',
  },
  {
    id: 'member-2',
    name: 'Leon Kühn',
    image: '/team/member-1.svg',
  },
  {
    id: 'member-3',
    name: 'Nico Röcker',
    image: '/team/member-2.svg',
  },
  {
    id: 'member-4',
    name: 'Alexander Shimaylo',
    image: '/team/member-4.svg',
  },
]

const PROJECT_SHOWCASE_SLIDES = [
  { id: 'setup-workshop', image: '/project-gallery/sensor-setup.svg' },
  { id: 'admin-configuration', image: '/project-gallery/admin-workflow.svg' },
  { id: 'mqtt-demo', image: '/project-gallery/mqtt-pipeline.svg' },
  { id: 'community-demo', image: '/project-gallery/community-demo.svg' },
]

function LandingLink({ href, label, pendingText }) {
  const isPlaceholder = !href || href === '#'

  if (isPlaceholder) {
    return <span className="landing-link landing-link--pending">{label} ({pendingText})</span>
  }

  const isExternal = /^https?:\/\//i.test(href)
  return (
    <a
      className="landing-link"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      {label}
    </a>
  )
}

export default function LandingPage() {
  const androidAppUrl =
    import.meta.env?.VITE_ANDROID_APP_URL ||
    'https://play.google.com/store/apps/details?id=de.tif23.studienarbeit'
  const [activeSlide, setActiveSlide] = React.useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = React.useState(false)
  const [isReducedMotion, setIsReducedMotion] = React.useState(false)
  const [landingPrefs, setLandingPrefs] = React.useState(() => loadLandingPrefs())
  const locale = landingPrefs.language || 'de'
  const text = I18N[locale] || I18N.de
  const localizedSlides = PROJECT_SHOWCASE_SLIDES.map((slide, index) => ({
    ...slide,
    ...(text.slides[index] || I18N.de.slides[index]),
  }))

  React.useEffect(() => {
    persistLandingPrefs(landingPrefs)
  }, [landingPrefs])

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotionPref = () => setIsReducedMotion(Boolean(media.matches))

    applyMotionPref()
    media.addEventListener('change', applyMotionPref)

    return () => {
      media.removeEventListener('change', applyMotionPref)
    }
  }, [])

  React.useEffect(() => {
    if (isCarouselPaused || isReducedMotion) return undefined

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % localizedSlides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [isCarouselPaused, isReducedMotion, localizedSlides.length])

  const currentSlide = localizedSlides[activeSlide]

  const goToPreviousSlide = () => {
    setActiveSlide((prev) => (prev - 1 + localizedSlides.length) % localizedSlides.length)
  }

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % localizedSlides.length)
  }

  return (
    <div className="landing-page" aria-labelledby="landing-title">
      <main>
        <section className="landing-hero">
        <p className="landing-kicker">{text.heroKicker}</p>
        <h1 id="landing-title">{text.heroTitle}</h1>
        <p className="landing-lead">
          {text.heroLead}
        </p>

        <div className="landing-actions" role="navigation" aria-label={text.mainNavigation}>
          <Link to="/user" className="landing-action landing-action--primary">
            <svg className="landing-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H9M17 7V15" />
            </svg>
            {text.citizenPortal}
          </Link>
          <Link to="/admin" className="landing-action landing-action--secondary">
            <svg className="landing-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H9M17 7V15" />
            </svg>
            {text.administration}
          </Link>
          <a
            className="landing-action landing-action--android"
            href={androidAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg className="landing-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19v-8M12 11L9 14M12 11l3 3" />
            </svg>
            {text.androidApp}
          </a>
          <LandingLink href={LANDING_LINKS.repo.href} label={text.links.repo} pendingText={text.links.comingSoon} />
        </div>
      </section>

      <section
        className="landing-carousel"
        aria-label={text.carouselAria}
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        <header className="landing-carousel-header">
          <p className="landing-kicker">{text.carouselKicker}</p>
          <h2>{text.carouselTitle}</h2>
          <p>
            {text.carouselLead}
          </p>
        </header>

        <article className="landing-carousel-stage" aria-live="polite">
          <figure className="landing-carousel-media">
            <img src={currentSlide.image} alt={currentSlide.alt} loading="lazy" />
            <figcaption>{currentSlide.category}</figcaption>
          </figure>

          <div className="landing-carousel-content">
            <h3>{currentSlide.title}</h3>
            <p>{currentSlide.description}</p>
            <p className="landing-carousel-highlights">{currentSlide.highlights}</p>
          </div>
        </article>

        <div className="landing-carousel-controls">
          <button type="button" className="landing-carousel-nav" onClick={goToPreviousSlide} aria-label={text.previousSlide}>
            ‹
          </button>

          <div className="landing-carousel-dots" role="tablist" aria-label={text.slidesAria}>
            {localizedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeSlide}
                aria-label={`${text.slideLabelPrefix} ${index + 1}: ${slide.title}`}
                className={`landing-carousel-dot${index === activeSlide ? ' is-active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>

          <button type="button" className="landing-carousel-nav" onClick={goToNextSlide} aria-label={text.nextSlide}>
            ›
          </button>
        </div>
      </section>

      <section className="landing-team" aria-label={text.teamAria}>
        <h2>{text.teamTitle}</h2>
        <div className="landing-team-grid">
          {TEAM_MEMBERS.map((member) => (
            <article className="landing-team-card" key={member.id}>
              <img src={member.image} alt={`Profilbild von ${member.name}`} loading="lazy" />
              <h3>{member.name}</h3>
              <p>{text.teamRole}</p>
            </article>
          ))}
        </div>
      </section>
    </main>

    <footer className="landing-footer" aria-label={text.footerAria}>
      <div className="landing-footer-content">
        <div className="landing-footer-top">
          <div className="landing-footer-links">
            <LandingLink href={LANDING_LINKS.privacy.href} label={text.links.privacy} pendingText={text.links.comingSoon} />
            <LandingLink href={LANDING_LINKS.imprint.href} label={text.links.imprint} pendingText={text.links.comingSoon} />
            <LandingLink href={LANDING_LINKS.github.href} label={text.links.github} pendingText={text.links.comingSoon} />
            <LandingLink href={LANDING_LINKS.linkedin.href} label={text.links.linkedin} pendingText={text.links.comingSoon} />
            <LandingLink href={LANDING_LINKS.instagram.href} label={text.links.instagram} pendingText={text.links.comingSoon} />
          </div>
          <div className="landing-language-selector">
            <label htmlFor="landing-language-select">{text.languageLabel}</label>
            <select
              id="landing-language-select"
              value={locale}
              onChange={(event) =>
                setLandingPrefs((current) => ({
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
        </div>
        <p className="landing-footer-copy">
          © {new Date().getFullYear()} Smart Village · {text.copy}
        </p>
      </div>
    </footer>
    </div>
  )
}
