# Smart Village API - Kurzreferenz (Stand 2026-03-17)

Dieses Dokument ist die kompakte API-Einstiegsseite.

Verbindliche Detailreferenzen:
- Vollstaendige Endpunktliste: `doku-Neu/api/endpunkte.md`
- App-API (Website + App): `doku-Neu/backend/app-api.md`

## Basis und Routing

- Direkter Backend-Zugriff: `https://localhost:8000`
- Ueber Nginx (empfohlen im Compose-Setup): `https://localhost`
- API-Prefix: `/api`
- App-API-Prefix: `/api/app`

## Aktuell relevante API-Bereiche

1. Admin-/Konfigurations-API (`/api/...`)
- Authentifizierung (`/api/auth/...`)
- Villages (`/api/villages/...`)
- Sensoren (`/api/sensors/...`)
- SensorReadings (`/api/sensor-readings/...`)
- Devices (`/api/devices/...`)
- Locations (`/api/locations/...`)
- Admin (`/api/admin/...`)

2. Public App-API (`/api/app/...`)
- `GET /api/app/villages`
- `GET /api/app/villages/:villageId/config`
- `GET /api/app/villages/:villageId/initial-data`
- `GET /api/app/villages/:villageId/modules`

## Wer nutzt welche Endpunkte?

1. Website Public-User (`/user`)
- Nutzt die App-API-Endpunkte unter `/api/app/...`
- Polling fuer Public-Daten standardmaessig alle 5 Sekunden

2. Mobile App
- Nutzt dieselben Kernendpunkte unter `/api/app/...`
- App-URL ist aktuell im Code konfiguriert in:
  - `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/model/constants/Url.kt`

3. Website Admin (`/admin`)
- Nutzt geschuetzte Endpunkte unter `/api/...` mit JWT

## Wichtiger Hinweis zur Mobile API

Die alte Mobile API unter `/mobile-api/` ist bewusst nicht Bestandteil dieser Doku, da sie kuenftig neu gestaltet wird.

## Letzte fachliche Aenderungen

Siehe `doku-Neu/aenderungen-2026-03-17.md`.
