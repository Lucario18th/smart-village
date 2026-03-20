import React from 'react'

export default function ImpressumPage() {
  return (
    <div className="legal-page">
      <main className="legal-content">
        <h1>Impressum</h1>

        <section className="legal-section">
          <h2>Angaben gemäß § 5 TMG</h2>
          <div className="legal-text">
            <p>
              <strong>Smart Village – Studierendenprojekt der DHBW Lörrach</strong>
            </p>
            <p>
              Duale Hochschule Baden-Württemberg Lörrach<br />
              Tumringerstraße 665<br />
              79539 Lörrach<br />
              Deutschland
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Projektverantwortliche</h2>
          <div className="legal-text">
            <p>
              <strong>Projektteam:</strong><br />
              Leon Kühn<br />
              Nico Röcker<br />
              Manuel Keßler<br />
              Alexander Shimaylo
            </p>
            <p>
              <strong>Betreuung:</strong><br />
              Prof. Holger Schenk
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Kontakt</h2>
          <div className="legal-text">
            <p>
              E-Mail: {import.meta.env?.VITE_SUPPORT_EMAIL || 'kontakt@smart-village.local'}
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Haftungshinweis</h2>
          <div className="legal-text">
            <p>
              Smart Village ist ein Studierendenprojekt der Dualen Hochschule Baden-Württemberg Lörrach. 
              Die Plattform wird zu Demonstrations- und Testzwecken betrieben.
            </p>
            <p>
              Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. 
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
            <p>
              Die Verfügbarkeit und Funktionalität der Plattform können ohne Ankündigung verändert oder 
              eingestellt werden.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Urheber- und Leistungsschutzrechte</h2>
          <div className="legal-text">
            <p>
              Das Projekt ist unter einer Open-Source-Lizenz auf GitHub verfügbar:{' '}
              <a
                href={import.meta.env?.VITE_GITHUB_URL || 'https://github.com/Lucario18th/smart-village'}
                target="_blank"
                rel="noreferrer"
              >
                github.com/Lucario18th/smart-village
              </a>
            </p>
            <p>
              Weitere Informationen zur Lizensierung finden Sie im Repository.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Technische Umsetzung</h2>
          <div className="legal-text">
            <p>
              <strong>Frontend:</strong> React.js, Vite<br />
              <strong>Backend:</strong> Node.js, Express.js, Prisma ORM<br />
              <strong>Datenbank:</strong> PostgreSQL<br />
              <strong>IoT-Infrastruktur:</strong> LoRaWAN, MQTT (Mosquitto)
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Änderungen am Impressum</h2>
          <div className="legal-text">
            <p>
              Wir behalten uns vor, dieses Impressum jederzeit zu aktualisieren. Die aktuelle Version 
              ist immer unter diesem Menüpunkt abrufbar.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
