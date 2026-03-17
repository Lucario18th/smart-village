# App-API – Architektur und Integration

## Zweck dieses Dokuments

Dieses Dokument beschreibt die neue App-API-Schicht des Smart-Village-Backends.
Die App-API stellt REST-Endpunkte bereit, ueber die mobile App und Website Daten empfangen.
Sie ist unabhängig von der bestehenden Mobile API (`/mobile-api/`) und ersetzt diese nicht.

## Architekturübersicht

Mobile App und Website kommunizieren mit dem Backend ueber die REST-App-API und aktualisieren Daten in festen Polling-Intervallen.

Wichtige Pfadkonvention:
- Im Backend ist der Controller unter `@Controller('app')` registriert.
- Extern sind die Endpunkte ueber den API-Prefix erreichbar: `/api/app/...`.

Wichtig: Die App-API liefert nur Gemeinden, deren Account die Freigabe `isPublicAppApiEnabled = true` gesetzt hat.
Private oder nicht freigegebene Accounts tauchen in `/api/app/villages` nicht auf und ihre Dorf-Endpunkte liefern `404`.

Der typische Ablauf ist:

1. Die App startet und ruft `GET /api/app/villages` auf, um die Liste der verfügbaren Gemeinden zu laden.
2. Der Nutzer wählt eine Gemeinde.
3. Die App ruft `GET /api/app/villages/:villageId/config` auf, um die Feature-Flags und die Liste der freigegebenen Sensoren zu erhalten.
4. Die App ruft `GET /api/app/villages/:villageId/initial-data` auf, um sofort Daten anzuzeigen.
5. App und Website rufen die App-API periodisch erneut auf (Polling), um aktualisierte Werte zu laden.

```
┌────────────┐       REST (HTTP)        ┌─────────────┐
│            │ ──────────────────────▶   │             │
│  Mobile    │                           │   Backend   │
│  App       │ ◀──────────────────────   │  (NestJS)   │
│            │                           │             │
└────────────┘                           └─────────────┘

┌────────────┐       REST (HTTP)        ┌─────────────┐
│            │ ──────────────────────▶   │             │
│  Website   │                           │   Backend   │
│  Public    │ ◀──────────────────────   │  (NestJS)   │
│            │                           │             │
└────────────┘                           └─────────────┘
```

## Warum Feature-Flags pro Gemeinde?

Das Smart-Village-System wird von mehreren Gemeinden genutzt (Multi-Tenancy).
Nicht jede Gemeinde nutzt die gleichen Funktionen.
Zum Beispiel hat eine Gemeinde möglicherweise keine Mitfahrbänke oder keine Altkleider-Container.

Durch Feature-Flags pro Gemeinde kann individuell gesteuert werden, welche Module in der App sichtbar sind.
Die App muss keine hartkodierten Annahmen treffen, sondern liest die Konfiguration dynamisch vom Backend.

Vorteile:
- Neue Module können zentral aktiviert werden, ohne die App zu aktualisieren.
- Gemeinden können Module unabhängig voneinander ein- und ausschalten.
- Die App zeigt nur relevante Inhalte an.

Zusatzlich liefert die App-API pro Gemeinde einen frei pflegbaren Statustext (`statusText`) und einen Informationstext (`infoText`).
Beide Felder koennen im Adminbereich gepflegt werden und werden an Public-/App-Clients durchgereicht.

## Datenmodell-Erweiterungen

### VillageFeatures

Neue Tabelle mit 1:1-Beziehung zu `Village`.
Speichert boolesche Flags für jedes App-Modul.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| id | Int | Auto-Increment | Primärschlüssel |
| villageId | Int (unique) | – | Fremdschlüssel auf Village |
| enableSensorData | Boolean | true | Sensordaten in der App anzeigen |
| enableWeather | Boolean | true | Wetterdaten in der App anzeigen |
| enableMessages | Boolean | true | Nachrichten der Gemeinde in der App anzeigen |
| enableEvents | Boolean | false | Veranstaltungen in der App anzeigen |
| enableMap | Boolean | true | Kartenansicht in der App aktivieren |
| enableRideShare | Boolean | true | Mitfahrbank-Daten in der App anzeigen |
| enableTextileContainers | Boolean | false | Altkleider-Container in der App anzeigen |

Die Beziehung zu `Village` ist über `villageId` mit `@unique`-Constraint gesichert.
Dadurch kann jede Gemeinde höchstens einen Feature-Eintrag haben.
Beim Löschen einer Gemeinde wird der zugehörige Feature-Eintrag automatisch gelöscht (`onDelete: Cascade`).

### Sensordetail-Sichtbarkeit

Zusätzlich zu den Modul-Flags enthält `VillageFeatures` vier Felder, die steuern, welche Detailinformationen zu einem Sensor in der App angezeigt werden:

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| showSensorName | Boolean | true | Sensorname in der App-Detailansicht anzeigen |
| showSensorType | Boolean | true | Sensortyp in der App-Detailansicht anzeigen |
| showSensorDescription | Boolean | true | Sensorbeschreibung in der App-Detailansicht anzeigen |
| showSensorCoordinates | Boolean | true | Sensorkoordinaten in der App-Detailansicht anzeigen |

Diese Flags werden im Endpunkt `GET /api/app/villages/:villageId/config` als `sensorDetailVisibility`-Objekt bereitgestellt.
Die mobile App entscheidet basierend auf diesen Flags, welche Felder in der Sensordetailansicht angezeigt werden.

### Sensor – neues Feld `exposeToApp`

Das bestehende `Sensor`-Modell wurde um ein Boolean-Feld erweitert:

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| exposeToApp | Boolean | false | Messwerte dürfen an die mobile App gesendet werden |

**Abgrenzung der drei Sensor-Flags:**

| Flag | Bedeutung |
|------|-----------|
| `isActive` | Der Sensor existiert und ist auf Hardware-Seite aktiv. Wenn `false`, wird der Sensor im System als inaktiv betrachtet. |
| `receiveData` | Das Backend nimmt Messwerte dieses Sensors entgegen. Wenn `false`, werden eingehende Daten ignoriert. |
| `exposeToApp` | Messwerte dieses Sensors dürfen an die mobile App weitergeleitet werden. Voraussetzung: `isActive = true` und `receiveData = true` und das Village-Feature `enableSensorData = true`. |

Der Standardwert von `exposeToApp` ist `false`.
Bestehende Sensoren sind somit nicht automatisch für die App sichtbar.
Ein Administrator muss die Freigabe explizit aktivieren.

### Migrationshinweise

Die Änderungen sind rückwärtskompatibel:

- Die neue Tabelle `VillageFeatures` wird zusätzlich erstellt. Bestehende Tabellen bleiben unverändert.
- Das neue Feld `exposeToApp` auf `Sensor` hat den Standardwert `false`. Bestehende Sensoren werden also nicht automatisch in der App angezeigt.
- Das bestehende Backend nutzt die neuen Felder nicht. Nur die neue App-API liest diese Daten.
- Die Seed-Datei (`prisma/seed.js`) erstellt automatisch `VillageFeatures`-Einträge für alle vorhandenen Gemeinden mit sinnvollen Standardwerten.

Migrationsschritte:
1. `npx prisma migrate dev --name add_village_features_and_expose_to_app` – Erstellt die Migration.
2. `npx prisma generate` – Generiert den aktualisierten Prisma-Client.
3. `node prisma/seed.js` – Erstellt Feature-Einträge für bestehende Gemeinden.

## REST-API für die App

Alle App-Endpunkte sind unter dem Prefix `/app` erreichbar.
Sie erfordern keine Authentifizierung, da sie öffentliche Informationen bereitstellen.

### GET /api/app/villages

Gibt eine Liste aller verfügbaren Gemeinden zurück.

**Antwort:**
```json
{
  "success": true,
  "data": [
    {
      "villageId": 1,
      "name": "Freiburg im Breisgau",
      "locationName": "79098 Freiburg im Breisgau",
      "postalCode": { "zipCode": "79098", "city": "Freiburg im Breisgau" },
      "sensorCount": 5,
      "features": {
        "sensorData": true,
        "weather": true,
        "messages": true,
        "events": false,
        "map": true,
        "rideShare": true,
        "textileContainers": false
      }
    }
  ],
  "timestamp": "2026-03-08T10:00:00.000Z"
}
```

### GET /api/app/villages/:villageId/config

Gibt die vollständige Konfiguration einer Gemeinde zurück.
Enthält die Feature-Flags und eine Liste aller für die App freigegebenen Sensoren.

Ein Sensor erscheint in dieser Liste nur, wenn alle drei Bedingungen erfüllt sind:
- `isActive = true`
- `receiveData = true`
- `exposeToApp = true`

**Antwort:**
```json
{
  "success": true,
  "data": {
    "villageId": 1,
    "name": "Freiburg im Breisgau",
    "locationName": "79098 Freiburg im Breisgau",
    "statusText": "Aktuelle Hinweise aus dem Rathaus",
    "infoText": "Willkommen im Smart Village",
    "postalCode": { "zipCode": "79098", "city": "Freiburg im Breisgau" },
    "features": {
      "sensorData": true,
      "weather": true,
      "messages": true,
      "events": false,
      "map": true,
      "rideShare": true,
      "textileContainers": false
    },
    "sensorDetailVisibility": {
      "name": true,
      "type": true,
      "description": true,
      "coordinates": true
    },
    "sensors": [
      {
        "id": 1,
        "name": "Temperatur Rathaus",
        "type": "Temperature",
        "unit": "°C",
        "latitude": 47.99,
        "longitude": 7.85
      }
    ]
  },
  "timestamp": "2026-03-08T10:00:00.000Z"
}
```

Das Objekt `sensorDetailVisibility` teilt der App mit, welche Detailinformationen zu einem Sensor angezeigt werden sollen.
Wenn `VillageFeatures` nicht gesetzt ist, ist `sensorDetailVisibility` `null`.

Hinweis:
- `statusText` ist als eigenes Feld in `Village` persistiert.
- `infoText` bleibt weiterhin als Informationstext der Gemeinde verfuegbar.

### GET /api/app/villages/:villageId/initial-data

Gibt einen initialen Datensatz zurueck, damit die App sofort Inhalte anzeigen kann.
Dieser Endpunkt ist eine Optimierung fuer den ersten Ladevorgang.
Aktualisierte Werte werden anschliessend ueber wiederholte REST-Abfragen (Polling) geladen.

Es werden nur Daten für aktivierte Module zurückgegeben:
- `sensors` – Nur wenn `enableSensorData = true`. Enthält den letzten Messwert pro Sensor.
- `messages` – Nur wenn `enableMessages = true`. Enthält die letzten 50 Nachrichten.
- `rideshares` – Nur wenn `enableRideShare = true`. Enthält aktive Mitfahrbänke.

**Antwort (Beispiel mit allen Modulen aktiv):**
```json
{
  "success": true,
  "data": {
    "villageId": 1,
    "sensors": [
      {
        "id": 1,
        "name": "Temperatur Rathaus",
        "type": "Temperature",
        "unit": "°C",
        "latitude": 47.99,
        "longitude": 7.85,
        "lastReading": {
          "value": 23.5,
          "ts": "2026-03-08T10:30:00.000Z",
          "status": "OK"
        }
      }
    ],
    "messages": [
      {
        "id": 1,
        "text": "Willkommen in Freiburg",
        "priority": "normal",
        "createdAt": "2026-03-08T09:00:00.000Z"
      }
    ],
    "rideshares": [
      {
        "id": 1,
        "name": "Mitfahrbank Rathaus",
        "description": "Zentrale Mitfahrgelegenheit",
        "personCount": 2,
        "maxCapacity": 5,
        "latitude": 47.99,
        "longitude": 7.85
      }
    ]
  },
  "timestamp": "2026-03-08T10:00:00.000Z"
}
```

### GET /api/app/villages/:villageId/modules

Gibt aktivierte benutzerdefinierte Village-Module zurueck.

Antwortstruktur:
- `id`
- `name`
- `description`
- `iconKey`
- `moduleType`
- `sensorIds`

### Typische Aufrufreihenfolge in der App

1. `GET /api/app/villages` – Gemeindeliste laden und dem Nutzer anzeigen.
2. Nutzer wählt eine Gemeinde.
3. `GET /api/app/villages/:villageId/config` – Feature-Flags und Sensorliste laden.
4. `GET /api/app/villages/:villageId/initial-data` – Initiale Daten laden.
5. Optional: `GET /api/app/villages/:villageId/modules` – Custom-Module laden.
6. MQTT-Topic abonnieren (siehe nächster Abschnitt).

### Typische Aufrufreihenfolge in der Public-Website

1. `GET /api/app/villages`
2. `GET /api/app/villages/:villageId/config` + `GET /api/app/villages/:villageId/initial-data` parallel
3. Polling im Intervall (Standard 5 Sekunden)

## MQTT-Topics und Regeln

### Topic-Struktur

Aktuell im App-Client verwendet:

| Topic | Beschreibung |
|-------|-------------|
| `/api/app/village/{villageId}/sensors/#` | Sensordaten-Updates fuer die App |

Hinweis:
- Weitere App-Topics koennen kuenftig eingefuehrt werden.
- In der aktuellen Version ist im produktiven Datenfluss der Sensor-Topic relevant.

### Publishing-Regeln

Das Backend publiziert Daten auf App-Topics nur unter bestimmten Bedingungen:

**Sensordaten (`app/village/{villageId}/sensors`):**
- Wird bei jedem neuen Messwert publiziert.
- Bedingungen: `Sensor.isActive = true`, `Sensor.receiveData = true`, `Sensor.exposeToApp = true` und `VillageFeatures.enableSensorData = true`.

Payload:
```json
{
  "sensorId": 1,
  "sensorName": "Temperatur Rathaus",
  "value": 23.5,
  "ts": "2026-03-08T10:30:00.000Z",
  "status": "OK",
  "unit": "°C"
}
```

**Wetter (`app/village/{villageId}/weather`):**
- Wird bei neuen Wetterdaten publiziert (Annahme: periodisch, z.B. alle 15 Minuten).
- Bedingung: `VillageFeatures.enableWeather = true`.
- Hinweis: Derzeit nicht implementiert. Topic ist reserviert für zukünftige Wetter-Integration.

**Nachrichten (`app/village/{villageId}/messages`):**
- Wird bei Erstellung einer neuen Nachricht publiziert.
- Bedingung: `VillageFeatures.enableMessages = true`.
- Hinweis: Derzeit nicht implementiert. Nachrichten werden über den REST-Endpunkt abgerufen.

**Events (`app/village/{villageId}/events`):**
- Wird bei neuen Veranstaltungen publiziert.
- Bedingung: `VillageFeatures.enableEvents = true`.
- Hinweis: Derzeit nicht implementiert. Topic ist reserviert.

**Karte (`app/village/{villageId}/map`):**
- Wird bei Änderungen an Kartendaten publiziert.
- Bedingung: `VillageFeatures.enableMap = true`.
- Hinweis: Derzeit nicht implementiert. Topic ist reserviert.

**Mitfahrbank (`app/village/{villageId}/rideshare`):**
- Wird bei Änderungen an Mitfahrbank-Daten publiziert.
- Bedingung: `VillageFeatures.enableRideShare = true`.
- Hinweis: Derzeit nicht implementiert. Topic ist reserviert.

**Altkleider-Container (`app/village/{villageId}/textile-containers`):**
- Wird bei Änderungen publiziert.
- Bedingung: `VillageFeatures.enableTextileContainers = true`.
- Hinweis: Derzeit nicht implementiert. Topic ist reserviert.

### Aktuell implementiert

In der aktuellen Version ist die MQTT-Weiterleitung für **Sensordaten** implementiert.
Wenn ein Messwert über das bestehende MQTT-Topic (`sv/{accountId}/{deviceId}/sensors/{sensorId}`) empfangen wird, prüft das Backend automatisch die Feature- und Sensor-Flags und publiziert den Wert bei Bedarf auf ein app-spezifisches Topic.

Die anderen Topics sind als Platzhalter definiert und können in zukünftigen Versionen implementiert werden.

## Beispiel-Flow (aktueller Stand)

### Schritt 1: Gemeindeliste laden

```
GET /api/app/villages
```

### Schritt 2: Konfiguration und Initialdaten laden

```
GET /api/app/villages/1/config
GET /api/app/villages/1/initial-data
```

In der Website geschieht das parallel per `Promise.all`.

### Schritt 3: Optional benutzerdefinierte Module laden

```
GET /api/app/villages/1/modules
```

### Schritt 4: Polling

Website und App aktualisieren Daten periodisch ueber die App-API.
In der Website ist der Standardwert 5 Sekunden (`VITE_PUBLIC_REFRESH_INTERVAL_MS`).

### Schritt 5: MQTT-Livewerte (App)

Der App-Client abonniert aktuell:

- `/api/app/village/{villageId}/sensors/#`

Eingehende Sensordaten werden als Live-Updates verarbeitet.

## Implementierungsdetails

### Dateien und Module

| Datei | Beschreibung |
|-------|-------------|
| `backend/prisma/schema.prisma` | Prisma-Schema mit VillageFeatures und exposeToApp |
| `backend/prisma/seed.js` | Seed-Skript erstellt VillageFeatures für bestehende Gemeinden |
| `backend/src/app-api/app-api.module.ts` | NestJS-Modul für die App-API |
| `backend/src/app-api/app-api.controller.ts` | REST-Controller mit vier Endpunkten |
| `backend/src/app-api/app-api.service.ts` | Service-Logik für Datenbankabfragen |

### Wichtige Consumer-Dateien

| Datei | Beschreibung |
|-------|-------------|
| `website/src/api/client.js` | App-API-Aufrufe der Website (`/api/app/...`) |
| `website/src/components/public/PublicDashboardView.jsx` | Public-Flow inkl. Polling |
| `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/model/constants/Url.kt` | SERVER_URL der App |
| `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/model/repository/VillagesRepository.kt` | App-Aufrufe: villages + config |
| `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/model/repository/SensorRepository.kt` | App-Aufruf: initial-data |
| `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/provider/MqttClientProvider.kt` | App-MQTT-Subscription |
