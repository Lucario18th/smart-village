# Aenderungsprotokoll (Stand 2026-03-24)

## Ziel

Erstellung einer zentralen, selbsterklaerenden Projektdokumentation unter `docs/`, die als Markdown und als PDF-Exportgrundlage geeignet ist.

## Neu erstellt

- `docs/PROJEKT-DOKUMENTATION.md`
  - Vollstaendiges 4MAT-Modell (Warum, Was, Wie, Was-wenn)
  - Designentscheidungen mit Technologievergleichen
  - Endnutzer-Anleitung zur Einbindung von Sensoren/Geraeten
  - Sensortypen-Tabelle, Troubleshooting und Codebeispiele (Python + JavaScript)
  - Weiterfuehrende Links auf Detaildokumente

- `docs/README.md`
  - Prominenter Link auf die zentrale Projektdokumentation am Dokumentanfang
  - Einordnung zur bestehenden Detaildokumentation unter `doku-Neu/`

- `docs/aenderungen-2026-03-24.md`
  - Dieses Aenderungsprotokoll

## Verwendete Quellen fuer die Konsolidierung

- Detaildokumentation in `doku-Neu/` (Architektur, Backend, Frontend, Betrieb, Prozesse, API)
- Aenderungsprotokolle `doku-Neu/aenderungen-*.md`
- Code- und Konfigurationsquellen:
  - `backend/package.json`
  - `website/package.json`
  - `infra/docker-compose.yml`
  - `infra/nginx/default.conf`
  - `backend/prisma/schema.prisma`
  - `Raspberry PI/Code/*` und `Raspberry PI/Doku/Derzeitiger_Stand.md`

## Qualitaet

- Konsistente Begriffe entlang der bestehenden Projektterminologie
- Markdown-Struktur fuer gute Lesbarkeit und PDF-Export geeignet
- Relative Verlinkung auf bestehende Detailquellen
