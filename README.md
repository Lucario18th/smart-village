# Smart Village

Dies ist eine Studienarbeit der DHBW Lörrach (Kurs **TIF 23**, Semester **5 & 6**). Das Projekt bildet eine integrierte Smart-Village-Plattform mit Backend, Web-Frontend, Android-App, Desktop-Client und IoT-Anbindung.

## Projektkontext (fixe Fakten)

### Team

| Name | Rolle | Verantwortlichkeiten |
|---|---|---|
| Leon Kühn | Project Lead | Backend (NestJS), MQTT integration, infrastructure, Docker Compose, many core features |
| Manuel Keßler | Developer | Android mobile app (Kotlin), app-facing features |
| Alexander Shimaylo | Developer | IoT / Raspberry Pi integration, sensor topics, documentation |
| Nico Röcker | Developer | UI design, public website |

### Betreuung & Kontakte

- Supervising professor: Herr Schenk, DHBW Lörrach
- Server provided by: Herr Dittrich — he is the new head of studies (Studiengangsleiter) for Computer Science at DHBW Lörrach. For any questions about the server or server infrastructure, contact Herr Dittrich.

### Systemzugänge

- Production (DHBW network only): https://192.168.23.113 (HTTPS, port 443)
- Local after setup: https://localhost

## App (Android/Kotlin) im Überblick

Der App-Teil ist als Compose Multiplatform / Kotlin Multiplatform umgesetzt (`app/SmartVillageApp`).

Die detaillierte App-Dokumentation (Architektur, Datenfluss, Schnittstellen, Build/Run, Qualität und Semester-5-PDF-Bezug) liegt in:

- **[`docs/README.md`](docs/README.md)**

## Dokumentationsstruktur

Dieses `README.md` ist der Einstieg. Die technische Detailtiefe liegt in den Dokumenten unter `docs/`.

- [`docs/README.md`](docs/README.md) – App-zentrierte technische Dokumentation (aktueller Fokus)
- [`docs/PROJEKT-DOKUMENTATION.md`](docs/PROJEKT-DOKUMENTATION.md) – bestehendes Hauptdokument (unverändert)
- [`docs/KI-NUTZUNG.md`](docs/KI-NUTZUNG.md) – Transparenz zur KI-gestützten Dokumentation
- [`doku-Neu/abgage 5 semster/Entwicklungskonzepte für die App.pdf`](doku-Neu/abgage%205%20semster/Entwicklungskonzepte%20für%20die%20App.pdf) – konzeptionelle Referenz aus Semester 5

## Gesamtplattform (Technologieüberblick)

- Backend: NestJS, Prisma ORM, PostgreSQL + TimescaleDB, Mosquitto MQTT broker
- Frontend: React + Vite, Leaflet / OpenStreetMap, Custom CSS
- Mobile App: Android / Kotlin (release v1.0.1)
- Desktop client: C# WPF (SmartVillageWPF)
- IoT hardware: Raspberry Pi with BMP280 (pressure/temperature) and YL-69 (soil moisture), Python MQTT publisher scripts
- Infrastructure: Docker Compose, Nginx (reverse proxy, TLS termination, security headers), MailHog
- Tests: Docker-based smoke tests, frontend tests, test-scripts/
- Simulations: simulations/mqtt-freiburg/
