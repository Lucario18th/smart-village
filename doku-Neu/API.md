# 📚 Smart Village API Documentation

> Hinweis (Stand 2026-03-15): Dieses Dokument ist ein allgemeiner Ueberblick.
> Die verbindliche und gepflegte API-Referenz liegt in `api/endpunkte.md`.
> Fuer App-spezifische Endpunkte unter `/app` siehe `backend/app-api.md`.

Vollständige Dokumentation aller verfügbaren API Endpoints.

## 🌐 Base URL

```
https://localhost:8000
```

## 🔐 Authentication

Die meisten Endpoints benötigen einen **JWT Bearer Token**.

### Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Token abrufen

**Endpoint:** `POST /api/auth/login`
```bash
curl -X POST https://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.de",
    "password": "test1234"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

## 📋 Endpoints

### 🏥 Health Check

#### `GET /health`
Prüft ob der Backend läuft. Keine Authentication nötig.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-03T14:50:00.000Z",
  "uptime": 234.567
}
```

---

### 🔐 Authentication Endpoints

#### `POST /api/auth/register`
Neuen User registrieren.

**Request Body:**
```json
{
  "email": "user@example.de",
  "password": "SecurePassword123!",
  "postalCodeId": 1234,
  "villageName": "My Village",
  "locationName": "Main Street"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.de",
  "createdAt": "2026-03-03T14:50:00.000Z",
  "villages": [
    {
      "id": 42,
      "name": "My Village",
      "postalCode": {
        "id": 1234,
        "postalCode": "10115",
        "city": "Berlin",
        "lat": 52.532,
        "lng": 13.3849
      }
    }
  ]
}
```

---

#### `POST /api/auth/login`
User anmelden und JWT Token erhalten.

**Request Body:**
```json
{
  "email": "test@test.de",
  "password": "test1234"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Fehler (401 Unauthorized):**
```json
{
  "message": "Invalid credentials",
  "statusCode": 401
}
```

---

#### `GET /api/auth/me`
Aktuelle User/Account Informationen abrufen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "test@test.de",
  "createdAt": "2026-03-03T14:50:00.000Z",
  "lastLoginAt": "2026-03-03T14:50:00.000Z"
}
```

---

### 📊 Sensor Management Endpoints

#### `GET /api/sensors`
Alle Sensoren des aktuellen Users abrufen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Temperature Sensor 1",
    "sensorTypeId": 1,
    "villageId": 1,
    "location": "Main Hall",
    "healthStatus": "OK",
    "createdAt": "2026-03-03T14:50:00.000Z",
    "updatedAt": "2026-03-03T14:50:00.000Z"
  },
  {
    "id": 2,
    "name": "Humidity Sensor 2",
    "sensorTypeId": 2,
    "villageId": 1,
    "location": "Storage Room",
    "healthStatus": "OK",
    "createdAt": "2026-03-03T14:50:00.000Z",
    "updatedAt": "2026-03-03T14:50:00.000Z"
  }
]
```

---

#### `POST /api/sensors`
Neuen Sensor erstellen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Temperature Sensor 3",
  "sensorTypeId": 1,
  "location": "Outdoor Area"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Temperature Sensor 3",
  "sensorTypeId": 1,
  "villageId": 1,
  "location": "Outdoor Area",
  "healthStatus": "OK",
  "createdAt": "2026-03-03T14:50:00.000Z",
  "updatedAt": "2026-03-03T14:50:00.000Z"
}
```

---

#### `GET /api/sensors/:sensorId`
Einzelnen Sensor abrufen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Temperature Sensor 1",
  "sensorTypeId": 1,
  "villageId": 1,
  "location": "Main Hall",
  "healthStatus": "OK",
  "createdAt": "2026-03-03T14:50:00.000Z",
  "updatedAt": "2026-03-03T14:50:00.000Z"
}
```

---

#### `PATCH /api/sensors/:sensorId`
Sensor aktualisieren.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "name": "Updated Sensor Name",
  "location": "New Location",
  "healthStatus": "WARN"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Sensor Name",
  "sensorTypeId": 1,
  "villageId": 1,
  "location": "New Location",
  "healthStatus": "WARN",
  "createdAt": "2026-03-03T14:50:00.000Z",
  "updatedAt": "2026-03-03T15:00:00.000Z"
}
```

---

#### `DELETE /api/sensors/:sensorId`
Sensor löschen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (204 No Content):**
```
(leerer Body)
```

---

### 📈 Sensor Reading Endpoints

#### `POST /api/sensors/:sensorId/readings`
Neue Sensor-Messung hinzufügen.

**Headers (erforderlich):**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": "23.45",
  "status": "OK",
  "timestamp": "2026-03-03T14:50:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "id": 42,
  "sensorId": 1,
  "value": "23.45",
  "status": "OK",
  "timestamp": "2026-03-03T14:50:00.000Z",
  "createdAt": "2026-03-03T14:50:01.000Z"
}
```

---

#### `GET /api/sensors/:sensorId/readings`
Alle Messungen für einen Sensor abrufen.

**Query Parameters:**
- `limit` (optional, default: 100) - Maximale Anzahl
- `offset` (optional, default: 0) - Für Pagination
- `fromDate` (optional) - ISO 8601 Timestamp
- `toDate` (optional) - ISO 8601 Timestamp

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/sensors/1/readings?limit=50&offset=0&fromDate=2026-03-01T00:00:00Z
```

**Response (200 OK):**
```json
[
  {
    "id": 42,
    "sensorId": 1,
    "value": "23.45",
    "status": "OK",
    "timestamp": "2026-03-03T14:50:00.000Z",
    "createdAt": "2026-03-03T14:50:01.000Z"
  },
  {
    "id": 41,
    "sensorId": 1,
    "value": "23.40",
    "status": "OK",
    "timestamp": "2026-03-03T14:49:00.000Z",
    "createdAt": "2026-03-03T14:49:01.000Z"
  }
]
```

---

#### `GET /api/sensors/:sensorId/timeseries`
Zeitreihen-Daten für einen Sensor (aggregiert).

**Query Parameters:**
- `interval` (optional) - `minute`, `hour`, `day` (default: auto)
- `fromDate` (optional) - ISO 8601
- `toDate` (optional) - ISO 8601

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "timestamp": "2026-03-03T14:00:00.000Z",
    "avgValue": "23.42",
    "minValue": "23.10",
    "maxValue": "23.89",
    "count": 60
  }
]
```

---

#### `GET /api/sensors/:sensorId/summary`
Zusammenfassung der Sensor-Messungen.

**Query Parameters:**
- `fromDate` (optional) - ISO 8601
- `toDate` (optional) - ISO 8601

**Headers (erforderlich):**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "sensorId": 1,
  "totalReadings": 1250,
  "avgValue": "23.45",
  "minValue": "15.20",
  "maxValue": "31.80",
  "stdDev": "2.34",
  "lastReading": {
    "value": "23.45",
    "timestamp": "2026-03-03T14:50:00.000Z"
  }
}
```

---

## 📊 Sensor Types

Die folgenden Sensor-Typen sind vordefiniert:

| ID | Name | Unit | Beschreibung |
|----|------|------|-------------|
| 1 | Temperature | °C | Temperatur |
| 2 | Humidity | % | Luftfeuchtigkeit |
| 3 | Pressure | hPa | Luftdruck |
| 4 | Rainfall | mm | Regenmenge |
| 5 | Wind Speed | m/s | Windgeschwindigkeit |
| 6 | Solar Radiation | W/m² | Solarstrahlung |
| 7 | Soil Moisture | % | Bodenfeuchte |
| 8 | CO2 | ppm | CO2-Konzentration |

---

## 🔄 Status Values

### Sensor Health Status
- `OK` - Sensor funktioniert normal
- `WARN` - Warnung, aber funktionsfähig
- `ERROR` - Sensor fehlerhaft
- `UNKNOWN` - Status unbekannt

### Reading Status
- `OK` - Messung ok
- `SUSPECT` - Messung verdächtig (Prüfung empfohlen)
- `ERROR` - Messung fehlerhaft

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Sensor not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 🧪 cURL Examples

### Login
```bash
curl -X POST https://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -k \
  -d '{
    "email": "test@test.de",
    "password": "test1234"
  }'
```

### Alle Sensoren abrufen
```bash
curl -X GET https://localhost:8000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -k
```

### Neuen Sensor erstellen
```bash
curl -X POST https://localhost:8000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -k \
  -d '{
    "name": "Test Sensor",
    "sensorTypeId": 1,
    "location": "Test Location"
  }'
```

### Sensor-Messung senden
```bash
curl -X POST https://localhost:8000/api/sensors/1/readings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -k \
  -d '{
    "value": "23.45",
    "status": "OK",
    "timestamp": "2026-03-03T14:50:00.000Z"
  }'
```

**Hinweis:** `-k` Flag akzeptiert Self-Signed Certificates.

---

## 📝 Rate Limiting

Aktuell keine Rate Limits implementiert.

---

## 🔄 CORS

CORS ist konfiguriert für:
- `http://localhost:3000`
- `http://localhost:8000`
- Alle HTTPS URLs (mit Self-Signed Cert)

---

## 📖 Weitere Informationen

- Siehe `frontend-tests/` für HTML Test-Seite
- Siehe `test-scripts/` für E2E Test-Script
- Siehe `docker-test-report/` für Docker Setup-Dokumentation
