import React from 'react'

export default function DatenschutzPage() {
  return (
    <div className="legal-page">
      <main className="legal-content">
        <h1>Datenschutz</h1>

        <section className="legal-section">
          <h2>1. Allgemeine Informationen</h2>
          <div className="legal-text">
            <p>
              Smart Village ist ein Studierendenprojekt der Dualen Hochschule Baden-Württemberg Lörrach. 
              Wir nehmen den Schutz Ihrer Daten ernst und verarbeiten persönliche Informationen nur in 
              der Weise und in dem Umfang, wie es für die Bereitstellung und Verbesserung unserer Dienste 
              erforderlich ist.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Verantwortliche für die Datenverarbeitung</h2>
          <div className="legal-text">
            <p>
              <strong>Duale Hochschule Baden-Württemberg Lörrach<br />
              Tumringerstraße 665<br />
              79539 Lörrach</strong>
            </p>
            <p>
              Kontakt: {import.meta.env?.VITE_SUPPORT_EMAIL || 'kontakt@smart-village.local'}
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Welche Daten erfassen wir?</h2>
          <div className="legal-text">
            <h3>Benutzerregistrierung und Administration</h3>
            <p>
              Wenn Sie sich registrieren, erfassen wir:
            </p>
            <ul>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Name (optional)</li>
            </ul>

            <h3>Sensordaten und Messwerte</h3>
            <p>
              Unsere IoT-Sensoren erfassen kontinuierlich:
            </p>
            <ul>
              <li>Temperatur und Luftfeuchtigkeit</li>
              <li>Bodenfeuchte und Luftdruck</li>
              <li>Luftqualitätsdaten</li>
              <li>GPS-Positionen (Gateways und Sensoren)</li>
            </ul>

            <h3>Protokolldaten und Tracking</h3>
            <p>
              Unser Server erfasst:
            </p>
            <ul>
              <li>IP-Adressen</li>
              <li>HTTP-Request-Logs</li>
              <li>Zeitstempel von Zugriffen</li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>4. Rechtliche Grundlagen der Datenverarbeitung</h2>
          <div className="legal-text">
            <p>
              <strong>Art. 6 Abs. 1 DSGVO – Zustimmung und legitime Interessen:</strong>
            </p>
            <ul>
              <li>
                <strong>Registrierung:</strong> Verarbeitung mit deiner Einwilligung (Buchstabe a)
              </li>
              <li>
                <strong>Sensordaten:</strong> Verarbeitung zu wissenschaftlichen und Testzwecken und im 
                legitimen Interesse der Hochschule (Buchstabe f)
              </li>
              <li>
                <strong>Sicherheit:</strong> Verarbeitung zu Sicherheits- und Fehlerbehebungszwecken (Buchstabe f)
              </li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>5. Speicherdauer</h2>
          <div className="legal-text">
            <p>
              <strong>Benutzerdaten:</strong> Solange das Benutzerkonto aktiv ist, maximal bis Ende des Semesters.
            </p>
            <p>
              <strong>Sensordaten:</strong> Bis zu 12 Monate für Langzeitanalysen; historische Daten werden 
              nach 12 Monaten archiviert oder gelöscht.
            </p>
            <p>
              <strong>Protokolldaten:</strong> Maximal 90 Tage für Sicherheits- und Performanceanalysen.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>6. Deine Rechte</h2>
          <div className="legal-text">
            <p>
              Nach der DSGVO hast du folgende Rechte:
            </p>
            <ul>
              <li>
                <strong>Auskunft:</strong> Du kannst jederzeit erfragen, welche Daten über dich gespeichert sind.
              </li>
              <li>
                <strong>Berichtigung:</strong> Du kannst fehlerhafte Daten korrigieren lassen.
              </li>
              <li>
                <strong>Löschung:</strong> Du kannst die Löschung deiner Daten beantragen (Recht auf Vergessenwerden).
              </li>
              <li>
                <strong>Einschränkung:</strong> Du kannst die Verarbeitung einschränken lassen.
              </li>
              <li>
                <strong>Datenportabilität:</strong> Du kannst deine Daten in einem strukturierten Format erhalten.
              </li>
              <li>
                <strong>Widerspruch:</strong> Du kannst der Verarbeitung widersprechen.
              </li>
            </ul>
            <p>
              Um deine Rechte geltend zu machen, kontaktiere uns unter:{' '}
              {import.meta.env?.VITE_SUPPORT_EMAIL || 'kontakt@smart-village.local'}
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>7. Cookies und Tracking</h2>
          <div className="legal-text">
            <p>
              Wir verwenden Cookies minimal und nur für:
            </p>
            <ul>
              <li>Session-Management (Authentifizierung)</li>
              <li>Sicherheit und CSRF-Schutz</li>
            </ul>
            <p>
              Wir verwenden <strong>kein</strong> Google Analytics oder andere Tracking-Tools für 
              persönliches Verhalten.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>8. Weitergabe an Dritte</h2>
          <div className="legal-text">
            <p>
              Wir geben keine personenbezogenen Daten an Dritte weiter, ausgenommen:
            </p>
            <ul>
              <li>Wenn deine schriftliche Genehmigung vorliegt</li>
              <li>Wenn die Weitergabe gesetzlich erforderlich ist</li>
              <li>Für den Betrieb der Plattform erforderliche Infrastrukturpartner (z.B. Cloud-Provider)</li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>9. Sicherheit</h2>
          <div className="legal-text">
            <p>
              Wir implementieren technische und organisatorische Maßnahmen, um Daten vor Verlust, 
              Missbrauch und unbefugtem Zugriff zu schützen:
            </p>
            <ul>
              <li>HTTPS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Verschlüsselte Speicherung von Passwörtern (bcrypt)</li>
              <li>Regelmäßige Backdoor- und Schwachstellenüberprüfungen</li>
              <li>Zugriffskontrolle und Logging</li>
            </ul>
          </div>
        </section>

        <section className="legal-section">
          <h2>10. Datenschutzbeauftragter</h2>
          <div className="legal-text">
            <p>
              Die Duale Hochschule Baden-Württemberg hat einen behördlichen Datenschutzbeauftragten, 
              den du jederzeit kontaktieren kannst.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>11. Änderungen der Datenschutzerklärung</h2>
          <div className="legal-text">
            <p>
              Diese Datenschutzerklärung wird regelmäßig überprüft und angepasst. Wir informieren dich 
              bei Änderungen, die deine Rechte oder Pflichten betreffen.
            </p>
          </div>
        </section>

        <section className="legal-section">
          <h2>12. Kontakt und Beschwerden</h2>
          <div className="legal-text">
            <p>
              <strong>Fragen zum Datenschutz:</strong><br />
              {import.meta.env?.VITE_SUPPORT_EMAIL || 'kontakt@smart-village.local'}
            </p>
            <p>
              <strong>Beschwerde bei einer Datenschutzbehörde:</strong><br />
              Du hast das Recht, bei der zuständigen Datenschutzbehörde eine Beschwerde einzureichen, 
              wenn du der Meinung bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.
            </p>
          </div>
        </section>

        <div className="legal-footer">
          <p>Stand: März 2026</p>
        </div>
      </main>
    </div>
  )
}
