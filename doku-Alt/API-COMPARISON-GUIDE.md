# Website API vs Mobile API - Comparison Guide

**Zweck:** Verstehen der Unterschiede und korrekten Nutzung der beiden APIs

---

## Quick Comparison Table

| Aspekt | Website API (`/api/`) | Mobile API (`/mobile-api/`) |
|--------|----------------------|---------------------------|
| **Authentifizierung** | ✅ Erforderlich (JWT) | ❌ Nicht erforderlich |
| **Zielgruppe** | Web Admin Interface | Mobile Apps |
| **Datenumfang** | Vollständig | Reduziert/Optimiert |
| **Sensoren-Daten** | ID, Name, Readings, Status | ID, Name, Value, Geo, LastUpdate |
| **Geo-Koordinaten** | ❌ Nicht vorhanden | ✅ Automatisch generiert |
| **Benutzer-Management** | ✅ Vorhanden | ❌ Nicht vorhanden |
| **Admin-Funktionen** | ✅ Alle Features | ❌ Keine Admin-Features |
| **Sensoren verwalten** | ✅ Create, Update, Delete | ❌ Nur Read |
| **Nachrichten** | ⏳ Geplant | ✅ Vorhanden |
| **Mitfahrbänke** | ⏳ Geplant | ✅ Vorhanden |
| **Push-Notifications** | ❌ | ⏳ Geplant |
| **Rate Limiting** | Keine | Empfohlen: 100 req/min |
| **Response Format** | Standard REST | `{success, data, timestamp}` |

---

## Endpoint Übersicht

### Website API - Authentifiziert

#### Auth
```
POST   /api/auth/register       (Registrierung)
POST   /api/auth/login          (Login → JWT Token)
```

#### Villages (Dorf-Verwaltung)
```
GET    /api/villages/:id        (Dorf-Details abrufen)
PUT    /api/villages/:id        (Dorf bearbeiten)
```

#### Sensors (Sensor-Verwaltung)
```
GET    /api/sensors/village/:villageId      (Alle Sensoren des Dorfes)
POST   /api/sensors/village/:villageId      (Neuen Sensor erstellen)
GET    /api/sensors/:id                     (Sensor-Details)
PUT    /api/sensors/:id                     (Sensor bearbeiten)
DELETE /api/sensors/:id                     (Sensor löschen)
```

#### Sensor Readings (Messwerte)
```
POST   /api/sensor-readings                 (Messwert hinzufügen)
GET    /api/sensor-readings/:sensorId       (Messwerte abrufen)
```

---

### Mobile API - Öffentlich

#### Villages (Dorf-Übersicht)
```
GET    /mobile-api/villages                 (Alle Dörfer auflisten)
GET    /mobile-api/villages/:id             (Dorf-Details)
```

#### Sensors (Sensordaten mit Geo)
```
GET    /mobile-api/villages/:id/sensors     (Alle Sensoren mit Geo)
```

#### Messages (Nachrichten/Warnungen)
```
GET    /mobile-api/villages/:id/messages    (Nachrichten abrufen)
POST   /mobile-api/villages/:id/messages    (Nachricht erstellen)
```

#### RideShares (Mitfahrbänke)
```
GET    /mobile-api/villages/:id/rideshares  (Mitfahrbänke abrufen)
```

---

## Wann welche API nutzen?

### Website API verwenden wenn:
- ✅ Admin-Panel (Dorf verwalten)
- ✅ Sensor-Konfiguration
- ✅ Messwerte senden/speichern
- ✅ Benutzer-Verwaltung
- ✅ Volle Daten-Kontrolle nötig
- ✅ Authentifizierung verfügbar

### Mobile API verwenden wenn:
- ✅ Mobile App (iOS/Android/Flutter)
- ✅ Nur Sensordaten lesen
- ✅ Map mit Geo-Koordinaten anzeigen
- ✅ Nachrichten/Warnungen
- ✅ Kein Login erforderlich
- ✅ Optimierte Daten für mobile Geräte

---

## Sensor-Daten Vergleich

### Website API Response
```json
{
  "id": 1,
  "villageId": 1,
  "sensorTypeId": 2,
  "name": "Temperatur Rathaus",
  "infoText": "Im Eingangsbereich",
  "isActive": true,
  "createdAt": "2026-03-01T10:00:00Z",
  "status": {
    "id": 1,
    "sensorId": 1,
    "status": "OK",
    "message": "All good",
    "updatedAt": "2026-03-05T18:00:00Z"
  },
  "readings": [
    {
      "id": 100,
      "sensorId": 1,
      "ts": "2026-03-05T18:00:00Z",
      "value": 23.5,
      "status": "OK"
    }
  ]
}
```

### Mobile API Response
```json
{
  "id": 1,
  "name": "Temperatur Rathaus",
  "type": "Temperature",
  "value": 23.5,
  "unit": "°C",
  "latitude": 52.5170,
  "longitude": 13.3888,
  "lastUpdated": "2026-03-05T18:00:00Z"
}
```

**Unterschiede:**
- Website: Vollständige Metadaten & Historie
- Mobile: Nur aktuelle Werte & Geo-Koordinaten
- Mobile: Geo-Koordinaten auto-generiert wenn nicht vorhanden
- Mobile: Letzte Aktualisierung statt vollständige Readings

---

## Authentifizierung

### Website API - Mit JWT Token

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.de","password":"pass123"}'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}

# 2. Token verwenden
curl http://localhost:8000/api/villages/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Mobile API - Ohne Authentifizierung

```bash
# Direkt abrufbar - kein Token nötig!
curl http://localhost:8000/mobile-api/villages

curl http://localhost:8000/mobile-api/villages/1/sensors
```

---

## Response-Format Unterschiede

### Website API - Standard REST

```json
{
  "id": 1,
  "name": "Testdorf",
  "email": "admin@test.de",
  ...direkte Daten...
}
```

### Mobile API - Mit Metadaten

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Testdorf",
    ...
  },
  "timestamp": "2026-03-05T18:03:10.218Z"
}
```

**Vorteil Mobile Format:**
- Klare Fehlerbehandlung (`success: false`)
- Timestamp für Cache-Validierung
- Konsistentes Format für alle Endpoints

---

## Datenfluss-Diagramme

### Website Admin Workflow
```
Admin öffnet Website
    ↓
Login (Email + Passwort)
    ↓
Backend validiert
    ↓
JWT Token generiert
    ↓
Frontend speichert Token
    ↓
Alle weitere Requests mit Authorization Header
    ↓
Admin kann:
  - Dorf bearbeiten
  - Sensoren erstellen/ändern
  - Messwerte sehen
  - Module konfigurieren
```

### Mobile App Workflow
```
User öffnet App
    ↓
Wählt Dorf aus Liste
    ↓
App ruft /mobile-api/villages/:id/sensors auf
    ↓
Keine Authentifizierung erforderlich
    ↓
Sensor-Daten mit Geo-Koordinaten zurück
    ↓
App zeigt:
  - Sensoren auf Map
  - Aktuelle Messwerte
  - Nachrichten
  - Mitfahrbänke
    ↓
Polling alle 10-30s
```

---

## Sicherheit

### Website API
- ✅ JWT Token erforderlich
- ✅ Authentifizierung obligatorisch
- ✅ Autorisierung pro Benutzer
- ✅ Sensible Daten protected
- ✅ Admin-Funktionen gesichert

### Mobile API
- ✅ Public Daten nur
- ✅ Keine Passwörter exposed
- ✅ Keine Benutzer-Infos
- ✅ Keine Admin-Funktionen
- ✅ CORS enabled für Apps
- ⚠️ Kein Rate Limiting (geplant)

---

## Entwickler-Anleitung

### Für Admin-Panel Entwickler
1. Nutze **Website API** (`/api/*`)
2. Implementiere JWT Login
3. Speichere Token lokal
4. Sende Token in Authorization Header
5. Nutze volle CRUD-Operationen

**Beispiel (React):**
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({email, password})
});
const {accessToken} = await response.json();
localStorage.setItem('token', accessToken);

// Nutzen
const sensors = await fetch('/api/sensors/village/1', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Für Mobile App Entwickler
1. Nutze **Mobile API** (`/mobile-api/*`)
2. Keine Authentifizierung nötig
3. Implementiere Polling (10-30s)
4. Cache Daten lokal
5. Nutze Geo-Koordinaten für Maps

**Beispiel (React Native):**
```javascript
// Polling Setup
useEffect(() => {
  const poll = async () => {
    const res = await fetch('/mobile-api/villages/1/sensors');
    const json = await res.json();
    setSensors(json.data);
  };

  poll(); // Initial
  const timer = setInterval(poll, 20000); // Every 20s
  return () => clearInterval(timer);
}, []);

// Render mit Geo
<MapView>
  {sensors.map(s => (
    <Marker
      coordinate={{latitude: s.latitude, longitude: s.longitude}}
      title={s.name}
    />
  ))}
</MapView>
```

---

## Häufige Fehler

### ❌ Fehler 1: Website API in Mobile App verwenden
```javascript
// ❌ FALSCH - Braucht Token, zu viel Daten
fetch('/api/sensors/village/1')

// ✅ RICHTIG - Öffentlich, optimiert
fetch('/mobile-api/villages/1/sensors')
```

### ❌ Fehler 2: Geo-Koordinaten manuell generieren
```javascript
// ❌ FALSCH - Aufwändig, inkonsistent
const lat = Math.random() * 180 - 90;

// ✅ RICHTIG - API macht das automatisch
// Mobile API generiert Geo-Koordinaten
```

### ❌ Fehler 3: Zu häufig polling
```javascript
// ❌ FALSCH - 1 Request/Sekunde = 86.4k/Tag
setInterval(() => fetch(url), 1000);

// ✅ RICHTIG - 1 Request/20s = 4.3k/Day
setInterval(() => fetch(url), 20000);
```

### ❌ Fehler 4: Keine Error Handling
```javascript
// ❌ FALSCH - Crasht bei Fehler
const json = JSON.parse(response);

// ✅ RICHTIG - Fehler behandelt
if (!response.ok) throw new Error(response.status);
const json = await response.json();
if (!json.success) throw new Error(json.error);
```

---

## Migration Guide

### Von Hardcoded Daten zu Mobile API

**Vorher (Hardcoded):**
```javascript
const sensors = [
  { id: 1, name: "Temp", value: 23.5, lat: 52.5, lng: 13.4 },
  { id: 2, name: "Humidity", value: 65, lat: 52.51, lng: 13.41 }
];
```

**Nachher (Mit Mobile API):**
```javascript
const [sensors, setSensors] = useState([]);

useEffect(() => {
  fetch(`/mobile-api/villages/${villageId}/sensors`)
    .then(r => r.json())
    .then(res => setSensors(res.data));
}, [villageId]);
```

**Vorteile:**
- ✅ Echte Daten (nicht hardcoded)
- ✅ Automatische Updates via Polling
- ✅ Zentrale Verwaltung
- ✅ Geo-Koordinaten auto-generiert

---

## Performance-Vergleich

### Website API - Admin Panel
- Requests pro Session: ~50-100
- Durchschnittliche Größe: 5-50 KB
- Polling: Nicht nötig (User-gesteuert)
- Caching: Browser-Standard

### Mobile API - App
- Requests pro Minute: 3-6
- Durchschnittliche Größe: 1-3 KB
- Polling: 10-30s Intervall
- Caching: Lokal empfohlen

**Datenverbrauch Beispiel:**
```
Mobile App mit optimierten Polling:
- 3 Endpoints parallel (Sensoren, Messages, RideShares)
- Interval: 20 Sekunden
- Größe: ~3 KB pro Poll

Pro Tag: 4.3 MB
Pro Monat: 130 MB
Pro Jahr: 1.6 GB
```

---

## Checkliste für API-Nutzung

### Website API Checklist
- [ ] Login mit Email/Passwort implementiert?
- [ ] JWT Token wird gespeichert?
- [ ] Token wird in Authorization Header gesendet?
- [ ] Error Handling für 401 Unauthorized?
- [ ] Token Refresh implementiert?
- [ ] Logout löscht Token?
- [ ] HTTPS verwendet (production)?

### Mobile API Checklist
- [ ] Kein Login/Token erforderlich?
- [ ] Polling mit 10-30s Interval?
- [ ] Lokales Caching implementiert?
- [ ] Error Handling (404, 500)?
- [ ] Geo-Koordinaten werden angezeigt?
- [ ] Offline-Fallback vorhanden?
- [ ] Cleanup bei App-Exit (Timers)?

---

## Support & Resources

### Website API
- Documentation: Siehe bestehende API Docs
- Testing: `/api/` endpoints mit JWT
- Admin: Kontakt Backend-Team

### Mobile API
- Spec: `MOBILE-API-SPEC.md`
- Integration: `APP-INTEGRATION-GUIDE.md`
- Testing: `test-scripts/mobile-api-test.js`
- Support: Siehe Dokumentation

---

**Last Updated:** 5. März 2026  
**Status:** Production Ready ✅
