# Dokumentation – Smart Village

Diese Dokumentation beschreibt das Smart-Village-Projekt der DHBW Lörrach.
Sie richtet sich an Entwickler, die neu in das Projekt einsteigen oder bestehende Funktionen nachvollziehen möchten.

Alle Dokumente sind in deutscher Sprache verfasst.

## Aktueller Stand (2026-03-15)

Die Dokumentation bildet den folgenden, bereits implementierten Funktionsstand ab:

- Sensorfreigabe fuer App/Public erfolgt ueber `Sensor.exposeToApp` (nicht ueber `isActive`).
- Sensoren werden nach ca. 60 Sekunden ohne neue Messwerte als `dataStale` gekennzeichnet.
- Gemeinde-Status kann als `Village.statusText` persistiert und ueber API/App-API ausgeliefert werden.
- Public-Ansichten verwenden modulbasierte Sichtbarkeit (Feature-Flags), ohne deaktivierte Platzhalter.
- Website und App aktualisieren Nutzdaten einheitlich ueber Polling auf der App-API (`/api/app/...`).
- Kartenfilter im Adminbereich werden pro Nutzer/Gemeinde in der Session persistiert und nicht durch Polling zurueckgesetzt.

## Hinweis zur Mobile API

Die Mobile API (`/mobile-api/`) wird in dieser Dokumentation bewusst nicht behandelt.
Sie wird in naher Zukunft vollständig neu gestaltet. Vorhandener Code und bestehende Dokumente zur Mobile API sind daher als veraltet zu betrachten und hier nicht aufgeführt.

## Dokumentationsstruktur

Die Dokumentation ist in folgende Bereiche aufgeteilt:

```
docs/
├── README.md                              ← Dieses Dokument (Navigation)
├── aenderungen-2026-03-15.md              ← Letzte umgesetzte Änderungen (Snapshot)
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
    └── auto-discovery.md                  ← Ablauf: Automatische Geräteerkennung
```

## Verzeichnis der Dokumente

| Dokument | Beschreibung |
|----------|-------------|
| [Aenderungsprotokoll 2026-03-15](aenderungen-2026-03-15.md) | Kompakte Liste der zuletzt umgesetzten Änderungen über Backend, Frontend, MQTT und Infrastruktur. |
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
| [Frontend-Übersicht](frontend/uebersicht.md) | Aufbau des React-Frontends mit Vite. |
| [Komponentenstruktur](frontend/komponenten.md) | Alle React-Komponenten und ihre Aufgaben. |
| [API-Anbindung](frontend/api-anbindung.md) | API-Client, Hooks und Zustandsverwaltung im Frontend. |
| [API-Endpunkte](api/endpunkte.md) | Vollständige Referenz aller REST-Endpunkte (ohne Mobile API). |
| [Deployment](betrieb/deployment.md) | Anleitung zum Starten und Betreiben des Systems mit Docker. |
| [Sicherheit](betrieb/sicherheit.md) | Sicherheitsmaßnahmen, VPN-Konzept und Produktionshinweise. |
| [Registrierung und Login](prozesse/registrierung-und-login.md) | Ablauf der Benutzerregistrierung und Anmeldung. |
| [Sensor-Datenfluss](prozesse/sensor-datenfluss.md) | Wie Sensordaten in Backend und Clients ueber REST/Polling bereitgestellt werden. |
| [Auto-Discovery](prozesse/auto-discovery.md) | Automatische Erkennung neuer Geräte und Sensoren über MQTT. |

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
