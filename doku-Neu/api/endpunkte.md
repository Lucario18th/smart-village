# API-Endpunkte-Referenz

## Überblick

Diese Referenz listet alle REST-API-Endpunkte des Smart-Village-Backends auf.
Alle Endpunkte sind unter dem Prefix `/api` erreichbar.
Die Base-URL ist `https://localhost:8000` (direkt) oder `https://localhost/api` (über Nginx).

Die App-API für Website und mobile App ist extern unter dem Prefix `/api/app` erreichbar.
Eine ausführliche Beschreibung der App-API befindet sich in der [App-API-Dokumentation](../backend/app-api.md).

Die Mobile API (`/mobile-api/`) ist in dieser Referenz nicht enthalten, da sie außerhalb des Geltungsbereichs liegt.

## Authentifizierung

Geschützte Endpunkte erfordern einen JWT-Token im HTTP-Header:
```
Authorization: Bearer <token>
```

Der Token wird über den Login-Endpunkt erhalten.

## Endpunkte

### System

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/health` | Nein | Health-Check des Systems |

**Antwort (health):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

### Authentifizierung

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Nein | Neues Konto registrieren |
| POST | `/api/auth/login` | Nein | Anmelden |
| POST | `/api/auth/verify-code` | Nein | E-Mail-Verifizierungscode prüfen |
| POST | `/api/auth/resend-verification` | Nein | Verifizierungscode erneut senden |
| GET | `/api/auth/me` | Ja | Eigene Kontodaten abrufen |
| POST | `/api/auth/account-settings` | Ja | Account-Typ und Public-App-API-Freigabe aktualisieren |

**Register – Eingabe:**
```json
{
  "email": "beispiel@test.de",
  "password": "sicheresPasswort123",
  "postalCodeId": 42,
  "accountType": "MUNICIPAL",
  "isPublicAppApiEnabled": true,
  "villageName": "Musterdorf"
}
```

**Login – Eingabe:**
```json
{
  "email": "beispiel@test.de",
  "password": "sicheresPasswort123"
}
```

**Login – Antwort:**
```json
{
  "access_token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "beispiel@test.de",
    "isAdmin": false
  }
}
```

**Verify-Code – Eingabe:**
```json
{
  "email": "beispiel@test.de",
  "code": "123456"
}
```

**Me – Antwort:**
```json
{
  "id": 1,
  "email": "beispiel@test.de",
  "isAdmin": false,
  "emailVerified": true,
  "villages": [
    { "id": 1, "name": "Musterdorf" }
  ]
}
```

### Gemeinden (Villages)

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/villages/:villageId` | Ja | Gemeinde mit Sensoren und Geräten abrufen |
| PUT | `/api/villages/:villageId` | Ja | Gemeindedaten aktualisieren |

**Update – Eingabe (alle Felder optional):**
```json
{
  "name": "Neuer Name",
  "locationName": "Musterdorf am See",
  "statusText": "Aktuelle Hinweise aus dem Rathaus",
  "phone": "0761 12345",
  "infoText": "Willkommen in Musterdorf",
  "contactEmail": "info@musterdorf.de",
  "contactPhone": "0761 98765",
  "municipalityCode": "08315123",
  "postalCodeId": 42
}
```

### Sensoren

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/sensors/village/:villageId` | Nein | Alle Sensoren einer Gemeinde |
| POST | `/api/sensors/village/:villageId` | Ja | Neuen Sensor anlegen |
| GET | `/api/sensors/:sensorId` | Nein | Einzelnen Sensor abrufen |
| PATCH | `/api/sensors/:sensorId` | Ja | Sensor aktualisieren |
| DELETE | `/api/sensors/:sensorId` | Ja | Sensor löschen |

**Create – Eingabe:**
```json
{
  "name": "Temperatur Rathaus",
  "sensorTypeId": 1,
  "deviceId": 1,
  "latitude": 47.99,
  "longitude": 7.85,
  "infoText": "Außentemperatur"
}
```

**Update – Eingabe (alle Felder optional):**
```json
{
  "name": "Neuer Name",
  "isActive": false,
  "receiveData": true,
  "exposeToApp": true,
  "latitude": 48.0,
  "longitude": 7.9
}
```

Hinweise zu Sensor-Flags:
- `isActive`: Sensor gilt systemseitig als aktiv/inaktiv.
- `receiveData`: Backend nimmt Messwerte dieses Sensors an.
- `exposeToApp`: Sensor darf in App/Public-Konfiguration ausgeliefert werden.

Zusatzfeld in Sensor-Listen:
- `dataStale` (Boolean): `true`, wenn seit etwa 60 Sekunden kein neuer Messwert empfangen wurde.

### Messwerte (Sensor Readings)

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| POST | `/api/sensor-readings/:sensorId` | Nein | Messwert(e) einreichen |
| GET | `/api/sensor-readings/:sensorId` | Nein | Messwerte abfragen |
| GET | `/api/sensor-readings/:sensorId/timeseries` | Nein | Aggregierte Zeitreihe |
| GET | `/api/sensor-readings/:sensorId/summary` | Nein | Zusammenfassung (Min/Max/Avg) |

**Create (einzeln) – Eingabe:**
```json
{
  "ts": "2025-01-15T10:30:00Z",
  "value": 23.5,
  "status": "OK",
  "extra": {}
}
```

**Create (mehrere) – Eingabe:**
```json
{
  "readings": [
    { "ts": "2025-01-15T10:30:00Z", "value": 23.5 },
    { "ts": "2025-01-15T10:35:00Z", "value": 23.8 }
  ]
}
```

**List – Query-Parameter:**
- `from` (DateTime) – Startzeitpunkt
- `to` (DateTime) – Endzeitpunkt
- `limit` (Int) – Maximale Anzahl
- `order` (String) – `asc` oder `desc`

**Timeseries – Query-Parameter:**
- `bucket` (String) – Intervall: `minute`, `hour`, `day`, `week`, `month`
- `from` (DateTime) – Startzeitpunkt
- `to` (DateTime) – Endzeitpunkt

**Summary – Antwort:**
```json
{
  "min": 18.2,
  "max": 28.7,
  "avg": 23.1,
  "count": 144,
  "last": {
    "value": 23.5,
    "ts": "2025-01-15T10:30:00Z"
  }
}
```

### Sensortypen

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/sensor-types` | Nein | Alle Sensortypen auflisten |

**Antwort:**
```json
[
  { "id": 1, "name": "Temperatur", "unit": "°C", "description": "Temperaturmessung" },
  { "id": 2, "name": "Luftfeuchtigkeit", "unit": "%", "description": "Relative Luftfeuchtigkeit" },
  { "id": 3, "name": "Mitfahrbank", "unit": "Personen", "description": "Wartende Personen" }
]
```

### Geräte (Devices)

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/devices/village/:villageId` | Nein | Alle Geräte einer Gemeinde |
| POST | `/api/devices/village/:villageId` | Ja | Neues Gerät anlegen |
| PATCH | `/api/devices/:id` | Ja | Gerät aktualisieren |

**Create – Eingabe:**
```json
{
  "deviceId": "weather-station-01",
  "name": "Wetterstation Rathaus",
  "latitude": 47.99,
  "longitude": 7.85
}
```

### Standortsuche (Locations)

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/locations/search?query=<text>` | Nein | PLZ/Ort suchen (max. 15 Ergebnisse) |

**Antwort:**
```json
[
  { "id": 42, "zipCode": "79100", "city": "Freiburg im Breisgau", "state": "Baden-Württemberg" }
]
```

### Administration

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| DELETE | `/api/admin/accounts/:accountId` | Ja (Admin) | Konto mit allen Daten löschen |

Dieser Endpunkt erfordert ein Konto mit `isAdmin: true`.

### App-API (fuer Website und mobile App)

Diese Endpunkte sind unter dem Prefix `/api/app` erreichbar.
Sie erfordern keine Authentifizierung.

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/app/villages` | Nein | Liste aller Gemeinden mit Feature-Flags und PLZ |
| GET | `/api/app/villages/:villageId/config` | Nein | Konfiguration einer Gemeinde (Features + freigegebene Sensoren) |
| GET | `/api/app/villages/:villageId/initial-data` | Nein | Initiale Daten fuer den ersten Ladevorgang |
| GET | `/api/app/villages/:villageId/modules` | Nein | Aktivierte benutzerdefinierte Module einer Gemeinde |

Hinweis: Nur Accounts mit `isPublicAppApiEnabled = true` erscheinen in `/api/app/villages`.

Der Public-User-Bereich der Website (`/user`) nutzt die gleichen App-API-Endpunkte wie die mobile App.

Ausfuehrliche Dokumentation: [App-API](../backend/app-api.md)

## HTTP-Statuscodes

| Code | Bedeutung |
|------|-----------|
| 200 | Erfolgreiche Anfrage |
| 201 | Ressource erfolgreich erstellt |
| 400 | Ungültige Eingabe (Validierungsfehler) |
| 401 | Nicht autorisiert (kein oder ungültiger Token) |
| 403 | Keine Berechtigung (kein Administrator) |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z. B. E-Mail bereits registriert) |
| 500 | Serverfehler |

## Fehlerformat

Fehler werden im folgenden Format zurückgegeben:

```json
{
  "statusCode": 400,
  "message": "Beschreibung des Fehlers",
  "error": "Bad Request"
}
```

Bei Validierungsfehlern kann `message` ein Array sein:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password should not be empty"],
  "error": "Bad Request"
}
```

## Beispiel: Curl-Befehle

**Anmelden:**
```bash
curl -X POST https://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.de", "password": "test1234"}'
```

**Gemeinde abrufen:**
```bash
curl https://localhost:8000/api/villages/1 \
  -H "Authorization: Bearer <token>"
```

**Sensor anlegen:**
```bash
curl -X POST https://localhost:8000/api/sensors/village/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Neuer Sensor", "sensorTypeId": 1}'
```

**Messwert senden:**
```bash
curl -X POST https://localhost:8000/api/sensor-readings/1 \
  -H "Content-Type: application/json" \
  -d '{"ts": "2025-01-15T10:30:00Z", "value": 23.5}'
```
