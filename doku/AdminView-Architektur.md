Dokumentation: AdminView Architektur - Smart Village System

Uebersicht

Das AdminView ist die Hauptbenutzeroberflaeche fuer die Verwaltung von Gemeindedaten und Sensoren. Es wird mit React implementiert und kommuniziert direkt mit dem NestJS Backend ueber REST API.

Architektur Diagramm

Frontend Layer (React Components)
  |
  v
State Management Layer (React Hooks)
  - useAdminAuth: Benutzer Session
  - useVillageConfig: Gemeinde Config & Sensoren
  |
  v
API Client Layer (api/client.js)
  - Zentrale HTTP Request Handler
  - JWT Token Management
  - Error Handling
  |
  v
Backend API Layer (NestJS)
  - Auth Controller
  - Village Controller
  - Sensor Controller
  - SensorType Controller
  |
  v
Data Layer (PostgreSQL)
  - Account, Village, Sensor, SensorReading Tables

Komponenten Hierarchie

App (Root)
  |
  +-- LoginView / RegisterView
  |   |
  |   +-- useAdminAuth Hook
  |
  +-- AdminView (wenn authenticated)
      |
      +-- AdminNavigation
      |   (Sektion Auswahl)
      |
      +-- AdminSectionPanel
      |   (Aktuelle Sektion anzeigen)
      |   |
      |   +-- General Settings Form
      |   +-- Sensors Management
      |   +-- Design Settings
      |   +-- Module Configuration
      |
      +-- State: useVillageConfig Hook

Datenfluss beim Laden

1. Benutzer auf https://localhost gehen
2. App.jsx wird geladen
3. useAdminAuth Hook initialisiert, prueft localStorage fuer Token
4. Wenn Token vorhanden: AdminView wird geladen
5. AdminView initialisiert useVillageConfig mit session.email
6. useVillageConfig laedt Daten:
   a. Village Daten abrufen: GET /api/villages/:villageId
   b. Sensor Types abrufen: GET /api/sensor-types
   c. Sensoren abrufen: GET /api/sensors/village/:villageId
7. Config State wird gesetzt
8. UI rendert mit Daten

Datenfluss beim Speichern

1. Benutzer bearbeitet Feld (z.B. Gemeindename)
2. updateGeneralField() wird aufgerufen
3. Config State wird updated
4. hasUnsavedChanges wird auf true gesetzt
5. UI zeigt "Aenderungen nicht gespeichert" Warning
6. Benutzer klickt "Speichern"
7. saveConfig() wird aufgerufen:
   a. PUT /api/villages/:villageId mit Gemeinde-Daten
   b. Fuer jeden neuen Sensor: POST /api/sensors/village/:villageId
   c. Fuer geaenderte Sensoren: PATCH /api/sensors/:sensorId
   d. Fuer geloeschte Sensoren: DELETE /api/sensors/:sensorId
8. hasUnsavedChanges wird auf false gesetzt
9. storageMessage zeigt "Erfolgreich gespeichert"

Hook: useAdminAuth

Verwaltet Benutzer-Session und Authentifizierung.

State
{
  session: {
    email: "user@example.com",
    token: "jwt_token",
    sub: 3
  },
  isLoading: false,
  error: null
}

Funktionen
- login(credentials): Benutzer anmelden
- logout(): Abmelden, Token loeschen
- register(email, password): Neuer Benutzer

Verwendung in App.jsx
const { session, login, logout } = useAdminAuth()

Hook: useVillageConfig

Verwaltet Gemeindekonfiguration und Sensoren.

State
{
  config: {
    meta: { id, email, createdAt, updatedAt },
    general: { villageName, locationName, phone, infoText },
    modules: { sensors: { enabled }, weather: { enabled } },
    design: { themeMode, contrast, primaryColor },
    sensors: [ { id, name, type, sensorTypeId, active } ]
  },
  hasUnsavedChanges: false,
  isLoading: false,
  storageMessage: "Konfiguration geladen"
}

Funktionen
- updateGeneralField(field, value)
- updateModuleEnabled(moduleId, enabled)
- addSensor(sensorData)
- updateSensor(sensorId, data)
- removeSensor(sensorId)
- updateDesignField(field, value)
- saveConfig(): Aenderungen zum Backend senden
- loadConfig(): Von Backend neu laden
- resetConfig(): Zu Defaults zurueck

Sensor Operationen

Sensor Hinzufuegen

const addSensor = (sensorData) => {
  // 1. Lokal im State als "pending" eintragen
  // 2. Bei saveConfig(): API POST /api/sensors/village/:villageId
  // 3. Echte ID vom Backend bekommen
  // 4. Lokal aktualisieren
}

Sensor Bearbeiten

const updateSensor = (sensorId, data) => {
  // 1. Lokal im State aktualisieren
  // 2. Bei saveConfig(): API PATCH /api/sensors/:sensorId
  // 3. Zu Backend synchen
}

Sensor Loeschen

const removeSensor = (sensorId) => {
  // 1. Aus lokalem State entfernen
  // 2. Bei saveConfig(): API DELETE /api/sensors/:sensorId (wenn echte ID)
  // 3. Von Backend entfernen
}

Fehlerbehandlung

Fehler in API Calls werden gefangen und angezeigt:

try {
  await apiClient.villages.update(villageId, data)
  setStorageMessage("Erfolgreich gespeichert")
} catch (error) {
  setStorageMessage(`Fehler: ${error.message}`)
}

Benutzer sieht Fehler in storageMessage Anzeige.

Loading States

- isLoading wird bei API Calls auf true gesetzt
- Buttons/Inputs werden disabled waehrend Loading
- Benutzer sieht "Wird gespeichert..." Text

Optimierung: Lokale Aenderungen

Statt gleich an Backend zu senden:
- Aenderungen bleiben im lokalen State
- Flag hasUnsavedChanges wird gesetzt
- Erst bei "Speichern" Knopf zum Backend senden
- Das spart API Calls und ist schneller

Anfangsladeprozess

1. useVillageConfig(session) wird initialisiert
2. useEffect mit [session?.email] Dependency
3. Falls session.email vorhanden:
   a. Prueft localStorage fuer gespeicherte Config
   b. Falls gefunden: Mit gespeichertem Config initialisieren
   c. Falls nicht: Mit Defaults initialisieren
4. UI rendert mit Daten
5. Bei Mount: Config wird vom Backend geladen (optional)

LocalStorage Struktur

Key: sv_config_<email>
Value: JSON stringified config object

Beispiel:
{
  "general": { "villageName": "Stadt", ... },
  "modules": { "sensors": { "enabled": true }, ... },
  "design": { "themeMode": "light", ... },
  "sensors": [ { "id": 1, "name": "Sensor1", ... } ]
}

API Endpunkte verwendet von AdminView

Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Village
- GET /api/villages/:villageId
- PUT /api/villages/:villageId

Sensors
- GET /api/sensors/village/:villageId
- POST /api/sensors/village/:villageId
- PATCH /api/sensors/:sensorId
- DELETE /api/sensors/:sensorId

SensorTypes
- GET /api/sensor-types

Fehlerszenarien

1. Token abgelaufen (401)
   - Fehler wird abgefangen
   - Benutzer wird zur Login Seite weitergeleitet

2. Validator Error (400)
   - Error.message wird angezeigt
   - Benutzer kann erneut versuchen

3. Server Error (500)
   - Allgemeine Fehlermeldung anzeigen
   - Logging erfolgt

4. Network Error
   - Verbindungsfehler erkannt
   - Benutzer wird benachrichtigt

Performance Tipps

1. Config State nur aendern wenn noetig
2. useCallback fuer Handler Funktionen verwenden
3. React.memo fuer teure Komponenten
4. Lazy Loading von Sensor Lists bei grossen Mengen
5. Debouncing fuer Text Input Updates

Zukuenftige Erweiterungen

1. Real-time Updates ueber WebSockets
2. Offline-First Synchronisation
3. Conflict Resolution bei concurrent edits
4. Undo/Redo Funktionalitaet
5. Bulk Operations fuer Sensoren
6. Import/Export Funktionalitaet
7. Multi-Language Support
8. Sensor Groups/Categories
