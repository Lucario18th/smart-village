Dokumentation: AdminView API Integration - Vollstaendige Implementierung

Uebersicht

Die AdminView ist nun vollstaendig mit der REST API integriert. Alle Daten werden direkt vom Backend geladen und gespeichert. Benutzer koennen Gemeindedaten und Sensoren via Web-Interface verwalten.

Implementierte Features

1. Village Management
   - Gemeindedaten beim Start laden
   - Name, Location, Phone, InfoText aenderbar
   - Speichern zum Backend

2. Sensor Management
   - Alle Sensoren einer Gemeinde anzeigen
   - Neue Sensoren erstellen
   - Sensoren bearbeiten (Name, Typ, Beschreibung, Status)
   - Sensoren loeschen
   - Lokal temporaere Aenderungen, Batch-Speichern zum Backend

3. Sensor Types
   - Alle verfuegbaren Sensor-Typen laden
   - In Dropdown zur Auswahl anzeigen
   - Unit und Beschreibung anzeigen

4. Session Management
   - JWT Token aus Login speichern
   - Token automatisch in API Calls injecieren
   - Account ID (sub) aus Token extrahieren
   - Auf Logout Token loeschen

Architektur

Frontend Komponenten

LoginView.jsx
- Benutzer-Login und Registrierung
- Calls validateCredentials() aus session.js

AdminView.jsx
- Hauptadmin-Interface
- Ladet useVillageConfig Hook mit session
- Zeigt verschiedene Sektionen (General, Sensoren, Design, Module)
- Buttons: Von Server laden, Auf Server speichern, Zuruecksetzen

AdminSectionPanel.jsx
- Zeigt aktuelle Sektion an
- Ruft richtige Form auf basierend auf Section ID

SensorsSettingsForm.jsx
- Zeigt alle Sensoren einer Gemeinde
- "Neuer Sensor" Button
- In-line bearbeitung oder Popup-Form
- Loeschen mit Confirmation

React Hooks

useAdminAuth.js
- Verwaltet Login/Logout
- Speichert Session in localStorage
- Gibt session Object mit email, token, sub

useVillageConfig.js (KOMPLETT NEU MIT API)
- Ladet Village Daten beim Start
   - GET /api/villages/:villageId
   - GET /api/sensor-types
- Speichert lokale Aenderungen im State
- Beim Speichern zum Backend:
   - PUT /api/villages/:villageId
   - Neue Sensoren: POST /api/sensors/village/:villageId
   - Geaenderte: PATCH /api/sensors/:sensorId
   - Geloeschte: DELETE /api/sensors/:sensorId

API Client

apiClient.villages.get(id)
- GET /api/villages/:villageId
- Ladet Gemeinde mit allen Sensoren
- Response:
  {
    id, accountId, name, locationName, phone, infoText,
    sensors: [{ id, villageId, sensorTypeId, name, infoText, isActive, sensorType }]
  }

apiClient.villages.update(id, data)
- PUT /api/villages/:villageId
- Request: { name?, locationName?, phone?, infoText? }
- Aktualisiert Gemeindedaten

apiClient.sensorTypes.list()
- GET /api/sensor-types
- Response: [{ id, name, unit, description }]

apiClient.sensors.create(villageId, sensorTypeId, name, infoText)
- POST /api/sensors/village/:villageId
- Response: { id, villageId, sensorTypeId, name, infoText, isActive }

apiClient.sensors.update(sensorId, data)
- PATCH /api/sensors/:sensorId
- Request: { name?, infoText?, isActive? }

apiClient.sensors.delete(sensorId)
- DELETE /api/sensors/:sensorId

Session Management

Session Object (localStorage)
{
  email: "user@example.com",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  sub: 4,
  loginTime: "2026-03-04T13:00:00Z"
}

Token wird bei jedem API Call automatisch injiziert:
Authorization: Bearer eyJhbGciOi...

Token enthaelt:
{
  sub: 4,           // Account/Village ID
  email: "user@...",
  iat: 1772632107,
  exp: 1773236907   // 7 Tage Gueltigkeitsdauer
}

Datenfluss

Beim App Start
1. readSession() prueft localStorage auf Token
2. Wenn vorhanden: User ist angemeldet
3. AdminView wird geladen

Beim Login
1. User gibt Email und Passwort ein
2. validateCredentials() calls POST /api/auth/login
3. Backend gibt Token zurueck
4. Token wird dekodiert um sub zu extrahieren
5. Session mit email, token, sub wird gespeichert
6. useAdminAuth gibt session zurueck
7. AdminView wird geladen

Beim AdminView Mount
1. useVillageConfig(session) initialisiert
2. useEffect triggered wegen session change
3. GET /api/sensor-types aufgerufen
4. GET /api/villages/:villageId aufgerufen (villageId = session.sub)
5. Daten in State gespeichert
6. UI rendert mit Daten

Beim Sensor hinzufuegen
1. User klickt "Neuer Sensor"
2. Form oeffnet
3. User gibt Daten ein und klickt "Speichern"
4. addSensor() wird aufgerufen
5. Sensor wird mit ID = -1 (temporaer) in State eintragen
6. hasUnsavedChanges wird true
7. "Auf Server speichern" Button wird enabled

Beim Server speichern
1. User klickt "Auf Server speichern"
2. saveConfig() wird aufgerufen
3. PUT /api/villages/:villageId mit general Daten
4. Fuer jeden Sensor:
   a. Wenn id < 0: POST /api/sensors/village/:villageId
   b. Wenn id > 0: PATCH /api/sensors/:id
5. Nach jedem POST: Sensor ID wird aktualisiert mit echter ID vom Backend
6. Loeschwarten sind nicht mehr im config.sensors Array
7. hasUnsavedChanges wird false
8. storageMessage zeigt "Erfolgreich gespeichert"

Error Handling

API Error werden in try-catch gefangen:
- HTTP 400: Bad Request Error-Message anzeigen
- HTTP 401: Unauthorized -> Zur Login Seite
- HTTP 404: Not Found -> Error Message
- HTTP 500: Server Error -> Error Message anzeigen

Fehler werden in storageMessage angezeigt und in Console gelogt.

Loading States

isLoading Flag wird gesetzt waehrend:
- Villages/SensorTypes laden
- Beim Speichern
- Beim Reload

UI Elemente werden disabled waehrend Loading:
- Buttons
- Form Inputs
- Navigation

Button Text zeigt Loading Status:
- "Von Server laden" -> "Wird geladen..."
- "Auf Server speichern" -> "Wird gespeichert..."

Testing

Manuelle Tests (durchgefuehrt)

1. Registration & Auto-Login
   - Neuer Benutzer: user1@example.com / Pass123!
   - AdminView ladet automatisch
   - Kein Error angezeigt

2. Village Update
   - Name aendern: "API Test Gemeinde"
   - Location aendern: "Test Region"
   - Speichern klicken
   - Backend speichert korekt

3. Sensor Create
   - Neuer Sensor hinzufuegen
   - Name: "API Test Sensor"
   - Typ: Temperature
   - Speichern klicken
   - Sensor wird mit echter ID zurückgegeben

4. Sensor Update
   - Sensor Name aendern: "Updated Sensor Name"
   - Speichern klicken
   - Backend speichert korekt

5. Sensor List
   - Multiple Sensoren anzeigen
   - Alle Sensoren mit Type und Unit korrekt angezeigt

6. Sensor Delete
   - Sensor loeschen
   - Speichern klicken
   - Sensor wird vom Backend geloescht

7. Page Reload
   - Nach Speichern Page F5 drücken
   - AdminView ladet neu mit allen Daten vom Backend
   - Keine Datenverluste

API Test Ergebnisse

All Tests PASSED (7/7)

POST /auth/register      -> 200 OK
POST /auth/login          -> 200 OK (gibt Token)
GET /sensor-types         -> 200 OK (8 Typen)
PUT /villages/:id         -> 200 OK
POST /sensors/village/:id -> 201 Created
PATCH /sensors/:id        -> 200 OK
DELETE /sensors/:id       -> 200 OK

Bekannte Einschraenkungen

1. Village Config Module Settings
   - Module Enable/Disable noch nicht mit API verbunden
   - Nur lokal im State
   - Beim Reload gehen Aenderungen verloren
   - Todo: Backend Endpunkt fuer Module Einstellungen

2. Sensor Readings
   - Sensordaten (Messwerte) werden nicht angezeigt
   - Todo: Sensor Readings UI in AdminView

3. Gleichzeitige Benutzer
   - Keine Konflikt-Erkennung bei mehreren Benutzern
   - Letzte Aenderung gewinnt
   - Todo: Optimistische Lock oder Konflikt-Dialoge

4. Backup/Undo
   - Keine Undo-Funktionalitaet
   - "Zuruecksetzen" ladet von Server neu, nicht Undo lokal

Best Practices fuer Weitere Entwicklung

1. Immer Fehler behandeln mit try-catch
2. Loading States setzen vor API Calls
3. hasUnsavedChanges flag fuer alle Aenderungen
4. localStorage nur fuer Session, nicht Config
5. useCallback fuer Handler um Render Zyklen zu sparen
6. Immutable Updates im State (nicht mutieren)
7. Token Lifecycle managen (ablaufen nach 7 Tagen)

Performance

- Daten werden auf Mount geladen und gecacht
- Aenderungen erfolgen lokal im State
- Nur bei "Speichern" werden API Calls gemacht
- Sensor Types werden einmal geladen und wiederverwendet
- Keine perpetual Polling oder Real-time Updates

Sicherheit

- JWT Token wird in localStorage gespeichert
- Token wird bei jedem API Call verwendet (Authorization Header)
- Password wird nicht im Frontend gespeichert (nur JWT Token)
- Sensitive Daten (Passwort Hash) werden nicht vom Backend gesendet
- CORS ist nicht konfiguriert (lokal ok, Produktion beachten)
- HTTPS wird durch Nginx erzwungen

Zukuenftige Verbesserungen

1. Real-time Sync via WebSockets
2. Offline-First Synchronisation
3. Konflikterkennung und Merging
4. Undo/Redo Stack
5. Sensor Readings im AdminView
6. Bulk Import/Export
7. Multi-Language Support
8. Advanced Filtering und Search
9. Sensor Alerts und Monitoring
10. Analytics und Dashboards
