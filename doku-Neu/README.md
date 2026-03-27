# Dokumentation – Smart Village

Diese Dokumentation beschreibt das Smart-Village-Projekt der DHBW Lörrach.
Sie richtet sich an Entwickler, die neu in das Projekt einsteigen oder bestehende Funktionen nachvollziehen möchten.

Alle Dokumente sind in deutscher Sprache verfasst.

## Aktueller Stand (2026-03-18)

Die Dokumentation bildet den folgenden, bereits implementierten Funktionsstand ab:

- Backend- und Website-Abhaengigkeiten wurden umfassend auf aktuelle Versionen angehoben (u. a. Nest 11, React 19, Vite 8).
- Sicherheits-Hardening umgesetzt: sichere SQL-Ausfuehrung ohne `$queryRawUnsafe`, strengere Request-Validierung, Helmet, restriktiveres CORS, sichere JWT-Secret-Erzwingung.
- Nginx-Sicherheitsheader wurden erweitert (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- Container-Hardening umgesetzt (Backend-Image mit `npm ci`, `--omit=dev`, Non-Root-User).
- Offene produktive Geheimnisse in `infra/smartvillage.env` durch Platzhalter ersetzt.
- Lokale Verifikation erfolgreich: Backend- und Website-Build sowie Tests laufen grün.
- Docker-Compose-Endtest ist vorbereitet, auf diesem Host aber blockiert solange Docker Desktop/Daemon nicht gestartet ist.

- Sensorfreigabe fuer App/Public erfolgt ueber `Sensor.exposeToApp` (nicht ueber `isActive`).
- Sensoren werden nach ca. 60 Sekunden ohne neue Messwerte als `dataStale` gekennzeichnet.
- Gemeinde-Status kann als `Village.statusText` persistiert und ueber API/App-API ausgeliefert werden.
- Public-Ansichten verwenden modulbasierte Sichtbarkeit (Feature-Flags), ohne deaktivierte Platzhalter.
- Website und App aktualisieren Nutzdaten einheitlich ueber Polling auf der App-API (`/api/app/...`).
- Kartenfilter im Adminbereich werden pro Nutzer/Gemeinde in der Session persistiert und nicht durch Polling zurueckgesetzt.
- Oeffentliche Startseite (`/`) ist als Projekt-Landingpage mit Team-, Rechts- und Projektinformationen umgesetzt.
- Public-User-Dashboard ist unter `/user` erreichbar; Admin bleibt unter `/admin`.
- Navigation ist wechselseitig verlinkt: Landingpage <-> User <-> Admin.
- Darkmode ist systemweit als Standard gesetzt (Website-Initialzustand, Theme-Fallback, Default-Konfiguration).
- Android-Download-Button auf der Landingpage fuehrt zum konfigurierbaren App-Link (`VITE_ANDROID_APP_URL`) mit Play-Store-Fallback.
- Teamdaten und Projektbetreuung sind auf der Landingpage gepflegt (Leon Kühn, Nico Röcker, Manuel Keßler, Alexander Shimaylo; Betreuung: Herr Schenk).

## Hinweis zur Mobile API

Die Mobile API (`/mobile-api/`) wird in dieser Dokumentation bewusst nicht behandelt.
Sie wird in naher Zukunft vollständig neu gestaltet. Vorhandener Code und bestehende Dokumente zur Mobile API sind daher als veraltet zu betrachten und hier nicht aufgeführt.

## Dokumentationsstruktur

Die Dokumentation ist in folgende Bereiche aufgeteilt:

```
docs/
├── README.md                              ← Dieses Dokument (Navigation)
├── aenderungen-2026-03-18.md              ← Letzte umgesetzte Änderungen (aktueller Snapshot)
├── aenderungen-2026-03-15.md              ← Aelterer Snapshot
├── aenderungen-2026-03-17.md              ← Vorheriger Snapshot
├── uebersicht.md                          ← Projektübersicht
├── architektur/
│   ├── system-uebersicht.md               ← Systemarchitektur
│   ├── infrastruktur.md                   ← Docker, Nginx, Netzwerk
│   └── datenmodell.md                     ← Datenbankschema und Entitäten
├── backend/
│   ├── authentifizierung.md               ← Registrierung, Login, JWT
│   ├── gemeinden.md                       ← Gemeindeverwaltung (Village)
│   ├── sensoren.md                        ← Sensorverwaltung und Messwerte
│   ├── geraete.md                         ← Geräteverwaltung (Devices)
│   ├── mqtt-integration.md                ← MQTT-Anbindung und Discovery
│   ├── app-api.md                         ← App-API (REST + Polling fuer Website und App)
│   ├── admin-verwaltung.md                ← Admin-Modul (Kontolöschung)
│   └── standortsuche.md                   ← PLZ-Suche (Locations)
├── app/
│   └── uebersicht.md                      ← Android-App (Kotlin/Compose Multiplatform)
├── frontend/
│   ├── uebersicht.md                      ← Frontend-Architektur
│   ├── komponenten.md                     ← React-Komponentenstruktur
│   └── api-anbindung.md                   ← API-Client und Hooks
├── api/
│   └── endpunkte.md                       ← REST-API-Endpunkte-Referenz
├── betrieb/
│   ├── deployment.md                      ← Deployment mit Docker Compose
│   └── sicherheit.md                      ← Sicherheitskonzept
└── prozesse/
    ├── registrierung-und-login.md         ← Ablauf: Registrierung und Login
    ├── sensor-datenfluss.md               ← Ablauf: Sensordaten ueber REST und Polling
    ├── auto-discovery.md                  ← Ablauf: Automatische Geräteerkennung
    ├── use-case-raspberry-pi5.md          ← Prozess-Usecase: Raspberry Pi 5 im Smart-Village-Kontext
    ├── antwort-staat.md                   ← Prozess-Usecase: Kommunale Rueckmeldung an Buerger
    └── studienkontext-kommunen.md         ← Studienkontext: Kontaktversuche mit Kommunen
```

## Verzeichnis der Dokumente

| Dokument | Beschreibung |
|----------|-------------|
| [Aenderungsprotokoll 2026-03-18](aenderungen-2026-03-18.md) | Security- und Versionsupdate ueber Backend, Frontend und Infrastruktur inkl. Test- und Audit-Ergebnisse. |
| [Aenderungsprotokoll 2026-03-17](aenderungen-2026-03-17.md) | Kompakte Liste der zuletzt umgesetzten Änderungen über Backend, Frontend, Routing, UI und App-Integration. |
| [Aenderungsprotokoll 2026-03-15](aenderungen-2026-03-15.md) | Vorheriger Snapshot der umgesetzten Änderungen. |
| [Projektübersicht](uebersicht.md) | Was das Projekt ist, welche Anwendungsfälle es gibt und wie die Hauptkomponenten zusammenarbeiten. |
| [Systemarchitektur](architektur/system-uebersicht.md) | Überblick über die Architektur mit Modulen, Schichten und Abhängigkeiten. |
| [Infrastruktur](architektur/infrastruktur.md) | Docker-Compose-Setup, Nginx-Konfiguration und Netzwerk. |
| [Datenmodell](architektur/datenmodell.md) | Datenbankschema mit allen Entitäten, Feldern und Beziehungen. |
| [Authentifizierung](backend/authentifizierung.md) | JWT-basierte Authentifizierung, E-Mail-Verifizierung und Guards. |
| [Gemeindeverwaltung](backend/gemeinden.md) | Verwaltung von Gemeindedaten (Villages). |
| [Sensorverwaltung](backend/sensoren.md) | CRUD-Operationen für Sensoren, Sensortypen und Messwerte. |
| [Geräteverwaltung](backend/geraete.md) | Verwaltung von IoT-Geräten (Devices/Controller). |
| [MQTT-Integration](backend/mqtt-integration.md) | Echtzeitdaten-Empfang über MQTT und automatische Geräteerkennung. |
| [App-API](backend/app-api.md) | REST-Endpunkte fuer Website und mobile App (Polling-basiert). |
| [Admin-Modul](backend/admin-verwaltung.md) | Admin-Funktionen wie Kontolöschung mit kaskadierendem Löschen. |
| [Standortsuche](backend/standortsuche.md) | Postleitzahl- und Ortssuche. |
| [App-Übersicht](app/uebersicht.md) | Architektur, Komponenten, Datenfluss und Build-/Run-Hinweise der Android-App (Kotlin/Compose Multiplatform). |
| [Frontend-Übersicht](frontend/uebersicht.md) | Aufbau des React-Frontends mit Vite. |
| [Komponentenstruktur](frontend/komponenten.md) | Alle React-Komponenten und ihre Aufgaben. |
| [API-Anbindung](frontend/api-anbindung.md) | API-Client, Hooks und Zustandsverwaltung im Frontend. |
| [API-Endpunkte](api/endpunkte.md) | Vollständige Referenz aller REST-Endpunkte (ohne Mobile API). |
| [Deployment](betrieb/deployment.md) | Anleitung zum Starten und Betreiben des Systems mit Docker. |
| [Sicherheit](betrieb/sicherheit.md) | Sicherheitsmaßnahmen, VPN-Konzept und Produktionshinweise. |
| [Registrierung und Login](prozesse/registrierung-und-login.md) | Ablauf der Benutzerregistrierung und Anmeldung. |
| [Sensor-Datenfluss](prozesse/sensor-datenfluss.md) | Wie Sensordaten in Backend und Clients ueber REST/Polling bereitgestellt werden. |
| [Auto-Discovery](prozesse/auto-discovery.md) | Automatische Erkennung neuer Geräte und Sensoren über MQTT. |
| [Use Case: Raspberry Pi 5](prozesse/use-case-raspberry-pi5.md) | Beispielhafter End-to-End-Usecase fuer die Integration eines Raspberry Pi 5 als IoT-Gateway und Sensor-Node. |
| [Use Case: Antwort Staat](prozesse/antwort-staat.md) | Typischer Ablauf, wie eine Gemeinde Informationen und Rueckmeldungen an Buerger ueber die Plattform bereitstellt. |
| [Studienkontext Kommunen](prozesse/studienkontext-kommunen.md) | Dokumentation der Kontaktversuche mit Kommunen und der Rueckmeldesituation im Projektzeitraum. |

## Zuordnung bestehender Dokumente

Vor dieser Neustrukturierung existierten Dokumente im Ordner `doku/` und verstreut im Hauptverzeichnis.
Die folgende Tabelle zeigt, welches alte Dokument welchem neuen Dokument entspricht.

| Altes Dokument | Neues Dokument | Anmerkung |
|----------------|---------------|-----------|
| `doku/QUICK-START.md` | [Deployment](betrieb/deployment.md) | Inhalte integriert |
| `doku/Backend-API.md` | [API-Endpunkte](api/endpunkte.md) | Inhalte integriert |
| `doku/Frontend-API-Integration.md` | [API-Anbindung](frontend/api-anbindung.md) | Inhalte integriert |
| `doku/AdminView-Architektur.md` | [Komponentenstruktur](frontend/komponenten.md) | Inhalte integriert |
| `doku/AdminView-API-Integration.md` | [API-Anbindung](frontend/api-anbindung.md) | Inhalte integriert |
| `doku/AdminView-Technische-Details.md` | [Komponentenstruktur](frontend/komponenten.md) | Inhalte integriert |
| `doku/Datenbank-Schema.md` | [Datenmodell](architektur/datenmodell.md) | Inhalte integriert |
| `doku/Datenbanken.md` | [Deployment](betrieb/deployment.md) | Abschnitt Datenbank |
| `doku/API-ENDPUNKTE-UEBERSICHT.md` | [API-Endpunkte](api/endpunkte.md) | Inhalte integriert |
| `doku/Netzwerk- und Zugriffskonzept.md` | [Sicherheit](betrieb/sicherheit.md) | Inhalte integriert |
| `doku/Server-Sicherheit-Deployment.md` | [Sicherheit](betrieb/sicherheit.md) | Inhalte integriert |
| `doku/Code-Deploy-Server.md` | [Deployment](betrieb/deployment.md) | Inhalte integriert |
| `doku/HANDOVER-CHECKLIST.md` | — | Projektmanagement, nicht Teil der technischen Doku |
| `doku/PROJEKT-ABSCHLUSS.md` | — | Projektmanagement, nicht Teil der technischen Doku |
| `doku/Implementierungsanleitung.md` | Mehrere Dokumente | Teils veraltet, Inhalte verteilt |
| `docs/API.md` | [API-Endpunkte](api/endpunkte.md) | Inhalte integriert |
| `MOBILE-API-*.md` (alle) | — | Außerhalb des Geltungsbereichs (Mobile API) |
| `APP-INTEGRATION-GUIDE.md` | — | Außerhalb des Geltungsbereichs (Mobile API) |
| `API-COMPARISON-GUIDE.md` | — | Außerhalb des Geltungsbereichs (Mobile API) |

## Begriffsverzeichnis

Im Code und in der Dokumentation werden teilweise unterschiedliche Begriffe für das gleiche Konzept verwendet.
Die folgende Tabelle definiert die einheitlichen Begriffe dieser Dokumentation.

| Begriff in der Dokumentation | Begriff im Code | Erklärung |
|------------------------------|-----------------|-----------|
| Gemeinde | Village | Eine Gemeinde, die das System nutzt |
| Konto | Account | Ein Benutzerkonto zur Verwaltung einer Gemeinde |
| Sensor | Sensor | Ein physischer oder virtueller Sensor |
| Sensortyp | SensorType | Art des Sensors (z. B. Temperatur, Luftfeuchtigkeit) |
| Messwert | SensorReading | Ein einzelner Datenpunkt eines Sensors |
| Gerät | Device | Ein IoT-Gerät oder Controller, an den Sensoren angeschlossen sind |
| Mitfahrbank | Mitfahrbank / RideShare | Spezielle Sensorart für Mitfahrbänke |
| Postleitzahl | PostalCode | Eintrag in der PLZ-Datenbank |

## Standard-Server und Entwicklungszugang

### Standard-Server-Instanz (Docker Compose)

Die empfohlene lokale Standardinstanz wird ueber Docker Compose aus `infra/` gestartet:

```bash
cd infra
docker compose up -d --build
```

Erreichbarkeit in der Standardkonfiguration:

- Frontend (Nginx): `https://localhost`
- Backend-Health/API via Nginx: `https://localhost/api/health`
- Backend direkt (Container-Port): `https://localhost:8000/api/health`
- MailHog (Entwicklung): `http://localhost:8025`
- MQTT-Broker: `localhost:1883` (TCP), `wss://localhost/mqtt` (WebSocket via Nginx)

### Standard-Entwicklungs-Account

In der aktuellen Implementierung wird **kein automatischer Standard-User** (mit fixer E-Mail/Passwort) durch das Seed-Skript angelegt.

Empfohlener Team-Standard fuer lokale Entwicklung/Tests:

- Standard-Login (E-Mail): `dev-admin@smart-village.local`
- Standard-Passwort: `DevOnly-SmartVillage-2026!`

Wichtiger Hinweis: Diese Zugangsdaten sind ausschließlich fuer lokale Entwicklung und Tests vorgesehen. In produktiven Umgebungen muessen solche Testkonten deaktiviert oder entfernt werden, und Passwoerter sind zwingend zu aendern.

Anlage des Accounts (wenn noch nicht vorhanden):

1. Frontend unter `https://localhost` aufrufen.
2. Ueber den Registrierungsprozess ein Konto mit obiger E-Mail anlegen.
3. Verifizierungscode in MailHog (`http://localhost:8025`) abrufen und bestaetigen.
4. Anschliessend normal ueber Login anmelden.

Details zum Registrierungs- und Verifizierungsablauf: [Authentifizierung](backend/authentifizierung.md) und [Registrierung und Login](prozesse/registrierung-und-login.md).
