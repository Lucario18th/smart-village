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
  terms: {
    label: 'AGB',
    href: import.meta.env?.VITE_TERMS_URL || '#',
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

  return (
    <main className="landing-page" aria-labelledby="landing-title">
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
            Zur User-Seite
          </Link>
          <Link to="/admin" className="landing-action landing-action--secondary">
            Zur Admin-Seite
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

      <section className="landing-grid" aria-label="Projektinformationen">
        <article className="landing-card">
          <h2>Über das Projekt</h2>
          <p>
            Smart Village verbindet Gemeindeinformationen, Sensorik, Mitfahrbank-Status,
            Wetterdaten und weitere Module in einem einheitlichen System.
          </p>
        </article>

        <article className="landing-card">
          <h2>Über uns</h2>
          <p>
            Wir sind Studierende der DHBW: Leon Kühn, Nico Röcker, Manuel Keßler und
            Alexander Shimaylo. Das Projekt wird betreut von Herrn Schenk und als
            praxisorientierte Studienarbeit im sechsten Semester umgesetzt.
          </p>
        </article>

        <article className="landing-card">
          <h2>Hinweis zu Testzwecken</h2>
          <p>
            Dieses System ist eine Test- und Demonstrationsumgebung im Rahmen der Studienarbeit.
            Inhalte und Funktionen können sich während der Entwicklung ändern.
          </p>
        </article>
      </section>

      <section className="landing-team" aria-label="Unser Team">
        <h2>Unser Team</h2>
        <p>
          Hier könnt ihr eure echten Fotos und Namen eintragen. Ersetzt dafür einfach die
          Bilder unter /public/team und passt die Einträge in dieser Komponente an.
        </p>
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

      <section className="landing-meta" aria-label="Rechtliches und Social Links">
        <h2>Datenschutz, AGB und Links</h2>
        <p>
          Bitte beachten: Die Plattform wird zu Testzwecken betrieben. Weitere Informationen
          zu Datenschutz, AGB, Cookies, Impressum und Kontakt finden Sie in den folgenden Links.
        </p>
        <div className="landing-link-grid">
          <LandingLink {...LANDING_LINKS.privacy} />
          <LandingLink {...LANDING_LINKS.terms} />
          <LandingLink {...LANDING_LINKS.cookies} />
          <LandingLink {...LANDING_LINKS.imprint} />
          <LandingLink {...LANDING_LINKS.github} />
          <LandingLink {...LANDING_LINKS.linkedin} />
          <LandingLink {...LANDING_LINKS.instagram} />
          <LandingLink {...LANDING_LINKS.supportEmail} />
        </div>
      </section>
    </main>
  )
}
