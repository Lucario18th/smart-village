# Änderungsprotokoll (Stand 2026-03-18)

Dieses Dokument erfasst die umgesetzten Sicherheits- und Modernisierungsarbeiten fuer Frontend, Backend und Betrieb.

## Ziel der Aufgabe

- Abhängigkeiten auf einen sehr aktuellen Stand bringen.
- Bekannte Sicherheitsrisiken (inkl. SQL- und Konfigurationsrisiken) reduzieren.
- Gesamtsystem testen (lokal und per Docker Compose).
- Änderungen nachvollziehbar dokumentieren.

## Paket- und Toolchain-Updates

### Backend (NestJS)

- Core-Stack auf Nest 11 aktualisiert:
  - `@nestjs/common` -> `^11.1.17`
  - `@nestjs/core` -> `^11.1.17`
  - `@nestjs/platform-express` -> `^11.1.17`
  - `@nestjs/config` -> `^4.0.3`
  - `@nestjs/cli` -> `^11.0.16`
  - `@nestjs/schematics` -> `^11.0.9`
  - `@nestjs/testing` -> `^11.1.17`
- Security-relevante Libraries aktualisiert:
  - `nodemailer` -> `^8.0.2`
  - `helmet` neu hinzugefuegt
  - `reflect-metadata` -> `^0.2.2`
- Test-/Lint-Stack aktualisiert:
  - `jest` -> `^30.3.0`
  - `@types/jest` -> `^30.0.0`
  - `supertest` -> `^7.2.2`
  - `eslint` -> `^9.39.4`
  - `@typescript-eslint/*` -> `^8.57.1`

### Prisma

- Kurzzeitig auf Prisma 7 getestet, aber wegen Breaking Changes in der Prisma-7-Konfiguration nicht kompatibel mit der bestehenden `schema.prisma`-Architektur.
- Final stabilisiert auf:
  - `prisma` -> `^5.22.0`
  - `@prisma/client` -> `^5.22.0`
- `prisma generate` erfolgreich ausgefuehrt.

### Website (React/Vite)

- `react` -> `^19.2.4`
- `react-dom` -> `^19.2.4`
- `react-leaflet` -> `^5.0.0`
- `vite` -> `^8.0.0`
- `vitest` -> `^4.1.0`
- `msw` -> `^2.12.13`

## Security-Hardening im Code

### SQL/Query-Sicherheit

- Unsichere Raw-SQL-Ausfuehrung entfernt:
  - `SensorReadingService.timeseries` verwendet jetzt `prisma.$queryRaw` (parametrisiert) statt `prisma.$queryRawUnsafe`.
- Bucket-Parameter wird auf eine feste Allowlist normalisiert (`second`, `minute`, `hour`, `day`, `month`, `year`).
- Datumsparameter werden zentral validiert (`BadRequestException` bei ungueltigen Werten).

### API-Input-Hardening

- Strengere Validation-Pipe in `main.ts`:
  - `forbidNonWhitelisted: true`
  - `forbidUnknownValues: true`
- Sensor-Endpoints härten Query-Parameter:
  - `limit` muss positive Ganzzahl sein und wird auf max. 5000 begrenzt.
  - `order` nur `asc|desc`.
  - Pflichtparameter (`from`, `to`, `bucket`) werden validiert.

### Auth/JWT-Sicherheit

- Unsicherer Fallback `"dev-secret"` entfernt.
- Neue zentrale Utility `jwt-secret.util.ts`:
  - Start bricht ab, wenn `JWT_SECRET` fehlt oder ein Platzhalter (`CHANGEME_*`) ist.
- Admin-Login-Hardening umgesetzt:
  - Fehlversuchszähler (`ADMIN_MAX_LOGIN_ATTEMPTS`, Standard 5)
  - Temporäre Sperre nach zu vielen Fehlversuchen (`ADMIN_LOCKOUT_TTL`, Standard 30m)
  - Single-Session fuer Admin-Accounts (parallelle Logins werden blockiert)
  - Session-TTL fuer Admin-Sessions (`ADMIN_SESSION_TTL`, Standard 30m)
  - Neuer Logout-Endpunkt (`POST /api/auth/logout`) zum aktiven Freigeben der Admin-Session

### Frontend-Auth-UX fuer Security-Codes

- Login-UI wertet neue Backend-Codes gezielt aus:
  - `ADMIN_ACCOUNT_LOCKED`
  - `ADMIN_SESSION_ACTIVE`
- Bei beiden Fällen wird eine klare Benutzerhinweismeldung angezeigt statt generischer Fehlertexte.
- Falls `lockedUntil` oder `activeUntil` vom Backend geliefert wird, zeigt die Login-Seite einen Live-Countdown (`mm:ss`) bis zum nächsten Login-Versuch.
- Während der Countdown läuft, ist der Login-Button deaktiviert, um unnötige Wiederholversuche zu vermeiden.
- Logout ruft jetzt serverseitig `POST /api/auth/logout` auf, damit eine aktive Admin-Session konsistent freigegeben wird.

### Admin Simulation Lab (neu)

- Im Admin-Bereich gibt es jetzt ein integriertes Simulations-Labor fuer realistische Testdaten von Gateways und Sensoren.
- Oeffnen auf jeder Admin-Seite möglich:
  - `Strg + Umschalt + S`
  - alternativ `Shift + Alt + Klick` auf den Titel `Smart Village Admin`.
- Funktionsumfang:
  - globale Simulation an/aus,
  - Auto-Runner fuer kontinuierliche Werteerzeugung,
  - Gateways anlegen, bearbeiten, löschen und aktiv/inaktiv schalten,
  - Sensoren anlegen, bearbeiten, löschen und aktiv/inaktiv schalten,
  - Namen, Typen, Koordinaten, Intervalle, Profile und Gateway-Zuordnung frei konfigurierbar,
  - Import aus aktueller Admin-Konfiguration,
  - Testwert-Simulation per Klick.
- Simulationsprofile fuer realistischere Tests:
  - `weather`: tageszeitliche Kurven + moderate Schwankung
  - `steady`: sehr ruhige Werte
  - `spiky`: gelegentliche Ausreisser
  - `random`: stark zufällige Verteilung
- Ausfallmodell integriert:
  - konfigurierbare Ausfall-Chance (%)
  - konfigurierbare Ausfall-Dauer (Sekunden)
  - Sensorstatus zeigt dabei `OFFLINE`.
- MQTT-Integration im Simulations-Labor:
  - automatische MQTT-Verbindung ueber Browser-WebSocket (`/mqtt` via Nginx -> Mosquitto),
  - MQTT-Verbindungsstatus (online/offline) direkt in der Ansicht,
  - Auto-Discovery-Publish auf `sv/{accountId}/{deviceId}/config`,
  - Messwert-Publish auf `sv/{accountId}/{deviceId}/sensors/{sensorId}` bei jedem Simulations-Tick.
- Live-Backend-Bestätigung in der Sensorliste:
  - periodischer API-Check der neuesten DB-Readings (`/api/sensor-readings/:sensorId`),
  - Status pro Sensor (`bestaetigt`, `warte auf Bestaetigung`, `noch keine Daten`, `Fehler`),
  - Anzeige einer gemessenen Publish-zu-DB-Latenz in Millisekunden bei erfolgreichem Match.
- Die Simulationsdaten werden pro Account und Village in `localStorage` persistiert.

### MQTT End-to-End Test (Simulation)

- Neues Testskript: `test-scripts/mqtt-admin-sim-e2e.js`
- Ablauf:
  - Login per Admin-API,
  - Device + Sensor anlegen,
  - MQTT-Publish auf das Backend-Ingestion-Topic,
  - Verifikation via `/api/sensor-readings/:sensorId`.
- Ergebnis bei letzter Ausfuehrung: erfolgreich (`extra.source = mqtt`, Wert korrekt gespeichert).

### Lokaler KI-Assistent (neu)

- Der KI-Widget-Flow wurde auf einen lokalen, kostenlosen LLM-Betrieb umgestellt (Ollama-kompatibel) statt externer Cloud-API.
- Neue Backend-Endpunkte:
  - `POST /api/assistant/public/ask`
  - `POST /api/assistant/admin/ask` (mit `JwtAuthGuard` + `AdminGuard`)
- Strikte Datenregel umgesetzt:
  - Das Modell bekommt nur einen serverseitig bereinigten, whitelisten Kontext aus vorhandenen API-Daten (`contextData`).
  - Keine frei erfundenen Werte erlaubt; fehlt etwas im Kontext, soll die Antwort explizit sagen, dass diese Information aktuell nicht verfuegbar ist.
  - Admin-Kontext darf zusätzliche technische Felder (z. B. Koordinaten/Device-Zuordnung) enthalten, User-Kontext bleibt auf Public-Daten beschränkt.
- User-Kontext enthält jetzt immer die aktiv ausgewählte Sprache (`locale`/`language`), damit Antworten konsistent in der UI-Sprache erfolgen.
- Public-Endpoint härtet diese Regel serverseitig: `POST /api/assistant/public/ask` akzeptiert nur Requests mit gueltigem `contextData.locale` (`de|en|fr`), sonst `400 Bad Request`.
- Neuer Admin-Schalter pro Gemeinde: `KI-Hilfe (User)` in den Modul-Einstellungen.
  - Speichert in `VillageFeatures.enableUserAssistant`.
  - Wenn deaktiviert: User-Widget wird in der Public-UI nicht angezeigt und `POST /api/assistant/public/ask` liefert `403 Forbidden`.
- Frontend-Widget nutzt jetzt die lokalen Assistant-Endpunkte und fällt bei Offline-Lokalmodell auf lokale Kontextanalyse mit Hinweistext zurueck.
- Neue Backend-Umgebungsvariablen:
  - `LOCAL_LLM_ENABLED` (default: `true`)
  - `LOCAL_LLM_BASE_URL` (default: `http://ollama:11434`)
  - `LOCAL_LLM_MODEL` (default: `llama3.2:1b`)
  - `LOCAL_LLM_TIMEOUT_MS` (default: `12000`)
- Betrieb jetzt direkt im Docker-Stack möglich:
  - Neuer Service `smartvillage-ollama` in `infra/docker-compose.yml`.
  - Modell-Pull einmalig per `docker exec smartvillage-ollama ollama pull llama3.2:1b`.
- Stabilitäts-Fallback:
  - Wenn das LLM nicht erreichbar ist, liefert der Backend-Assistant automatisch eine einfache regelbasierte Antwort aus dem vorhandenen API-Kontext statt eines Hard-Errors.

### Startseite: Projekt-Carousel (neu)

- Auf der Landingpage wurde ein vollständiges Projekt-Carousel integriert.
- Inhalt:
  - vier Slides fuer reale Projektbereiche (Sensor-Setup, Admin-Workflow, MQTT-Datenfluss, Community-Vorfuehrung),
  - Titel, Kategorie, Beschreibung und Schrittliste pro Slide,
  - Navigation mit Vor/Zurueck-Buttons und Dots,
  - Auto-Rotation (mit Respekt fuer `prefers-reduced-motion`),
  - responsive Layout fuer Desktop und Mobile.
- Bilder liegen unter `website/public/project-gallery/*.svg` und können jederzeit durch echte Projektfotos ersetzt werden (gleiche Dateinamen behalten oder in `LandingPage.jsx` anpassen).

#### E2E-Abhakcheck: Admin schaltet User-KI aus/an

1. **Ausgangslage vorbereiten**
  - Als Admin anmelden.
  - In den Admin-Bereich wechseln: `Module` -> Schalter `KI-Hilfe (User)` auf **AN** setzen und speichern.
2. **User-UI bei AN pruefen**
  - User-Seite öffnen.
  - Erwartung: KI-Launcher ist sichtbar.
3. **Public-API bei AN pruefen**
  - `POST /api/assistant/public/ask` mit gueltigem `contextData` (`locale`, `villageId`) senden.
  - Erwartung: `200 OK` mit Antworttext.
4. **Feature AUS schalten**
  - Zurueck in Admin: `KI-Hilfe (User)` auf **AUS** setzen und speichern.
5. **User-UI bei AUS pruefen**
  - User-Seite neu laden.
  - Erwartung: KI-Launcher wird nicht gerendert.
6. **Public-API bei AUS pruefen**
  - Erneut `POST /api/assistant/public/ask` mit gleicher `villageId` senden.
  - Erwartung: `403 Forbidden` (`User assistant is disabled by village admin`).
7. **Regression Sprachkontext pruefen**
  - Bei aktivierter User-KI (`AN`) Anfragen mit `locale=de|en|fr` senden.
  - Erwartung: Antworten folgen der ausgewählten Sprache; fehlendes/ungueltiges `locale` ergibt `400 Bad Request`.

### Sicherheitsvorfall-Logging

- Neue Audit-Tabelle `SecurityIncident` in der DB.
- Erfasste Ereignisse inkl. Zeitstempel, E-Mail, IP, User-Agent, Erfolg/Fehler und Grund:
  - `LOGIN_SUCCESS`
  - `LOGIN_FAILED`
  - `LOGIN_BLOCKED`
  - `ADMIN_SESSION_BLOCKED`
  - `SESSION_REJECTED`
  - `LOGOUT`
- Laufzeitverifikation zeigt die protokollierten Vorfälle mit IP/User-Agent fuer nachträgliche Sicherheitsanalyse.

### Incident-Retention (Betrieb)

- Neues Wartungsskript fuer Audit-Tabellenwachstum:
  - `backend/scripts/security-incident-retention.js`
- Dry-Run (Standard):
  - `npm run security:incidents:prune`
- Effektive Löschung:
  - `npm run security:incidents:prune -- 90 --apply`
- Retention-Tage sind konfigurierbar:
  - CLI-Parameter (z. B. `90`) oder Env `SECURITY_INCIDENT_RETENTION_DAYS`.

### HTTP/Transport-Sicherheit

- Backend setzt jetzt `helmet()` fuer Sicherheitsheader.
- CORS wurde von `origin: true` auf explizite Origin-Liste umgestellt (aus `FRONTEND_URL`, fallback localhost).
- Nginx bekam zusätzliche Header:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security` (HSTS)

### Geheimnisse/Config

- In `infra/smartvillage.env` wurden harte API-Credentials fuer DB Timetables durch Platzhalter ersetzt:
  - `DB_CLIENT_ID=CHANGEME_DB_CLIENT_ID`
  - `DB_CLIENT_SECRET=CHANGEME_DB_CLIENT_SECRET`

## Container-/Build-Hardening

- Backend-Dockerfile:
  - Build- und Runtime-Install auf `npm ci` umgestellt.
  - Runtime mit `npm ci --omit=dev`.
  - Runtime jetzt als Nicht-Root-User (`USER node`).

## DDoS-Schutz und Lastverhalten

### Neue Schutzmassnahmen am Edge (Nginx)

- Rate-Limiting pro Client-IP:
  - Allgemeine API: `300 req/s` mit `burst=600`
  - Login: `10 req/s` mit `burst=20`
- Verbindungs-Limits pro Client-IP:
  - API: max. 100 parallele Verbindungen
  - Login: max. 20 parallele Verbindungen
  - MQTT-WebSocket: max. 20 parallele Verbindungen
- Harte Limit-Antworten als `429` statt unkontrollierter Backend-Überlastung.
- Proxy-Timeouts gesetzt (`connect/send/read`) fuer schnellere Entlastung bei problematischen Upstreams.

### Mega Smoke/Load Test (gestuft)

- Neues Lasttest-Skript: `test-scripts/mega-smoke-load-test.js`
- Testet vier kritische Lastpfade in Stufenlast:
  - Read: `/api/health` ueber Nginx
  - Read: `/api/app/villages` ueber Nginx
  - Auth-Flood-Simulation: `/api/auth/login` ueber Nginx
  - DB-Write-Pfad: `/api/sensor-readings/:sensorId` (authentifiziert)
- Gemessene Kennzahlen je Stufe:
  - Requests/s (RPS)
  - Fehlerquote
  - P50/P95/P99-Latenz
  - HTTP-Statusverteilung
  - Breakpoint (ab wann degradiert)

### Messreihen und Reports

- Vor Hardening:
  - `test-scripts/reports/mega-smoke-load-2026-03-18T11-20-51-990Z.md`
- Nach initial sehr striktem Hardening:
  - `test-scripts/reports/mega-smoke-load-2026-03-18T11-25-20-964Z.md`
- Nach finalem Tuning (balancierter Schutz):
  - `test-scripts/reports/mega-smoke-load-2026-03-18T11-28-35-928Z.md`
- Langer Mixed-Soak (15 Minuten, Dauerlast):
  - `test-scripts/reports/soak-mixed-2026-03-18T11-49-13-604Z.md`

### Kernerkenntnisse (kurz)

- Vor Hardening war ein technischer Bruch bei sehr hoher Last sichtbar (`502` bei `/api/health` auf hoher Concurrency), d. h. Backend/Proxy liefen in Überlast statt sauberem Backpressure.
- Nach Hardening reagiert das System unter Flood mit kontrollierten `429` (Rate-Limit), während der Backend-Write-Pfad stabil blieb (keine 5xx im Write-Test).
- DB-Write-Pfad zeigte auch unter hoher Last weiterhin sehr gute Latenzen (P95 deutlich unter 100 ms in den getesteten Stufen).

### Soak-Test (900s) - Detailauswertung

- Testprofil: 35 Worker, gemischter Traffic (Health, App-API, Mobile-API, Login, Auth-Me, Sensor-Reads, Sensor-Writes).
- Gesamt:
  - 166.645 Requests in 900s
  - 185,2 req/s im Mittel
  - 0x HTTP 5xx
  - 9.908x HTTP 429 (gezielte Throttling-Antworten)
- Latenzen gesamt:
  - p50: 134,1 ms
  - p95: 722,1 ms
  - p99: 1310,5 ms
- Fehlerquote gesamt: 5,95%
  - Ursache nahezu ausschliesslich Login-Rate-Limit (`/api/auth/login`), nicht Backend-Instabilität.

Route-Sicht (aus dem Soak-Report):

- `health`, `app-villages`, `mobile-villages`, `auth-me`, `sensor-list`, `sensor-write`:
  - jeweils 0,00% Fehler
  - keine 5xx
- `auth-login`:
  - 60,02% Fehlerquote, aber ausschliesslich als kontrollierte `429`
  - Zielerfuellung: brute-force/flood wird aktiv ausgebremst.

### DB-Delta während Soak

Aus `pg_stat_database` (vorher/nachher):

- `xact_commit`: +282.394
- `xact_rollback`: +0
- `blks_read`: +105
- `blks_hit`: +80.322.022
- `tup_returned`: +111.954.542
- `tup_fetched`: +102.850.076
- `tup_inserted`: +11.761
- `tup_updated`: +120
- `tup_deleted`: +11.761

Interpretation:

- Hohe Puffer-Trefferquote (`blks_hit` sehr hoch, `blks_read` gering) zeigt, dass die DB primär aus Cache bediente.
- Keine Rollbacks und keine 5xx deuten auf stabile Transaktionsverarbeitung unter Dauerlast.

### Kapazitätseinschätzung (aktueller Stand)

- Fuer normale Nutzerlast (ohne Login-Flood) ist der Stack in den Tests stabil und performant.
- Das aktuell limitierende Element unter extremer Ein-Quell-Last ist bewusst das Edge-Throttling auf Login.
- Praktische Empfehlung fuer die Studienarbeit:
  - Produktionsnahe Aussage: "Mehrere hundert Requests/s bei stabilen API-Pfaden ohne 5xx, mit kontrolliertem Backpressure via 429 auf sensitiven Endpunkten."
  - Gleichzeitige aktive Nutzer (grobe Daumenregel bei Polling-/API-Mix): ca. 150-300 aktive Sessions auf einem vergleichbaren Hostprofil, bevor p95 fuer read-lastige Pfade in den deutlich höheren dreistelligen ms-Bereich wandert.
  - Login-heavy Peaks werden frueh limitiert (sicherheitsseitig gewollt).

### Ressourcen- und DB-Snapshot nach Lastlauf

- `docker stats --no-stream` nach Lasttest:
  - Backend ca. 54 MiB RAM
  - Nginx ca. 20 MiB RAM
  - Postgres ca. 199 MiB RAM
- PostgreSQL Aktivitätszähler (`pg_stat_database`) zeigen hohe Commit-Last ohne Rollbacks während der Testreihen.

### Interpretation fuer Produktivbetrieb

- Ergebnis: Das System ist fuer normale Last robust und unter Flood deutlich besser abgesichert als zuvor.
- Wichtig: Die Limits sind bewusst IP-basiert. Lasttests von einer einzelnen Maschine erzeugen frueh `429` by design. Das ist bei DDoS-Abwehr gewollt, kann aber bei legitimer Single-IP-Stresslast ebenfalls greifen.
- Fuer echten Internetbetrieb empfohlen:
  - vorgeschaltetes CDN/WAF mit Bot-/DDoS-Schutz,
  - getrennte Limits fuer Healthchecks/Monitoring,
  - mehrstufige Limits (global + pro Route + pro Account),
  - optional Redis-basiertes App-Layer-Throttling im Backend fuer verteilte Angriffe.

## Testergebnisse

### Lokal

- Backend Build: erfolgreich.
- Backend Tests: `19/19` Test-Suites erfolgreich (`110/110` Tests).
- Website Build: erfolgreich (Hinweis auf grosse Chunk-Grösse, kein Fehler).
- Website Tests: `2/2` Testfiles erfolgreich (`7/7` Tests).

### Vollständiger Smoke-Test (Containerlaufzeit)

- Docker-Stack stabil während und nach den Smokes:
  - `smartvillage-postgres` healthy
  - `smartvillage-backend` healthy
  - `smartvillage-nginx` healthy
  - `smartvillage-mailhog` up
  - `smartvillage-mosquitto` up
- Positiv-Smokes erfolgreich:
  - `GET https://localhost/` -> `200`
  - `GET https://localhost/api/health` -> `200`
  - `GET http://localhost:8000/api/health` -> `200`
  - Auth-Flow mit Seed-User (`freiburg@smart-village.local`) erfolgreich: Login, `/api/auth/me`, Sensor erstellen, Messwerte schreiben/lesen, Sensor löschen
  - App-API erfolgreich: `/api/app/villages`, `/api/app/villages/:id/config`, `/api/app/villages/:id/initial-data`
  - Mobile-API erfolgreich: `/api/mobile-api/villages`, Detail, Sensoren, Messages, Rideshares, Message-Create
- Negativ-Smokes erfolgreich abgefangen:
  - Ungueltiger Bucket bei Timeseries -> `400`
  - Ungueltiges `limit` (< 1) -> `400`
  - Zugriff auf geschuetzten Endpoint ohne Token (`/api/auth/me`) -> `401`
  - Unbekannte Route -> `404`
- Log-Pruefung nach Last/Smokes: keine Backend-Exceptions, keine Nginx-Error-Signaturen.

### Korrigierte Smoke-Test-Werkzeuge

- `test-scripts/e2e-test.js` auf aktuelle Defaults gebracht:
  - Default-HTTPS ueber Nginx (`https://localhost`) statt `https://localhost:8000`
  - Seed-User als Default (`freiburg@smart-village.local`)
  - Optional ueber `API_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` uebersteuerbar
- `test-scripts/mobile-api-test.js` auf aktuellen Prefix gebracht:
  - `/api/mobile-api` statt veraltetem `/mobile-api`
  - Default-HTTPS ueber `https://localhost`

### Security Scans

- Website: `npm audit` ohne offene Findings.
- Backend: verbleibend `6 moderate` Findings aus CLI/Schematics-Transitivabhhängigkeiten (`@nestjs/cli` / Angular Devkit). Keine High/Critical Findings mehr.

## Docker Compose Status

- Nach Start von Docker Desktop wurde der Endtest erfolgreich ausgefuehrt.
- `docker compose up -d --build` läuft sauber durch.
- Alle Services sind danach `healthy`/`up`:
  - `smartvillage-postgres` healthy
  - `smartvillage-backend` healthy
  - `smartvillage-nginx` healthy
  - `smartvillage-mailhog` up
  - `smartvillage-mosquitto` up
- Smokes:
  - `https://localhost/` -> `200 OK`
  - `https://localhost/api/health` -> `200 OK`
  - `http://localhost:8000/api/health` -> `200 OK`

### Hinweis zur lokalen Env

- Fuer den geharteten JWT-Check wurde ein nicht-platzhalterhaftes `JWT_SECRET` gesetzt.
- Das bestehende Postgres-Passwort wurde beibehalten, um mit dem bereits initialisierten Docker-Volume kompatibel zu bleiben.

## Betroffene Dateien (Auszug)

- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/main.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/auth/jwt-secret.util.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260318132000_add_auth_security_controls/migration.sql`
- `backend/scripts/auth-security-check.js`
- `backend/scripts/security-incident-retention.js`
- `backend/src/sensor/sensor-reading.service.ts`
- `backend/src/sensor/sensor-reading.controller.ts`
- `backend/Dockerfile`
- `infra/nginx/default.conf`
- `infra/smartvillage.env`
- `website/package.json`
- `website/package-lock.json`
- `website/src/api/client.js`
- `website/src/auth/session.js`
- `website/src/hooks/useAdminAuth.js`
- `website/src/components/LoginView.jsx`
- `website/src/components/AdminView.jsx`
- `website/src/components/admin/AdminSimulationLab.jsx`
- `website/src/styles.css`
- `website/src/utils/mapViewUtils.test.js`
- `test-scripts/mqtt-admin-sim-e2e.js`