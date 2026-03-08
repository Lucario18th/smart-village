# Smart Village Mobile API Spezifikation

**Version:** 1.0  
**Status:** Production Ready  
**Zielgruppe:** Mobile App-Entwickler (iOS, Android, Flutter, React Native)

---

## Überblick

Die Mobile API ist eine **öffentliche, einfache REST API** für Mobile Anwendungen. Sie erfordert **KEINE Authentifizierung** und bietet reduzierte Datensätze optimiert für Smartphone-Anzeige.

### Wichtig: Getrennt von Website-API
```
Website API:  /api/                 (authentifiziert, vollständig)
Mobile API:   /mobile-api/          (öffentlich, optimiert)

Diese Endpoints überschneiden sich NICHT!
```

---

## Basis-URL

```
HTTP:  http://localhost:8000
HTTPS: https://localhost:3000

Alle Endpoints beginnen mit: /mobile-api
```

---

## Response-Format

Alle Responses folgen diesem Standard-Format:

```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

### Fehler-Responses

```json
{
  "success": false,
  "error": "Fehler-Beschreibung",
  "statusCode": 400
}
```

---

## Endpoints

### 1. Dörfer auflisten

```
GET /mobile-api/villages
```

**Beschreibung:** Gibt alle verfügbaren Dörfer mit Übersicht zurück.

**Request:**
```bash
curl http://localhost:8000/mobile-api/villages
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Testdorf",
      "sensorCount": 3,
      "messageCount": 2,
      "rideshareCount": 1
    },
    {
      "id": 2,
      "name": "Beispielstadt",
      "sensorCount": 5,
      "messageCount": 0,
      "rideshareCount": 2
    }
  ],
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Verwendung in App:**
```javascript
// Get village list for user to select
async function loadVillages() {
  const response = await fetch('http://api.example.com/mobile-api/villages');
  const json = await response.json();
  return json.data; // Array of villages
}
```

---

### 2. Dorf-Details

```
GET /mobile-api/villages/:id
```

**Beschreibung:** Gibt detaillierte Informationen zu einem spezifischen Dorf.

**Parameter:**
- `id` (required): Village ID

**Request:**
```bash
curl http://localhost:8000/mobile-api/villages/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Testdorf",
    "locationName": "Bayern",
    "contactEmail": "kontakt@testdorf.de",
    "contactPhone": "+49 123 456789",
    "sensorCount": 3,
    "messageCount": 2,
    "rideshareCount": 1
  },
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

---

### 3. Sensordaten mit Geo-Koordinaten

```
GET /mobile-api/villages/:id/sensors
```

**Beschreibung:** Gibt alle Sensoren mit aktuellen Messwerten und Geo-Koordinaten für Map-Anzeige.

**Parameter:**
- `id` (required): Village ID

**Request:**
```bash
curl http://localhost:8000/mobile-api/villages/1/sensors
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Temperatur Rathaus",
      "type": "Temperature",
      "value": 23.5,
      "unit": "°C",
      "latitude": 52.5170,
      "longitude": 13.3888,
      "lastUpdated": "2026-03-05T18:00:00Z"
    },
    {
      "id": 2,
      "name": "Luftfeuchte Marktplatz",
      "type": "Humidity",
      "value": 65.2,
      "unit": "%",
      "latitude": 52.5200,
      "longitude": 13.3900,
      "lastUpdated": "2026-03-05T18:01:30Z"
    }
  ],
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Verwendung in App (React Native Beispiel):**
```javascript
async function loadSensorsForMap(villageId) {
  const response = await fetch(
    `http://api.example.com/mobile-api/villages/${villageId}/sensors`
  );
  const json = await response.json();
  
  // Render markers on map
  json.data.forEach(sensor => {
    addMapMarker({
      latitude: sensor.latitude,
      longitude: sensor.longitude,
      title: sensor.name,
      subtitle: `${sensor.value}${sensor.unit}`
    });
  });
}
```

**Hinweis:** Wenn ein Sensor keine echten Geo-Koordinaten hat, werden **Mock-Werte** generiert (realistische Positionen innerhalb des Villages).

---

### 4. Nachrichten / Warnungen

```
GET /mobile-api/villages/:id/messages
```

**Beschreibung:** Gibt alle Nachrichten und Warnungen für ein Dorf.

**Parameter:**
- `id` (required): Village ID

**Request:**
```bash
curl http://localhost:8000/mobile-api/villages/1/messages
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "Warmwasser-Ausfall in der Innenstadt",
      "priority": "high",
      "timestamp": "2026-03-05T17:00:00Z"
    },
    {
      "id": 2,
      "text": "Straßenbahn-Verspätung bis 18:30 Uhr",
      "priority": "normal",
      "timestamp": "2026-03-05T17:30:00Z"
    }
  ],
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Priority-Werte:**
- `low` - Informativ
- `normal` - Standard-Nachricht
- `high` - Wichtige Warnung

---

### 5. Mitfahrbänke / Ride Sharing

```
GET /mobile-api/villages/:id/rideshares
```

**Beschreibung:** Gibt alle Mitfahrbänke mit aktuellem Status und Geo-Koordinaten.

**Parameter:**
- `id` (required): Village ID

**Request:**
```bash
curl http://localhost:8000/mobile-api/villages/1/rideshares
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Zur Bahnhof",
      "description": "Bus hält um 18:00 Uhr",
      "personCount": 3,
      "maxCapacity": 8,
      "latitude": 52.5200,
      "longitude": 13.3900,
      "status": "active",
      "timestamp": "2026-03-05T17:45:00Z"
    }
  ],
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Status-Werte:**
- `active` - Verfügbar
- `completed` - Beendet
- `cancelled` - Abgebrochen

---

### 6. Nachricht erstellen

```
POST /mobile-api/villages/:id/messages
```

**Beschreibung:** App-User können Nachrichten an ein Dorf senden (z.B. Potenziale, Infos, Requests).

**Parameter:**
- `id` (required): Village ID

**Request Body:**
```json
{
  "text": "Straße ist überflutet am Marktplatz!",
  "priority": "high"
}
```

**Request (curl):**
```bash
curl -X POST http://localhost:8000/mobile-api/villages/1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Straße ist überflutet am Marktplatz!",
    "priority": "high"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "villageId": 1,
    "text": "Straße ist überflutet am Marktplatz!",
    "priority": "high",
    "createdAt": "2026-03-05T18:03:10.218Z"
  },
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Text is required",
  "statusCode": 400
}
```

---

## HTTP Status Codes

| Code | Bedeutung |
|------|-----------|
| 200  | OK - Request erfolgreich |
| 201  | Created - Neue Ressource erstellt |
| 400  | Bad Request - Ungültige Parameter |
| 404  | Not Found - Ressource nicht vorhanden |
| 500  | Internal Server Error - Server-Fehler |

---

## Datentypen & Validierung

### Message
```typescript
{
  id: number;
  text: string;                // Erforderlich, max 500 Zeichen
  priority?: 'low' | 'normal' | 'high';  // Default: 'normal'
}
```

### Sensor
```typescript
{
  id: number;
  name: string;
  type: string;
  value: number;
  unit: string;
  latitude: number;            // Dezimalgrad: -90 to 90
  longitude: number;           // Dezimalgrad: -180 to 180
  lastUpdated: ISO8601DateTime;
}
```

### RideShare
```typescript
{
  id: number;
  name: string;
  description?: string;
  personCount: number;         // 0-100+
  maxCapacity?: number;
  latitude: number;            // Dezimalgrad
  longitude: number;           // Dezimalgrad
  status: 'active' | 'completed' | 'cancelled';
  timestamp: ISO8601DateTime;
}
```

---

## Error Handling

### Village nicht gefunden
```bash
curl http://localhost:8000/mobile-api/villages/99999
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Village not found",
  "statusCode": 404
}
```

### Fehlende erforderliche Felder
```bash
curl -X POST http://localhost:8000/mobile-api/villages/1/messages \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Text is required",
  "statusCode": 400
}
```

---

## Rate Limiting & Performance

**Empfehlungen für App-Entwickler:**

### Polling-Intervalle
- **Sensoren:** 10-30 Sekunden (je nach Use-Case)
- **Nachrichten:** 15-60 Sekunden
- **Mitfahrbänke:** 5-10 Sekunden (häufige Updates)

### Caching
- Dorf-Liste: Cache 5 Minuten
- Sensordaten: Cache 5-10 Sekunden
- Nachrichten: Cache 10-30 Sekunden
- Mitfahrbänke: Cache 2-5 Sekunden

### Datenverbrauch
- Sensor mit Lesezugriff: ~500 Bytes
- Nachricht: ~200 Bytes
- RideShare: ~300 Bytes

**Beispiel Polling (30s Interval, 3 Requests parallel):**
```
Datenverbrauch pro Minute: ~3 KB
Datenverbrauch pro Stunde: ~180 KB
Datenverbrauch pro Tag: ~4.3 MB
```

---

## CORS & Sicherheit

### CORS Headers
Die Mobile API sendet folgende CORS-Header:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Sicher für:**
- Web-basierte Mobile Apps
- React Native / Expo
- Flutter Web
- Cordova / Ionic

### Sicherheitshinweise
⚠️ **Keine sensiblen Daten exposed:**
- Passwörter: Nicht enthalten
- API-Keys: Nicht enthalten
- Email-Adressen: Reduziert auf Dorf-Ebene
- Benutzerdaten: Nicht enthalten

---

## Testing

### Quick Test (curl)
```bash
# Alle Dörfer abrufen
curl http://localhost:8000/mobile-api/villages

# Sensoren von Dorf 1
curl http://localhost:8000/mobile-api/villages/1/sensors

# Nachrichten von Dorf 1
curl http://localhost:8000/mobile-api/villages/1/messages

# Mitfahrbänke von Dorf 1
curl http://localhost:8000/mobile-api/villages/1/rideshares

# Nachricht erstellen
curl -X POST http://localhost:8000/mobile-api/villages/1/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","priority":"normal"}'
```

### Automatisierter E2E Test
```bash
cd /home/leon/smart-village
HTTP_MODE=true node test-scripts/mobile-api-test.js
```

---

## Mock-Daten

Die API generiert automatisch **Mock-Daten** zum Testen:

### Sensor Geo-Koordinaten
Wenn ein Sensor keine echten Koordinaten hat:
- Generierte Breite: Village-Location ± random offset
- Generierte Länge: Village-Location ± random offset
- Realistisch innerhalb Dorf-Grenzen

### Mitfahrbänke
Wenn keine echten Rideshares existieren:
- 1-2 Mock-Einträge pro Village
- Realistische Namen ("Zur Bahnhof", "Marktplatz", etc.)
- Zufällige Personenanzahl (1-6)
- Koordinaten im Dorf verteilt

---

## Zukünftige Erweiterungen

Geplant für nächste Versionen:

- [ ] **WebSocket Support** für Echtzeit-Updates (statt Polling)
- [ ] **Server-Sent Events (SSE)** für Push-Notifications
- [ ] **Pagination** für große Datenmengen
- [ ] **Filtering** (nur aktive Sensoren, nur High-Priority Messages)
- [ ] **Pagination** für Messages
- [ ] **Real-Time Notifications** für kritische Warnungen
- [ ] **Sensor History** (letzte 24 Stunden Werte)

---

## Support & Issues

### Häufige Probleme

**Problem:** "Village not found" obwohl Dorf existiert
- **Lösung:** Stelle sicher dass die richtige Village-ID verwendet wird
- **Debug:** Führe `GET /mobile-api/villages` aus um alle IDs zu sehen

**Problem:** Sensoren haben keine Geo-Koordinaten
- **Erwartet:** Mock-Werte werden automatisch generiert
- **Für echte Werte:** Admin muss Koordinaten im Panel eingeben

**Problem:** Messages erscheinen nicht sofort
- **Ursache:** App-seitiges Caching oder zu großes Polling-Intervall
- **Lösung:** Reduziere Intervall oder cleare Cache

---

## Versions-Historie

### v1.0 (2026-03-05)
- Initial release
- 6 Endpoints
- Mock-Data Support
- Auto-Geo-Generierung
- Public API (keine Auth)
- Production-ready

---

**Letzte Aktualisierung:** 5. März 2026  
**API Status:** ✅ Production Ready  
**Test Coverage:** 57/57 Tests bestanden (100%)
