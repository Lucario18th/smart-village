Dokumentation: Schnelluebersicht aller API Endpunkte - Smart Village System

Alle verfuegbaren REST API Endpunkte im Ueberblick.

Authentifizierung & Benutzerverwaltung

POST /api/auth/register
  Neuen Benutzer registrieren
  Body: { email: string, password: string }
  Response: Account Objekt mit Village

POST /api/auth/login
  Benutzer anmelden und JWT Token erhalten
  Body: { email: string, password: string }
  Response: { accessToken: string }

GET /api/auth/me
  Authentifizierten Benutzer Info abrufen
  Header: Authorization: Bearer <token>
  Response: { sub: number, email: string, iat: number, exp: number }

Gemeinde Verwaltung

GET /api/villages/:villageId
  Gemeinde abrufen mit allen Sensoren
  Header: Authorization: Bearer <token>
  Response: Village Objekt mit Sensors Array

PUT /api/villages/:villageId
  Gemeinde aktualisieren
  Header: Authorization: Bearer <token>
  Body: { name?: string, locationName?: string, phone?: string, infoText?: string }
  Response: Aktualisierte Village

Sensor Verwaltung

GET /api/sensors/village/:villageId
  Alle Sensoren einer Gemeinde auflisten
  Response: Array von Sensor Objekten

POST /api/sensors/village/:villageId
  Neuen Sensor erstellen
  Header: Authorization: Bearer <token>
  Body: { sensorTypeId: number, name: string, infoText?: string }
  Response: Erstellter Sensor

GET /api/sensors/:sensorId
  Einzelnen Sensor mit Details abrufen
  Response: Sensor Objekt mit SensorType

PATCH /api/sensors/:sensorId
  Sensor aktualisieren
  Header: Authorization: Bearer <token>
  Body: { name?: string, infoText?: string, isActive?: boolean }
  Response: Aktualisierter Sensor

DELETE /api/sensors/:sensorId
  Sensor loeschen
  Header: Authorization: Bearer <token>
  Response: Geloeschter Sensor

Sensor Typen

GET /api/sensor-types
  Alle verfuegbaren Sensor-Typen auflisten
  Response: Array von SensorType Objekten
  Beispiel Typen:
    - Temperature (°C)
    - Humidity (%)
    - Pressure (hPa)
    - Rainfall (mm)
    - Wind Speed (m/s)
    - Solar Radiation (W/m²)
    - Soil Moisture (%)
    - CO2 (ppm)

Sensor Messwerte

POST /api/sensor-readings/:sensorId
  Neue Sensormessung eintragen
  Header: Authorization: Bearer <token>
  Body: { value: number, status?: string }
  Response: Erstellter SensorReading

GET /api/sensor-readings/:sensorId
  Messwerte eines Sensors auflisten
  Query: limit?: number, offset?: number
  Response: Array von SensorReading Objekten

GET /api/sensor-readings/:sensorId/timeseries
  Messwerte in Zeitintervallen aggregiert
  Query: bucket: string (1h, 1d, 1w, 1m), startDate?: ISO8601, endDate?: ISO8601
  Response: Array mit aggregierten Werten (avg, min, max, count)

GET /api/sensor-readings/:sensorId/summary
  Zusammenfassung der letzten Messwerte
  Response: { latest: {...}, stats: {...} }

System

GET /api/health
  Gesundheitsstatus des Systems pruefen
  Response: { status: "ok", timestamp: ISO8601, uptime: number }

Fehler Responses

400 Bad Request
  Ungueltige Anfrage oder Validierungsfehler
  Response: { message: string, error: string, statusCode: 400 }

401 Unauthorized
  JWT Token fehlt oder ist abgelaufen
  Response: { message: "Unauthorized", statusCode: 401 }

404 Not Found
  Ressource existiert nicht
  Response: { message: string, statusCode: 404 }

500 Internal Server Error
  Serverfehler
  Response: { message: string, error: string, statusCode: 500 }

Authentifizierung Header Format

Alle geschuetzten Endpunkte (*) benoetigen:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Token wird nach erfolgreichem Login vom /auth/login Endpunkt erhalten.

JavaScript Verwendung (Frontend)

Alle API Calls erfolgen ueber api/client.js:

import { apiClient } from './api/client'

// Auth
await apiClient.auth.register(email, password)
await apiClient.auth.login(email, password)
await apiClient.auth.getMe()

// Villages
await apiClient.villages.get(villageId)
await apiClient.villages.update(villageId, { name: 'Stadt' })

// Sensors
await apiClient.sensors.listByVillage(villageId)
await apiClient.sensors.create(villageId, sensorTypeId, name, infoText)
await apiClient.sensors.get(sensorId)
await apiClient.sensors.update(sensorId, { name: 'Neuer Name' })
await apiClient.sensors.delete(sensorId)

// Sensor Types
await apiClient.sensorTypes.list()

// Sensor Readings
await apiClient.sensorReadings.create(sensorId, { value: 23.5, status: 'OK' })
await apiClient.sensorReadings.list(sensorId)
await apiClient.sensorReadings.getTimeseries(sensorId, from, to, bucket)
await apiClient.sensorReadings.getSummary(sensorId)

// Health
await apiClient.health()

curl Beispiele

Registrierung:
curl -X POST https://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

Login (Token abrufen):
curl -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

Mit Token API aufrufen:
TOKEN="eyJh..."
curl -H "Authorization: Bearer $TOKEN" \
  https://localhost/api/villages/1

Alle Sensoren einer Gemeinde:
curl -H "Authorization: Bearer $TOKEN" \
  https://localhost/api/sensors/village/1

Sensor erstellen:
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sensorTypeId":1,"name":"Temperatur"}' \
  https://localhost/api/sensors/village/1

Sensor loeschen:
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://localhost/api/sensors/42

Sensor-Types auflisten:
curl https://localhost/api/sensor-types

System Status pruefen:
curl https://localhost/api/health

URL Format

Alle URLs verwenden folgendes Format:
https://localhost/api/<endpunkt>

Bei direktem Backend-Zugriff (ohne Nginx Reverse Proxy):
http://localhost:8000/api/<endpunkt>

Weitere Dokumentation

- Backend-API.md - Detaillierte API Dokumentation
- Frontend-API-Integration.md - Frontend Integration Guide
- AdminView-Architektur.md - AdminView Architektur
- Datenbank-Schema.md - Datenbankschema
- Implementierungsanleitung.md - Setup und Testing
