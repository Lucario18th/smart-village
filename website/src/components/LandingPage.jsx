import React from 'react'
import { Link } from 'react-router-dom'

const LANDING_LINKS = {
  repo: {
    label: 'GitHub Repository',
    href: import.meta.env?.VITE_GITHUB_URL || 'https://github.com/Lucario18th/smart-village',
  },
  github: {
    label: 'GitHub',
    href: import.meta.env?.VITE_GITHUB_URL || 'https://github.com/Lucario18th/smart-village',
  },
  linkedin: {
    label: 'LinkedIn',
    href: import.meta.env?.VITE_SOCIAL_LINKEDIN_URL || '#',
  },
  instagram: {
    label: 'Instagram',
    href: import.meta.env?.VITE_SOCIAL_INSTAGRAM_URL || '#',
  },
  supportEmail: {
    label: 'E-Mail',
    href: import.meta.env?.VITE_SUPPORT_EMAIL ? `mailto:${import.meta.env.VITE_SUPPORT_EMAIL}` : '#',
  },
  privacy: {
    label: 'Datenschutz',
    href: import.meta.env?.VITE_PRIVACY_URL || '#',
  },
  imprint: {
    label: 'Impressum',
    href: import.meta.env?.VITE_IMPRINT_URL || '#',
  },
  cookies: {
    label: 'Cookies',
    href: import.meta.env?.VITE_COOKIES_URL || '#',
  },
}

const TEAM_MEMBERS = [
  {
    id: 'member-1',
    name: 'Leon Kühn',
    role: 'DHBW Student',
    image: '/team/member-1.svg',
  },
  {
    id: 'member-2',
    name: 'Nico Röcker',
    role: 'DHBW Student',
    image: '/team/member-2.svg',
  },
  {
    id: 'member-3',
    name: 'Manuel Keßler',
    role: 'DHBW Student',
    image: '/team/member-3.svg',
  },
  {
    id: 'member-4',
    name: 'Alexander Shimaylo',
    role: 'DHBW Student',
    image: '/team/member-4.svg',
  },
]

const PROJECT_SHOWCASE_SLIDES = [
  {
    id: 'setup-workshop',
    title: 'Sensor-Setup im Feld',
    category: 'Praxis',
    image: '/project-gallery/sensor-setup.svg',
    alt: 'Illustration eines Sensor-Setups vor Ort mit Team und Messgeräten',
    description:
      'Der praktische Aufbau beginnt vor Ort: Unsere LoRaWAN-Gateways werden strategisch platziert und mit dem Netzwerk verbunden. Danach installieren wir die Umweltsensoren an optimalen Positionen – von der Bodenfeuchte bis zur Luftqualität. Jedes Gerät wird konfiguriert und sofort in der Admin-Oberfläche sichtbar gemacht, damit der Betrieb starten kann.',
    highlights: 'Gateway-Reichweite optimieren, Sensor-Netzwerk aufbauen, Live-Daten überprüfen',
  },
  {
    id: 'admin-configuration',
    title: 'Admin-Konfiguration live',
    category: 'Software',
    image: '/project-gallery/admin-workflow.svg',
    alt: 'Illustration einer Admin-Oberfläche mit Modulen und Kartenansicht',
    description:
      'Im Admin-Dashboard verwalten Gemeinden ihre Smart-Village-Funktionen zentral: Module wie Wetter, Mitfahrbank oder Mitteilungen können flexibel aktiviert oder deaktiviert werden. Die Sichtbarkeit für Bürger lässt sich granular steuern. Alle Änderungen sind sofort live – keine Neustart, keine Wartezeit. Eine intuitive Kartendarstellung zeigt alle Geräte und deren Status im Überblick.',
    highlights: 'Module flexibel verwalten, Rechte für Nutzergruppen setzen, Daten in Echtzeit visualisieren',
  },
  {
    id: 'mqtt-demo',
    title: 'MQTT-Datenfluss',
    category: 'Infrastruktur',
    image: '/project-gallery/mqtt-pipeline.svg',
    alt: 'Illustration eines Datenflusses von Sensoren über MQTT ins Backend',
    description:
      'Sensordaten fließen über das MQTT-Protokoll durch Mosquitto-Broker direkt ins Backend. Unsere Ingestion-Pipeline verarbeitet tausende von Messwerten pro Minute, validiert sie und speichert sie in der Datenbank. Die Echtzeitverarbeitung ermöglicht Live-Updates in der mobilen App und Web-Oberfläche – Bürger sehen Sensor-Daten mit minimaler Latenz.',
    highlights: 'Echtzeit-Datenströme verarbeiten, Qualitätschecks durchführen, Niedrige Latenz gewährleisten',
  },
  {
    id: 'community-demo',
    title: 'Bürgernahe Vorführungen',
    category: 'Community',
    image: '/project-gallery/community-demo.svg',
    alt: 'Illustration einer Projektvorführung mit Gemeinde und Team',
    description:
      'In direktem Austausch mit der Gemeinde zeigen wir, wie Smart Village im Alltag hilft: Die Bürger-App ermöglicht schnellen Zugriff auf Schule, Wettervorhersage und Mitfahrgelegenheiten. Wir sammeln Feedback zu neuen Use-Cases, erklären die Sensorik-Hintergründe und diskutieren Ideen zur Weiterentwicklung. Diese Sessions sind entscheidend, um die Plattform wirklich nutzerfreundlich zu machen.',
    highlights: 'Use-Cases mit Bürgern entwickeln, Feedback direkt aufnehmen, Transparenz über Technologie',
  },
]

function LandingLink({ href, label }) {
  const isPlaceholder = !href || href === '#'

  if (isPlaceholder) {
    return <span className="landing-link landing-link--pending">{label} (bald)</span>
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
      setActiveSlide((prev) => (prev + 1) % PROJECT_SHOWCASE_SLIDES.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [isCarouselPaused, isReducedMotion])

  const currentSlide = PROJECT_SHOWCASE_SLIDES[activeSlide]

  const goToPreviousSlide = () => {
    setActiveSlide((prev) => (prev - 1 + PROJECT_SHOWCASE_SLIDES.length) % PROJECT_SHOWCASE_SLIDES.length)
  }

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % PROJECT_SHOWCASE_SLIDES.length)
  }

  return (
    <div className="landing-page" aria-labelledby="landing-title">
      <main>
        <section className="landing-hero">
        <p className="landing-kicker">Studienarbeit · DHBW</p>
        <h1 id="landing-title">Smart Village</h1>
        <p className="landing-lead">
          Diese Website ist Teil einer Studienarbeit von DHBW-Studierenden. Wir demonstrieren,
          wie digitale Dienste, Sensordaten und lokale Informationen in einer modernen
          Smart-Village-Plattform zusammenkommen.
        </p>

        <div className="landing-actions" role="navigation" aria-label="Hauptnavigation">
          <Link to="/user" className="landing-action landing-action--primary">
            Bürgerportal
          </Link>
          <Link to="/admin" className="landing-action landing-action--secondary">
            Dorf Administration
          </Link>
          <a
            className="landing-action landing-action--android"
            href={androidAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            Android App herunterladen
          </a>
          <LandingLink {...LANDING_LINKS.repo} />
        </div>
      </section>

      <section
        className="landing-carousel"
        aria-label="Projektgalerie und Vorführungen"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        <header className="landing-carousel-header">
          <p className="landing-kicker">Projektgalerie</p>
          <h2>Echte Einblicke in Sensorik und Vorführungen</h2>
          <p>
            Erfahren Sie, wie Smart Village in der Praxis funktioniert: von der Installation der Sensoren in der Natur über die digitale Verwaltung bis hin zu den Bürgerapps. Unsere Projektgalerie zeigt alle Facetten des Systems.
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
          <button type="button" className="landing-carousel-nav" onClick={goToPreviousSlide} aria-label="Vorheriges Projektbild">
            ‹
          </button>

          <div className="landing-carousel-dots" role="tablist" aria-label="Projekt-Slides">
            {PROJECT_SHOWCASE_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeSlide}
                aria-label={`Slide ${index + 1}: ${slide.title}`}
                className={`landing-carousel-dot${index === activeSlide ? ' is-active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>

          <button type="button" className="landing-carousel-nav" onClick={goToNextSlide} aria-label="Nächstes Projektbild">
            ›
          </button>
        </div>
      </section>

      <section className="landing-team" aria-label="Unser Team">
        <h2>Unser Team</h2>
        <div className="landing-team-grid">
          {TEAM_MEMBERS.map((member) => (
            <article className="landing-team-card" key={member.id}>
              <img src={member.image} alt={`Profilbild von ${member.name}`} loading="lazy" />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </section>
    </main>

    <footer className="landing-footer" aria-label="Footer">
      <div className="landing-footer-content">
        <div className="landing-footer-links">
          <LandingLink {...LANDING_LINKS.privacy} />
          <LandingLink {...LANDING_LINKS.imprint} />
          <LandingLink {...LANDING_LINKS.cookies} />
          <LandingLink {...LANDING_LINKS.github} />
          <LandingLink {...LANDING_LINKS.linkedin} />
          <LandingLink {...LANDING_LINKS.instagram} />
          <LandingLink {...LANDING_LINKS.supportEmail} />
        </div>
        <p className="landing-footer-copy">
          © {new Date().getFullYear()} Smart Village · Studierendenprojekt der DHBW Lörrach
        </p>
      </div>
    </footer>
    </div>
  )
}
