Dokumentation: Frontend API Integration - Smart Village System

Uebersicht

Das Smart Village Frontend kommuniziert mit dem Backend ueber eine zentrale API Client Schicht. Alle HTTP-Requests gehen durch einen einzigen Punkt, der JWT-Token-Management, Error-Handling und Request-Formatierung uebernimmt.

Dateistruktur

website/src/
  api/
    client.js                - Zentrale API Client Schicht
  auth/
    session.js               - Session Management
    accounts.js              - Auth Hints und Konfiguration
  hooks/
    useAdminAuth.js          - Auth Hook mit Login/Logout
    useVillageConfig.js      - Village Config Hook mit API Integration
  components/
    LoginView.jsx            - Login und Registrierung
    RegisterView.jsx         - Registrierungs Dialog
    AdminView.jsx            - Admin Interface
    admin/
      AdminNavigation.jsx    - Navigations Komponente
      AdminSectionPanel.jsx  - Sektion Anzeige

API Client Schicht (api/client.js)

Der API Client ist das Herzstück der Frontend-Backend Kommunikation. Er:
- Verwaltet JWT Tokens in localStorage
- Injeciert Token automatisch in alle Requests
- Haendelt Error-Responses zentral
- Formatiert Request und Response Payloads
- Bietet typsichere Methoden fuer alle Endpunkte

Aufbau

const apiClient = {
  async request(method, endpoint, data = null) {
    // Zentrale Request Handler Funktion
  },

  auth: {
    register(email, password) { ... },
    login(email, password) { ... },
    getMe() { ... }
  },

  villages: {
    get(id) { ... },
    update(id, data) { ... }
  },

  sensors: {
    listByVillage(villageId) { ... },
    create(villageId, data) { ... },
    get(sensorId) { ... },
    update(sensorId, data) { ... },
    delete(sensorId) { ... }
  },

  sensorTypes: {
    list() { ... }
  },

  sensorReadings: {
    create(sensorId, data) { ... },
    list(sensorId, options) { ... },
    getTimeseries(sensorId, options) { ... },
    getSummary(sensorId) { ... }
  }
}

Token Management

Der Token wird automatisch in localStorage unter dem Key access_token gespeichert.

// Token setzen (wird durch Login gemacht)
localStorage.setItem('access_token', token)

// Token werden automatisch in alle Requests injiziert
Authorization: Bearer <token>

// Token loeschen (beim Logout)
localStorage.removeItem('access_token')

Authentifizierung (auth/session.js)

Die Session.js Datei haendelt die Benutzersession:

const session = {
  async register(email, password) {
    const response = await apiClient.auth.register(email, password)
    // Token wird in localStorage gespeichert
    return { success: true, user: response }
  },

  async login(email, password) {
    const response = await apiClient.auth.login(email, password)
    // Token wird in localStorage gespeichert
    return { success: true }
  },

  async logout() {
    // Token aus localStorage entfernen
    localStorage.removeItem('access_token')
  },

  async getCurrentUser() {
    return await apiClient.auth.getMe()
  }
}

Auth Hook (hooks/useAdminAuth.js)

Der useAdminAuth Hook verwaltet den Login/Logout und Session State:

const { session, login, logout, isLoading, error } = useAdminAuth()

// Login
const result = await login({ email: 'user@example.com', password: 'pass' })

// Logout
logout()

Session Object
{
  email: "user@example.com",
  token: "jwt_token_string",
  sub: 2
}

Village Config Hook (hooks/useVillageConfig.js)

Der useVillageConfig Hook verwaltet die Gemeindekonfiguration und Sensoren:

const {
  config,              // Aktuelle Konfiguration
  hasUnsavedChanges,  // Flag fuer Aenderungen
  isLoading,          // Loading State
  storageMessage,     // Feedback Messages
  updateGeneralField, // Allgemeine Felder bearbeiten
  updateModuleEnabled,// Module ein/ausschalten
  addSensor,          // Sensor hinzufuegen
  updateSensor,       // Sensor bearbeiten
  removeSensor,       // Sensor loeschen
  updateDesignField,  // Design Einstellungen
  saveConfig,         // Zum Backend speichern
  loadConfig,         // Von Backend laden
  resetConfig         // Zu Defaults zurueck
} = useVillageConfig(session)

Config Struktur

{
  meta: {
    id: 1,
    email: "user@example.com",
    createdAt: "2026-03-04T13:07:59Z",
    updatedAt: "2026-03-04T13:07:59Z"
  },
  general: {
    villageName: "Musterstadt",
    locationName: "Bayern",
    phone: "089-123456",
    infoText: "Willkommen"
  },
  modules: {
    sensors: { enabled: true },
    weather: { enabled: true },
    news: { enabled: true },
    events: { enabled: false }
  },
  design: {
    themeMode: "light",    // "light" oder "dark"
    contrast: "normal",    // "normal" oder "high"
    primaryColor: "#3498db"
  },
  sensors: [
    {
      id: 1,
      name: "Temperatur Rathaus",
      type: "temperature",
      active: true,
      sensorTypeId: 1
    }
  ]
}

Sensor Management

// Sensor hinzufuegen
addSensor({
  sensorTypeId: 1,
  name: "Neuer Sensor",
  infoText: "Beschreibung"
})

// Sensor aendern
updateSensor(sensorId, {
  name: "Geaenderter Name",
  infoText: "Neue Beschreibung",
  isActive: true
})

// Sensor loeschen
removeSensor(sensorId)

// Alle Aenderungen zum Backend speichern
await saveConfig()

Komponenten Integration

LoginView Component

<LoginView
  onLogin={handleLogin}
  onRegister={handleRegister}
/>

Haendelt Benutzer-Login mit async API Calls. Zeigt Registrierungs-Option.

RegisterView Component

<RegisterView
  onRegister={handleRegister}
  onBack={handleBack}
/>

Registrierungsformular mit Passwort-Validierung.

AdminView Component

<AdminView
  session={session}
  onLogout={logout}
/>

Hauptadmin-Interface. Erfordert session Object mit email und token.

Daten Flow

1. Benutzer Login
   LoginView -> useAdminAuth -> apiClient.auth.login -> Backend
   -> JWT Token in localStorage

2. AdminView Laden
   AdminView -> useVillageConfig(session)
   -> apiClient.villages.get(villageId)
   -> Config in State laden

3. Sensor Hinzufuegen
   AdminView -> addSensor()
   -> State Update (hasUnsavedChanges = true)
   -> User klickt "Speichern"
   -> apiClient.sensors.create()
   -> Backend aktualisiert DB

4. Config Speichern
   AdminView -> saveConfig()
   -> apiClient.villages.update()
   -> Backend speichert alle Aenderungen
   -> storageMessage zeigt Erfolg

Error Handling

Alle API Errors werden zentral in apiClient.request() gehaendelt:

try {
  const response = await apiClient.request(method, endpoint, data)
  return response
} catch (error) {
  if (error.status === 401) {
    // Token abgelaufen - zur Login-Seite
  } else if (error.status === 400) {
    // Validierungsfehler - User anzeigen
  } else if (error.status === 500) {
    // Server Error - Fehler anzeigen
  }
}

In React Komponenten werden Errors in State gespeichert und angezeigt:

const [errorMessage, setErrorMessage] = useState('')

try {
  const result = await onLogin(credentials)
  if (!result.success) {
    setErrorMessage(result.error)
  }
} catch (error) {
  setErrorMessage('Fehler beim Login')
}

LocalStorage

Der Frontend nutzt localStorage fuer:

1. JWT Token
   Key: access_token
   Value: jwt_token_string

2. Village Config (noch lokal, nicht im Backend)
   Key: sv_config_<email>
   Value: JSON serialized config

Token Lifecycle

1. Nach erfolgreicher Anmeldung
   localStorage.setItem('access_token', token)

2. In jedem API Request
   Bearer Token wird automatisch injiziert

3. Nach Logout
   localStorage.removeItem('access_token')

4. Bei Token Ablauf (7 Tage)
   Fehler 401 -> User wird zur Login Seite weitergeleitet

Performance Optimierungen

1. Config wird im Memory gekacht
   - Nur beim Session Load vom Backend laden
   - Lokale Aenderungen nur im State
   - Erst bei "Speichern" an Backend senden

2. Sensoren Lazy Loading
   - Nur geladen wenn erster Zugriff auf Sensor-Sektion
   - Cache in Config State

3. Token Caching
   - Token bleibt in localStorage
   - Wird bei Page Reload automatisch geladen

Best Practices fuer Developers

1. Verwende immer apiClient statt direkter fetch()
2. Nutze Hooks statt direkter State Management
3. Implementiere Loading/Error States in Komponenten
4. Token wird automatisch gehaendelt - nicht manuel anfassen
5. Session Object wird vom Auth Hook bereitgestellt - nicht selbst erstellen

Testing

Zum Testen der API Integration:

1. Registrierung testen
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123!"}'

2. Login testen
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123!"}'

3. Mit Token API testen
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/villages/1

4. Im Frontend testen
   - https://localhost oeffnen
   - Neuen Benutzer registrieren
   - Mit Benutzer anmelden
   - AdminView oeffnen
   - Gemeindedaten bearbeiten
   - "Speichern" klicken
   - DB via Backend bestaetigen
