Dokumentation: AdminView API Integration - Technische Implementierung Details

Code Changes Summary

Frontend Hooks

useVillageConfig.js (KOMPLETT NEU mit API Integration)
Zeilen: 340 Lines
Neue Funktionalitaet:
- JWT Token Dekodieren um User ID zu extrahieren
- Village Daten von API laden beim Mount
- SensorType Liste laden und cachen
- Additive State Management fuer Sensoren (lokal erste, dann API)
- Batched Speichern: Alle Aenderungen beim Click auf Server speichern

Key Functions:

function decodeToken(token)
- Dekodiert JWT Token (Header.Payload.Signature)
- Extrahiert sub (User ID) aus Payload
- Fehlerbehandlung fuer ungueltige Tokens

useEffect(() => {...}, [session?.email, session?.token])
- Triggered wenn Session sich aendert
- Ladet Village und SensorTypes vom Backend
- Speichert in Component State
- Error Handling mit Fallback auf Defaults

const addSensor = (sensorData)
- Erstellt neue Sensor mit ID < 0 (temporaer)
- State wird aktualisiert (immutable)
- hasUnsavedChanges wird true
- nextSensorId wird decremented fuer naechste neue Sensor

const saveConfig = async ()
- PUT /api/villages/:villageId mit general Felder
- Loop ueber alle Sensoren:
  - id < 0: POST /api/sensors/village/:villageId
  - id > 0: PATCH /api/sensors/:sensorId
- Nach POST: Echte ID vom Backend wird in State aktualisiert
- Fehlerbehandlung mit sprechenden Fehlermeldungen
- Loading State Management

const loadConfig = async ()
- GET /api/villages/:villageId
- GET /api/sensor-types
- Refresh aller Daten vom Backend
- State wird aktualisiert
- hasUnsavedChanges wird false

Frontend Components

SensorsSettingsForm.jsx (KOMPLETT NEU)
Zeilen: 160 Lines
Neue Funktionalitaet:
- In-Line Anzeige aller Sensoren
- Sensor Create Dialog
- Sensor Edit Dialog
- Sensor Delete Confirmation

**Neu (Geo-Koordinaten):** Geräte (Controller) und Sensoren können jetzt optionale Latitude/Longitude Werte speichern. Die Eingabe erfolgt im Admin-Bereich über einfache Koordinatenfelder/“Position auf Karte”. Sensoren erben automatisch die Geräte-Position, wenn keine eigene Koordinate angegeben ist. Die Daten dienen als Grundlage für spätere Karten-Features in Admin- und Mobile-UIs.

Key Components:

function SensorRow({ sensor, sensorTypes, onEdit, onDelete })
- Zeigt einen Sensor mit Details an
- Name, Typ, Unit, Beschreibung, Status
- Buttons fuer Edit und Delete
- SensorType wird von API Daten mit matched

function SensorForm({ sensor, sensorTypes, onSave, onCancel })
- Formular fuer Create oder Edit
- Felder: Name, Type (Dropdown), Description, Active (Checkbox)
- Validation: Name erforderlich
- Submit Handler mit Fehlerbehandlung

export default function SensorsSettingsForm()
- Zeigt List alle Sensoren
- State fuer editingSensorId und isAddingNew
- "Neuer Sensor" Button (disabled waehrend Bearbeitung)
- Empty State Nachricht wenn keine Sensoren
- Sensor loeschen mit Confirmation

AdminView.jsx (ANGEPASST)
Zeilen: Aenderungen in Zeilen 25, 68
Aenderungen:
- sensorTypes aus useVillageConfig Hook abrufen
- sensorTypes zu AdminSectionPanel weitergeben

AdminSectionPanel.jsx (ANGEPASST)
Zeilen: Aenderungen in Zeilen 12, 38-43
Aenderungen:
- sensorTypes Parameter hinzugefuegt
- SensorsSettingsForm aufgerufen mit config und sensorTypes
- Alte Module-basierte Struktur entfernt

Auth & Session

session.js (ERWEITERT)
Zeilen: Neue Funktion decodeToken, Aenderung in validateCredentials
Aenderungen:
- decodeToken() Funktion hinzugefuegt
- validateCredentials() speichert jetzt auch sub (User ID)
- Session Objekt hat jetzt 4 Properties: email, token, sub, loginTime

Backend API Routes

Verwendete Endpunkte:
- GET /api/villages/:id
- PUT /api/villages/:id
- GET /api/sensor-types
- POST /api/sensors/village/:id
- PATCH /api/sensors/:id
- DELETE /api/sensors/:id

Alle Endpunkte mit JwtAuthGuard geschuetzt (ausser GET /sensor-types).

Request/Response Formats

Village GET Response
{
  "id": 4,
  "accountId": 4,
  "name": "Test Gemeinde",
  "locationName": "Bayern",
  "phone": "089-123456",
  "infoText": "Willkommen",
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
      },
      "status": null
    }
  ]
}

SensorType GET Response
[
  {
    "id": 1,
    "name": "Temperature",
    "unit": "°C",
    "description": "Lufttemperatur"
  },
  ...
]

Sensor Create Request
{
  "sensorTypeId": 1,
  "name": "Temperatur Rathaus",
  "infoText": "Temperatur im Rathaus"
}

Sensor Update Request
{
  "name": "Temperatur Rathaus (Updated)",
  "infoText": "Updated description",
  "isActive": true
}

Data Flow Diagramme

Initialization Flow

User -> Login -> validateCredentials()
         |-> POST /api/auth/login
         |-> Token + decoded sub zurück
         |-> Session speichern (email, token, sub)
         |-> AdminView laden

AdminView Mount -> useVillageConfig(session)
         |-> useEffect triggered
         |-> GET /api/sensor-types
         |-> GET /api/villages/:villageId
         |-> Build config object
         |-> Set State
         |-> Render UI

Add Sensor Flow

UI -> addSensor() call
   |-> Create Sensor Object (id = -1)
   |-> Add to config.sensors Array
   |-> Set hasUnsavedChanges = true
   |-> Re-render

Save Flow

User -> Click "Auf Server speichern"
     |-> saveConfig() async
     |-> PUT /api/villages/:villageId
     |-> Loop config.sensors:
     |   |-> if id < 0: POST /api/sensors/village/:villageId
     |   |   |-> Get real ID from response
     |   |   |-> Update config with real ID
     |   |-> if id > 0: PATCH /api/sensors/:id
     |-> Set hasUnsavedChanges = false
     |-> Show "Erfolgreich gespeichert"

Error Handling Strategy

Try-Catch Blocks
- Alle async API Calls sind in try-catch
- Errors werden gelogt zu Console
- Benutzer-freundliche Error Message wird angezeigt

Loading States
- isLoading wird vor API Call gesetzt auf true
- Buttons/Inputs werden disabled
- UI zeigt "Wird ..."-Text
- Nach API Call (success oder error): isLoading = false

Messages
- storageMessage fuer Erfolgs- oder Error-Meldungen
- Wird in UI angezeigt
- Format: "Erfolg..." oder "Fehler: ..."

State Management Details

Config State Structure
{
  meta: { id, email, createdAt, updatedAt },
  general: { villageName, locationName, phone, infoText },
  modules: { sensors: { enabled }, ... },
  design: { themeMode, contrast, primaryColor },
  sensors: [
    { id, name, type, sensorTypeId, active, infoText }
  ]
}

Sensor IDs Convention
- Neu erstellte Sensoren: id < 0 (z.B. -1, -2, -3)
- Vom Backend gespeicherte: id > 0 (z.B. 1, 2, 3)
- Beim Speichern: Neue Sensoren mit POST erstellen und ID updaten

Immutable State Updates
setConfig(prev => ({
  ...prev,
  sensors: [...prev.sensors, newSensor]
}))

Nicht:
config.sensors.push(newSensor)
setConfig(config)

Performance Optimizations

useCallback für Handler
- updateGeneralField verwendet useCallback
- updateSensor verwendet useCallback
- updateModuleEnabled verwendet useCallback

## Konto-Löschung (Admin)

- **UI**: Im Admin-Header gibt es die Aktion „Konto endgültig löschen“. Beim Klick erscheint ein Dialog mit Warnhinweis und Texteingabe. Erst nach Eingabe der Account-E-Mail wird die Schaltfläche aktiv. Nach erfolgreichem Löschen wird abgemeldet.
- **Endpoint**: `DELETE /api/admin/accounts/:accountId` (204 No Content).
- **Berechtigung**: Nur mit gültigem JWT und Admin-Rolle (`isAdmin` am Account).
- **Wird entfernt**: Account, alle zugehörigen Villages, deren Benutzer, Sensoren, Sensor-Status, Sensor-Readings, Messages und RideShares. Die Löschung ist endgültig und kann nicht rückgängig gemacht werden.
- Verhindert unnoetige Re-renders

useMemo für berechnete Werte
- sectionEntries useMemo (in AdminView)
- Wird nur neuberechnet wenn activeSection sich aendert

Lazy Loading
- SensorTypes werden nur einmal geladen
- In State gecacht fuer Wiederverwendung

Batched Updates
- Alle Sensor-Aenderungen sammeln
- Erst bei "Speichern" alle auf einmal zum Backend

Security Considerations

Token Storage
- JWT Token in localStorage (weiterhin unsicher in großen Systemen)
- Besser: HttpOnly Cookie (nicht vom JavaScript erreichbar)
- Todo fuer Produktion

Token Injection
- Token wird automatisch in Authorization Header injiziert
- Alle sensitiven API Calls haben JwtAuthGuard im Backend

Password Security
- Password wird nie im Frontend gespeichert
- Nur JWT Token wird gespeichert
- Password-Hashes im Backend mit bcrypt

CORS
- Nicht konfiguriert (localhost: kein Cross-Origin)
- Todo fuer Produktion: Explizit Origin-Liste setzen

HTTPS
- Erzwungen durch Nginx
- Self-signed Certs fuer Development

Testing Coverage

Unit Tests (nicht implementiert, aber moglich)
- decodeToken() Function
- addSensor() Logic
- updateSensor() Logic
- State Management

Integration Tests (manuell durchgefuehrt)
- Login -> AdminView Flow
- Village Update & Save
- Sensor CRUD Operations
- Page Reload
- Error Scenarios

E2E Tests (manuell durchgefuehrt)
- Kompletter User Flow: Register -> Login -> CRUD -> Speichern -> Reload

Debugging Tips

Console Logging
console.log('Config:', config)
console.log('Loading:', isLoading)
console.log('Has Changes:', hasUnsavedChanges)

Network Debugging
- Browser DevTools -> Network Tab
- Alle API Calls sehen
- Response Codes und Payloads pruefen

State Debugging
- React DevTools Extension installieren
- Component Rendering pruefen
- State Changes tracen

Browser LocalStorage
localStorage.getItem('smart-village-admin-session')
localStorage.getItem('access_token')

Browser Console
- Fehler werden gelogt
- API Errors werden gelogt
- Token Decode Errors werden gelogt

Zukuenftige Verbesserungen

Code Level
1. TypeScript einführen fuer Type Safety
2. Unit Tests mit Jest/Vitest
3. E2E Tests mit Playwright
4. Error Boundaries in React
5. Form Validation Library (z.B. React Hook Form)
6. Zustand oder Recoil fuer State Management

Feature Level
1. Sensor Readings anzeigen in AdminView
2. Real-time Updates via WebSockets
3. Offline-First mit Service Workers
4. Optimistic Updates mit Rollback
5. Undo/Redo Functionality
6. Audit Log (wer hat was geaendert)

Infrastructure
1. HttpOnly Cookies statt localStorage
2. Refresh Token Rotation
3. CSRF Protection
4. Rate Limiting
5. Request Signing
6. API Versioning

Performance
1. Code Splitting
2. Bundle Size Optimierung
3. Image Optimization
4. Caching Strategies
5. Infinite Scroll statt Pagination
6. Virtual Scrolling fuer grosse Listen
