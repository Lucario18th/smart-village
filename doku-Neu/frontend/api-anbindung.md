# API-Anbindung im Frontend

## Überblick

Die Kommunikation zwischen Frontend und Backend wird über einen zentralen API-Client abgewickelt.
Dazu kommen zwei Hooks, die die Geschäftslogik kapseln: `useAdminAuth` für die Authentifizierung und `useVillageConfig` für die Gemeindedaten.

## API-Client

Der API-Client befindet sich in `website/src/api/client.js`.
Er ist ein einzelnes Objekt (`apiClient`), das alle HTTP-Anfragen an das Backend bündelt.

**Basis-URL:** `/api` (wird von Nginx an das Backend weitergeleitet)

**Authentifizierung:** Bei geschützten Endpunkten wird der JWT-Token aus dem LocalStorage gelesen und als `Authorization: Bearer <token>` Header mitgeschickt.

**Fehlerbehandlung:** Der Client extrahiert den HTTP-Statuscode und bereichert Fehler mit zusätzlichen Informationen. Fehlermeldungen werden so an die Hooks weitergegeben.

### Verfügbare Methoden

| Kategorie | Methode | HTTP-Aufruf |
|-----------|---------|-------------|
| Auth | `auth.login(email, password)` | POST /api/auth/login |
| Auth | `auth.register(data)` | POST /api/auth/register |
| Auth | `auth.verifyCode(email, code)` | POST /api/auth/verify-code |
| Auth | `auth.resendVerification(email)` | POST /api/auth/resend-verification |
| Auth | `auth.me()` | GET /api/auth/me |
| Villages | `villages.get(villageId)` | GET /api/villages/:id |
| Villages | `villages.update(villageId, data)` | PUT /api/villages/:id |
| Sensors | `sensors.list(villageId)` | GET /api/sensors/village/:id |
| Sensors | `sensors.create(villageId, data)` | POST /api/sensors/village/:id |
| Sensors | `sensors.get(sensorId)` | GET /api/sensors/:id |
| Sensors | `sensors.update(sensorId, data)` | PATCH /api/sensors/:id |
| Sensors | `sensors.delete(sensorId)` | DELETE /api/sensors/:id |
| Devices | `devices.list(villageId)` | GET /api/devices/village/:id |
| Devices | `devices.create(villageId, data)` | POST /api/devices/village/:id |
| Devices | `devices.update(deviceId, data)` | PATCH /api/devices/:id |
| SensorTypes | `sensorTypes.list()` | GET /api/sensor-types |
| Readings | `sensorReadings.list(sensorId, params)` | GET /api/sensor-readings/:id |
| Readings | `sensorReadings.create(sensorId, data)` | POST /api/sensor-readings/:id |
| Readings | `sensorReadings.timeseries(sensorId, params)` | GET /api/sensor-readings/:id/timeseries |
| Readings | `sensorReadings.summary(sensorId, params)` | GET /api/sensor-readings/:id/summary |
| Locations | `locations.search(query)` | GET /api/locations/search?query=... |
| Admin | `admin.deleteAccount(accountId)` | DELETE /api/admin/accounts/:id |
| Health | `health.check()` | GET /api/health |

## Session-Verwaltung

Die Session-Verwaltung befindet sich in `website/src/auth/session.js`.

### Funktionen

| Funktion | Beschreibung |
|----------|-------------|
| `validateCredentials(email, password)` | Meldet den Benutzer an und dekodiert den JWT-Token |
| `readSession()` | Liest die Session aus dem LocalStorage |
| `persistSession(session)` | Speichert die Session im LocalStorage |
| `clearSession()` | Löscht die Session und den Token |

**LocalStorage-Schlüssel:**
- `smart-village-admin-session` – Session-Daten (Account-ID, E-Mail)
- `smart-village-admin-token` – JWT-Token

### Token-Dekodierung

Der JWT-Token wird im Frontend dekodiert, um die Account-ID (`sub`) zu extrahieren.
Die Dekodierung erfolgt durch einfaches Base64-Parsen des Token-Payloads.
Die Account-ID wird als `villageId` verwendet, da jeder Account genau eine Gemeinde hat.

## Hook: useAdminAuth

Befindet sich in `website/src/hooks/useAdminAuth.js`.

**Rückgabe:**
- `session` – Aktuelle Session oder `null`
- `login(email, password)` – Anmeldefunktion
- `logout()` – Abmeldefunktion
- `loading` – Ob eine Anfrage läuft
- `error` – Fehlermeldung

**Fehlerzuordnung:**
Der Hook ordnet HTTP-Fehlercodes benutzerfreundlichen Meldungen zu:
- `USER_NOT_FOUND` – Benutzer nicht gefunden
- `INVALID_PASSWORD` – Falsches Passwort
- `EMAIL_NOT_VERIFIED` – E-Mail nicht verifiziert

Beim Start der Anwendung wird geprüft, ob eine gültige Session im LocalStorage vorhanden ist.
Wenn ja, wird der Benutzer automatisch angemeldet.

## Hook: useVillageConfig

Befindet sich in `website/src/hooks/useVillageConfig.js` (ca. 706 Zeilen).
Dies ist der zentrale Hook für die Verwaltung der Gemeindedaten im Dashboard.

### Zustand

| Variable | Typ | Beschreibung |
|----------|-----|-------------|
| config | Object | Vollständige Gemeinde-Konfiguration |
| hasUnsavedChanges | Boolean | Ob ungespeicherte Änderungen vorliegen |
| isLoading | Boolean | Ob eine Anfrage läuft |
| villageId | Int | ID der aktuellen Gemeinde |
| sensorTypes | Array | Verfügbare Sensortypen |
| toast | Object | Benachrichtigung für Discovery |

### Daten laden

Wenn sich die Session ändert, wird die Gemeinde über `GET /api/villages/:villageId` geladen.
Die API-Antwort wird über die Hilfsfunktionen `mapSensors()` und `mapDevices()` in das interne Format umgewandelt.
Gleichzeitig werden die Sensortypen über `GET /api/sensor-types` geladen.

### Gemeindedaten ändern

Für jede Kategorie gibt es spezifische Update-Funktionen:

| Funktion | Zweck |
|----------|-------|
| `updateGeneralField(field, value)` | Allgemeine Einstellungen ändern |
| `updateModuleEnabled(id, enabled)` | Modul aktivieren/deaktivieren |
| `addSensor(data)` | Neuen Sensor hinzufügen |
| `updateSensor(id, updates)` | Sensor aktualisieren |
| `removeSensor(id)` | Sensor entfernen |
| `addDevice(data)` | Neues Gerät hinzufügen |
| `updateDevice(id, updates)` | Gerät aktualisieren |
| `updateDesignField(field, value)` | Theme-Einstellungen ändern |

Neue Sensoren und Geräte erhalten eine negative ID, die als Platzhalter dient.
Beim Speichern werden diese Platzhalter durch die vom Backend vergebenen IDs ersetzt.

### Speichern

Die Funktion `saveConfig()` führt einen komplexen Speichervorgang durch:

1. Neue Geräte werden über `POST /api/devices/village/:id` angelegt.
2. Bestehende Geräte werden über `PATCH /api/devices/:id` aktualisiert.
3. Neue Sensoren werden über `POST /api/sensors/village/:id` angelegt.
4. Bestehende Sensoren werden über `PATCH /api/sensors/:id` aktualisiert.
5. Gelöschte Sensoren werden über `DELETE /api/sensors/:id` entfernt.
6. Die Gemeindedaten werden über `PUT /api/villages/:id` aktualisiert.

### Auto-Refresh und Discovery

Der Hook fragt regelmäßig die Gemeindedaten ab (Standard: alle 5 Sekunden).
Das Intervall ist über die Umgebungsvariable `VITE_DISCOVERY_POLL_INTERVAL_MS` konfigurierbar.
Die Funktion kann über `VITE_AUTO_REFRESH_ENABLED=false` deaktiviert werden.

Bei jedem Polling-Zyklus werden die geladenen Sensoren und Geräte mit dem internen Zustand verglichen.
Neue Einträge werden erkannt und dem Benutzer über eine Toast-Benachrichtigung angezeigt.
Das ermöglicht es, neu über MQTT entdeckte Geräte ohne manuelles Neuladen zu sehen.

Die Discovery-Logik verwendet einen Debounce-Mechanismus (1,2 Sekunden), um mehrere gleichzeitig entdeckte Geräte in einer einzigen Benachrichtigung zusammenzufassen.

### Hilfsfunktionen

| Funktion | Beschreibung |
|----------|-------------|
| `mapSensors(apiSensors)` | Wandelt API-Sensordaten in das interne Format um |
| `mapDevices(apiDevices)` | Wandelt API-Gerätedaten in das interne Format um |
| `buildDiscoveryToastMessage(newItems)` | Erstellt die Benachrichtigungsnachricht für neue Geräte |
| `mergeFetchedVillageData(fetched, current)` | Fügt neue Daten mit dem aktuellen Zustand zusammen |
| `isMitfahrbankSensor(sensor)` | Prüft, ob ein Sensor ein Mitfahrbank-Sensor ist |

Diese Funktionen sind exportiert, sodass sie in Unit-Tests getestet werden können.

## Konfigurationsmodell

Das Konfigurationsmodell in `website/src/config/configModel.js` definiert die Struktur der Gemeindedaten im Frontend.

```
config = {
  general: {
    villageName, municipalityCode, contactEmail,
    contactPhone, statusText, infoText, zipCode, city, postalCodeId
  },
  devices: [...],
  modules: {
    sensors: { enabled, sensors: [] },
    weather: { enabled, sensors: [] },
    news:    { enabled, sensors: [] },
    events:  { enabled, sensors: [] }
  },
  design: {
    themeMode, contrast, iconSet
  }
}
```

Die Funktionen `fromApiPayload()` und `toApiPayload()` wandeln zwischen dem internen Format und dem API-Format um.
`normalizeVillageConfig()` füllt fehlende Felder mit Standardwerten auf.

## LocalStorage-Nutzung

Das Frontend speichert folgende Daten im LocalStorage:

| Schlüssel | Inhalt |
|-----------|--------|
| `smart-village-admin-session` | Session-Daten (Account-ID, E-Mail) |
| `smart-village-admin-token` | JWT-Token |
| `smart-village-config:{villageId}` | Gemeinde-Konfiguration |

Beim Abmelden werden Session und Token gelöscht.
Die Konfiguration bleibt erhalten, damit sie beim nächsten Login schneller geladen werden kann.
