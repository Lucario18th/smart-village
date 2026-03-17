# Aenderungsprotokoll (Stand 2026-03-17)

Dieses Dokument erfasst die zuletzt umgesetzten Aenderungen kompakt und nachvollziehbar.

## Backend und Betrieb

- Docker-Compose-Start stabilisiert: `docker compose up -d --build` laeuft wieder sauber durch.
- Ursache waren fehlgeschlagene Prisma-Migrationen mit doppelten Spalten auf `VillageModule`.
- Migrationen wurden idempotent gemacht:
  - `20260317112000_add_icon_key_to_village_module`
  - `20260317123000_add_module_type_to_village_module`
- In betroffenen Umgebungen wurde der fehlerhafte Migrationsstatus mit `prisma migrate resolve --rolled-back ...` korrigiert.

## Routing und Seitenstruktur (Website)

- Neue oeffentliche Startseite als Landingpage unter `/` eingefuehrt.
- Public-User-Dashboard liegt nun unter `/user`.
- Village-Detailroute `/village/:villageId` bleibt aktiv.
- Admin-Bereich bleibt unter `/admin/*`.

## Navigation und UX

- Wechselseitige Navigation zwischen allen Hauptebenen ergaenzt:
  - Landingpage -> User/Admin
  - User -> Landingpage/Admin
  - Admin -> Landingpage/User
  - Login -> Landingpage
- Landingpage inhaltlich erweitert:
  - Projektbeschreibung
  - Team-Bereich mit Bildplaetzen
  - Rechts-/Kontaktbereich (Datenschutz, AGB, Cookies, Impressum, Social, E-Mail)
  - Repo-Link

## Inhalte und Projektidentitaet

- Teamdaten auf Landingpage gepflegt:
  - Leon Kühn
  - Nico Röcker
  - Manuel Keßler
  - Alexander Shimaylo
- Betreuender Dozent ergaenzt: Herr Schenk.
- GitHub-Repository als Standardlink gesetzt: https://github.com/Lucario18th/smart-village

## App-Download auf der Website

- Android-Download-Button auf der Landingpage eingefuehrt.
- Link ist konfigurierbar ueber `VITE_ANDROID_APP_URL`.
- Fallback zeigt auf Play Store mit App-ID `de.tif23.studienarbeit`.

## Theme und Sprache

- Darkmode als Standard umgesetzt:
  - Initialklasse in `main.jsx`
  - Fallbacks in `themeManager.js`
  - Default-Designwerte in `configModel.js`
  - Public-Default-Prefs in `PublicDashboardView.jsx`
- Mehrsprachige Texte (Deutsch/Franzoesisch) sprachlich bereinigt:
  - Umlaute und Akzente korrigiert
  - konsistente Schreibweisen in Public-Dashboard, Map und KI-Widget

## API-Nutzung (Website und App)

- Website Public-Ansicht nutzt die App-API unter `/api/app/...`.
- Kernendpunkte fuer User-Website und App:
  - `GET /api/app/villages`
  - `GET /api/app/villages/:villageId/config`
  - `GET /api/app/villages/:villageId/initial-data`
- Optional vorhanden (derzeit nicht zentral im Public-Flow genutzt):
  - `GET /api/app/villages/:villageId/modules`
- Public-Website aktualisiert Daten ueber Polling (Standard: 5 Sekunden).

## Dokumentationsabgleich

Folgende Dokumente wurden auf den neuen Stand gezogen:

- `doku-Neu/README.md`
- `doku-Neu/aenderungen-2026-03-17.md`
- `doku-Neu/API.md`
- `doku-Neu/uebersicht.md`
- `doku-Neu/backend/app-api.md`
- `doku-Neu/frontend/uebersicht.md`
- `doku-Neu/frontend/api-anbindung.md`
- `doku-Neu/api/endpunkte.md`
