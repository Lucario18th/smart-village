# KI-Nutzung im Smart-Village-Projekt

*Studienarbeit · DHBW Lörrach · TIF 23 · Semester 5 & 6*

---

## Überblick

Im Laufe des Projekts haben wir GitHub Copilot — sowohl im klassischen Modus (Autocomplete / Chat) als auch im **Agent Mode** — intensiv als Entwicklungswerkzeug eingesetzt. Dieses Dokument beschreibt, wofür KI verwendet wurde, welche Erkenntnisse wir gewonnen haben und wo Grenzen oder Probleme aufgetreten sind.

---

## Eingesetzte Werkzeuge

| Werkzeug | Einsatzbereiche |
|----------|----------------|
| **GitHub Copilot (Autocomplete)** | Code-Vervollständigung im Editor (VS Code, IntelliJ) |
| **GitHub Copilot Chat** | Erklärungen, Refactoring-Vorschläge, Fehleranalyse |
| **GitHub Copilot Agent Mode** | Größere, mehrstufige Aufgaben: Tests generieren, Dokumentation schreiben, Refactoring über mehrere Dateien |

---

## Konkrete Einsatzbereiche

### Backend (NestJS / Prisma)

- Generierung von Boilerplate-Code für NestJS-Module, Controller und Services
- Vorschläge für Prisma-Schema-Definitionen und Datenbankmigrationen
- Unterstützung beim Schreiben von Unit- und Integrationstests (Jest)
- Fehleranalyse bei MQTT-Integrationsproblemen

### Frontend (React / Vite)

- Unterstützung beim Aufbau von React-Komponenten und Hooks
- Vorschläge für Leaflet/OpenStreetMap-Integration und Marker-Logik (`mapViewUtils`)
- Generierung von Frontend-Tests (Vitest)
- CSS-Hilfe für das Admin-Dashboard und die öffentliche Website

### Mobile App (Android / Kotlin)

- Code-Vervollständigung für Kotlin-spezifische Muster (Coroutines, ViewModel, Compose)
- Vorschläge für API-Aufrufe und Fehlerbehandlung

### IoT / Raspberry Pi (Python)

- Unterstützung beim Schreiben der MQTT-Publisher-Skripte für BMP280- und YL-69-Sensoren
- Vorschläge für Fehlerbehandlung und Reconnect-Logik

### Tests & Smoke-Tests

- KI-gestützte Generierung der Docker-basierten Smoke-Tests
- Vorschläge für Teststrukturen in `test-scripts/`

### Dokumentation

- Unterstützung beim Verfassen und Strukturieren technischer Dokumentation (Markdown)
- Einsatz von GitHub Copilot Agent Mode für umfangreichere Umschreibungen und Neustrukturierungen von Dokumenten

---

## Erkenntnisse

- **Positiv:** GitHub Copilot hat die Entwicklungsgeschwindigkeit deutlich erhöht, insbesondere bei wiederkehrenden Mustern (CRUD-Endpunkte, Test-Boilerplate, Prisma-Schemas).
- **Positiv:** Agent Mode eignet sich gut für größere, strukturierte Aufgaben — z. B. das gleichzeitige Refactoring mehrerer Dateien oder das Generieren von Tests für ein gesamtes Modul.
- **Einschränkung:** Bei sehr projektspezifischen Themen (z. B. DHBW-interne Infrastruktur, spezifische MQTT-Topic-Struktur) waren die Vorschläge häufig zu allgemein und mussten manuell angepasst werden.
- **Einschränkung:** KI-generierter Code wurde stets kritisch geprüft — insbesondere bei sicherheitsrelevanten Bereichen (Authentifizierung, JWT, Nginx-Konfiguration). Kein KI-generierter Code wurde ungeprüft übernommen.
- **Einschränkung:** Bei komplexen domänenspezifischen Fragen (z. B. LoRaWAN-Protokolldetails, TimescaleDB-Optimierungen) war manuelles Recherchieren unumgänglich.

---

## Probleme & Grenzen

- **Halluzinierungen:** In einigen Fällen schlug Copilot Libraries oder API-Methoden vor, die nicht existieren oder in der verwendeten Version nicht verfügbar waren. Gegenmaßnahme: stets Dokumentation und Tests prüfen.
- **Kontextgrenzen:** Bei sehr großen Codebasen verlor der Agent Mode gelegentlich den Überblick über projektweite Abhängigkeiten. Gegenmaßnahme: Aufgaben in kleinere, klar abgegrenzte Schritte aufteilen.
- **Datenbankmigrationen:** KI-generierte Prisma-Migrationsskripte führten vereinzelt zu Konflikten. Die Datenbankmigration war im Projektverlauf insgesamt eine der häufigsten Fehlerquellen.

---

## Fazit

GitHub Copilot hat sich als nützliches Werkzeug erwiesen, das die Produktivität steigert — insbesondere für Boilerplate-Code, Tests und Dokumentation. Es ersetzt jedoch nicht das eigenständige Verständnis des Systems. Alle KI-generierten Beiträge wurden vom Team geprüft, angepasst und verantwortet. Der Einsatz von KI im Projekt entspricht den Richtlinien der DHBW Lörrach für die Nutzung von KI-Assistenten in Studienarbeiten.
