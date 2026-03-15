# Aenderungsprotokoll (Stand 2026-03-15)

Dieses Dokument erfasst die zuletzt umgesetzten Aenderungen kompakt und nachvollziehbar.

## Datenmodell und Backend

- `Village.statusText` als persistentes Feld eingefuehrt.
- Migration hinzugefuegt: `add_village_status_text`.
- `PUT /api/villages/:villageId` erweitert, sodass `statusText` gespeichert werden kann.
- App-API erweitert, sodass `statusText` und `infoText` in der Village-Konfiguration mit ausgeliefert werden.

## Sensor-Semantik und Sichtbarkeit

- Sensorfreigabe fuer App/Public auf `exposeToApp` ausgerichtet.
- Trennung der Sensor-Flags klar umgesetzt:
  - `isActive` fuer technischen Aktivstatus,
  - `receiveData` fuer Datenerfassung,
  - `exposeToApp` fuer Sichtbarkeit in App/Public.
- Sensorlisten liefern `dataStale`, wenn seit ca. 60 Sekunden kein neuer Messwert eingegangen ist.

## MQTT und Realtime

- Mosquitto um WebSocket-Listener erweitert (Port 9001).
- Nginx-WebSocket-Proxy fuer `/mqtt` ergänzt.
- Public-Frontend konsumiert MQTT-Livewerte direkt im Browser und merged diese mit REST-Daten.

## Frontend-Verhalten

- Public-Tabs werden dynamisch aus Village-Feature-Flags erzeugt.
- Deaktivierte Module werden im Public-Bereich nicht als Platzhalter angezeigt.
- Letzte Village-Auswahl im Public-Bereich wird im Browser gespeichert.
- Admin-Kartenfilter werden pro Nutzer/Gemeinde in der Session persistiert.
- Polling ueberschreibt Kartenfilter nicht mehr unbeabsichtigt.

## UI-Anpassungen

- User-Settings visuell an den Admin-Stil angepasst.
- Header im Public-Bereich auf "Smart Village User" vereinheitlicht.
- Village-Info und -Status kompakt im Header-Bereich platziert.
- Village-Auswahl in den Sidebar-Aktionsbereich verschoben.

## Betrieb und Stabilitaet

- Build-Probleme mit OneDrive-Reparse-Point-Dateien im Frontend behoben.
- WSL-Docker-Credential-Helper-Konflikt bereinigt.

## Dokumentationsabgleich

Folgende Dokumente wurden auf den aktuellen Stand gebracht:

- `doku-Neu/README.md`
- `doku-Neu/uebersicht.md`
- `doku-Neu/api/endpunkte.md`
- `doku-Neu/backend/sensoren.md`
- `doku-Neu/backend/mqtt-integration.md`
- `doku-Neu/backend/app-api.md`
- `doku-Neu/backend/gemeinden.md`
- `doku-Neu/frontend/uebersicht.md`
- `doku-Neu/frontend/api-anbindung.md`
- `doku-Neu/API.md`
