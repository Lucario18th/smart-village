Dokumentation: Backend API - Smart Village System

Uebersicht

Das Smart Village Backend stellt eine RESTful API zur Verfuegung, die auf NestJS basiert und mit einer PostgreSQL-Datenbank verbunden ist. Die API handhabt Authentifizierung, Gemeindekonfiguration, Sensoren und Sensordaten.

Base URL
https://localhost/api (ueber Nginx Reverse Proxy)
http://localhost:8000/api (direkter Backend-Zugriff)

Authentifizierung

Die API verwendet JWT (JSON Web Tokens) fuer die Authentifizierung. Alle geschuetzten Endpunkte erfordern einen Authorization Header mit einem gueltigem JWT Token.

Authorization Header
Authorization: Bearer <jwt_token>

Der Token wird bei der Anmeldung ausgegeben und ist 7 Tage gueltig.

HTTP Status Codes

200 OK - Anfrage erfolgreich
201 Created - Ressource erstellt
400 Bad Request - Ungueltige Anfrage oder Validierungsfehler
404 Not Found - Ressource nicht gefunden
500 Internal Server Error - Serverfehler

Fehlerformat

{
  "message": "Fehlerbeschreibung",
  "error": "Fehlertyp",
  "statusCode": 400
}

AUTHENTIFIZIERUNG API

1. Registrierung

POST /auth/register

Neuen Benutzer registrieren.

Request Body
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (201)
{
  "id": 5,
  "email": "user@example.com",
  "createdAt": "2026-03-04T13:07:59.385Z",
  "lastLoginAt": null,
  "villages": [
    {
      "id": 5,
      "accountId": 5,
      "name": "",
      "locationName": "",
      "phone": null,
      "infoText": null
    }
  ]
}

2. Anmeldung

POST /auth/login

Benutzer anmelden und JWT Token erhalten.

Request Body
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

3. Benutzerinfo abrufen

GET /auth/me

Authentifizierten Benutzer abrufen.

Header
Authorization: Bearer <jwt_token>

Response (200)
{
  "sub": 2,
  "email": "test@example.com",
  "iat": 1772629599,
  "exp": 1773234399
}

GEMEINDE API

1. Gemeinde abrufen

GET /villages/:villageId

Gemeindedaten mit allen Sensoren abrufen.

Parameter
villageId (number) - ID der Gemeinde

Header
Authorization: Bearer <jwt_token>

Response (200)
{
  "id": 4,
  "accountId": 4,
  "name": "Musterstadt",
  "locationName": "Bayern, Deutschland",
  "phone": "089-123456",
  "infoText": "Willkommen in unserer Gemeinde",
  "sensors": [
    {
      "id": 1,
      "villageId": 4,
      "sensorTypeId": 1,
      "name": "Temperatur Rathaus",
      "infoText": "Temperatur im Rathaus",
      "isActive": true,
      "sensorType": {
        "id": 1,
        "name": "Temperature",
        "unit": "°C",
        "description": "Lufttemperatur"
      }
    }
  ]
}

2. Gemeinde aktualisieren

PUT /villages/:villageId

Gemeindedaten aktualisieren.

Parameter
villageId (number) - ID der Gemeinde

Header
Authorization: Bearer <jwt_token>

Request Body
{
  "name": "Neue Gemeinde",
  "locationName": "Neue Region",
  "phone": "089-987654",
  "infoText": "Neue Beschreibung"
}

Response (200)
{
  "id": 4,
  "accountId": 4,
  "name": "Neue Gemeinde",
  "locationName": "Neue Region",
  "phone": "089-987654",
  "infoText": "Neue Beschreibung",
  "sensors": []
}

SENSOR API

1. Sensoren einer Gemeinde abrufen

GET /sensors/village/:villageId

Alle Sensoren einer Gemeinde auflisten.

Parameter
villageId (number) - ID der Gemeinde

Response (200)
[
  {
    "id": 1,
    "villageId": 4,
    "sensorTypeId": 1,
    "name": "Temperatur Rathaus",
    "infoText": "Temperatur im Rathaus",
    "isActive": true,
    "sensorType": {
      "id": 1,
      "name": "Temperature",
      "unit": "°C",
      "description": "Lufttemperatur"
    }
  }
]

2. Sensor erstellen

POST /sensors/village/:villageId

Neuen Sensor erstellen.

Parameter
villageId (number) - ID der Gemeinde

Header
Authorization: Bearer <jwt_token>

Request Body
{
  "sensorTypeId": 1,
  "name": "Neuer Sensor",
  "infoText": "Sensorbeschreibung"
}

Response (201)
{
  "id": 2,
  "villageId": 4,
  "sensorTypeId": 1,
  "name": "Neuer Sensor",
  "infoText": "Sensorbeschreibung",
  "isActive": true
}

3. Sensor abrufen

GET /sensors/:sensorId

Sensor mit vollstaendigen Daten abrufen.

Parameter
sensorId (number) - ID des Sensors

Response (200)
{
  "id": 1,
  "villageId": 4,
  "sensorTypeId": 1,
  "name": "Temperatur Rathaus",
  "infoText": "Temperatur im Rathaus",
  "isActive": true,
  "sensorType": {
    "id": 1,
    "name": "Temperature",
    "unit": "°C",
    "description": "Lufttemperatur"
  },
  "village": {
    "id": 4,
    "accountId": 4,
    "name": "Musterstadt"
  }
}

4. Sensor aktualisieren

PATCH /sensors/:sensorId

Sensordaten aktualisieren.

Parameter
sensorId (number) - ID des Sensors

Header
Authorization: Bearer <jwt_token>

Request Body
{
  "name": "Neuer Name",
  "infoText": "Neue Beschreibung",
  "isActive": true
}

Response (200)
{
  "id": 1,
  "villageId": 4,
  "sensorTypeId": 1,
  "name": "Neuer Name",
  "infoText": "Neue Beschreibung",
  "isActive": true
}

5. Sensor loeschen

DELETE /sensors/:sensorId

Sensor aus der Datenbank loeschen.

Parameter
sensorId (number) - ID des Sensors

Header
Authorization: Bearer <jwt_token>

Response (200)
{
  "id": 1,
  "villageId": 4,
  "sensorTypeId": 1,
  "name": "Temperatur Rathaus"
}

SENSOR TYPEN API

1. Alle Sensor-Typen abrufen

GET /sensor-types

Alle verfuegbaren Sensor-Typen auflisten.

Response (200)
[
  {
    "id": 1,
    "name": "Temperature",
    "unit": "°C",
    "description": "Lufttemperatur"
  },
  {
    "id": 2,
    "name": "Humidity",
    "unit": "%",
    "description": "Luftfeuchte"
  }
]

SENSOR READINGS API

1. Sensordaten erstellen

POST /sensor-readings/:sensorId

Neue Sensormessung hinzufuegen.

Parameter
sensorId (number) - ID des Sensors

Header
Authorization: Bearer <jwt_token>

Request Body
{
  "value": 23.5,
  "status": "OK"
}

Response (201)
{
  "id": 1,
  "sensorId": 1,
  "value": 23.5,
  "status": "OK",
  "timestamp": "2026-03-04T13:07:59.385Z"
}

2. Sensordaten abrufen

GET /sensor-readings/:sensorId

Alle Messwerte eines Sensors abrufen.

Parameter
sensorId (number) - ID des Sensors

Query Parameter
limit (number, optional) - Maximale Anzahl der Ergebnisse (Standard: 100)
offset (number, optional) - Offset fuer Pagination (Standard: 0)

Response (200)
[
  {
    "id": 1,
    "sensorId": 1,
    "value": 23.5,
    "status": "OK",
    "timestamp": "2026-03-04T13:07:59.385Z"
  }
]

3. Zeitreihe abrufen

GET /sensor-readings/:sensorId/timeseries

Messwerte in Zeitintervallen aggregiert abrufen.

Parameter
sensorId (number) - ID des Sensors

Query Parameter
bucket (string) - Aggregationsintervall
  - 1h (1 Stunde)
  - 1d (1 Tag)
  - 1w (1 Woche)
  - 1m (1 Monat)
startDate (string, ISO 8601) - Startdatum
endDate (string, ISO 8601) - Enddatum

Response (200)
[
  {
    "bucket": "2026-03-04T13:00:00Z",
    "avg": 23.2,
    "min": 22.1,
    "max": 24.3,
    "count": 10
  }
]

4. Zusammenfassung abrufen

GET /sensor-readings/:sensorId/summary

Zusammenfassung der letzten Messwerte.

Parameter
sensorId (number) - ID des Sensors

Response (200)
{
  "sensorId": 1,
  "latest": {
    "value": 23.5,
    "timestamp": "2026-03-04T13:07:59.385Z"
  },
  "stats": {
    "avg": 23.2,
    "min": 22.1,
    "max": 24.3,
    "count": 100
  }
}

GESUNDHEITS CHECK

GET /health

Status des Systems pruefen.

Response (200)
{
  "status": "ok",
  "timestamp": "2026-03-04T13:07:15.000Z",
  "uptime": 337.192998434
}

Fehler Beispiele

401 Unauthorized - JWT Token abgelaufen oder ungueltig

{
  "message": "Unauthorized",
  "statusCode": 401
}

400 Bad Request - Sensor nicht gefunden

{
  "message": "Cannot find sensor",
  "error": "Bad Request",
  "statusCode": 400
}

404 Not Found - Endpunkt nicht vorhanden

{
  "message": "Cannot GET /api/invalid-endpoint",
  "error": "Not Found",
  "statusCode": 404
}

Sicherheit

- Alle Passwörter sind mit bcrypt (Rundennummer 10) gehashed
- JWT Tokens sind 7 Tage gueltig
- Sensible Daten (Passwort-Hashes) werden niemals in Responses zurueck gesendet
- Cross-Origin Resource Sharing (CORS) kann bei Bedarf konfiguriert werden
- HTTPS wird durch Nginx erzwungen

Rate Limiting

Momentan keine Rate Limiting implementiert. Dies sollte bei Produktionsdeployment hinzugefuegt werden.

Pagination

Fuer groessere Datenmengen werden Query Parameter limit und offset unterstuetzt:
GET /sensor-readings/:sensorId?limit=50&offset=100
