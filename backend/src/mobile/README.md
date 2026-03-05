# Mobile API für Smart Village

Die Mobile API ist eine separate API-Ebene, die speziell für Mobile-Anwendungen optimiert ist. Sie ist **völlig unabhängig** von der Website-API und erfordert **KEINE Authentifizierung**.

## Überblick

- **Base URL**: `/mobile-api/`
- **Authentifizierung**: Nicht erforderlich
- **Response Format**: Standard JSON mit `success`, `data` und `timestamp`

## Endpoints

### 1. Dörfer auflisten

**GET `/mobile-api/villages`**

Liefert eine Liste aller Dörfer mit Sensor-Count.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Musterstadt",
      "locationName": "Ortsteil A",
      "infoText": "Beschreibung des Dorfs",
      "sensorCount": 5
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Dorf Details

**GET `/mobile-api/villages/:id`**

Liefert detaillierte Informationen zu einem spezifischen Dorf.

**URL Parameter:**
- `id` (number) - Village ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Musterstadt",
    "locationName": "Ortsteil A",
    "infoText": "Beschreibung",
    "phone": "+49123456789",
    "contactEmail": "contact@dorf.de",
    "contactPhone": "+49123456789",
    "sensorCount": 5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Sensordaten mit Geo-Koordinaten

**GET `/mobile-api/villages/:id/sensors`**

Liefert alle aktiven Sensoren eines Dorfs mit Geo-Koordinaten. Wenn ein Sensor keine echten Koordinaten hat, werden **Mock-Koordinaten** generiert.

**URL Parameter:**
- `id` (number) - Village ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Temperatur Zentrum",
      "infoText": "Außentemperatur",
      "latitude": 48.523,
      "longitude": 7.314,
      "sensorType": {
        "id": 1,
        "name": "Temperature",
        "unit": "°C"
      },
      "status": {
        "status": "OK",
        "message": null
      }
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Hinweis:** Sensoren ohne echte Geo-Koordinaten erhalten generierte Koordinaten basierend auf der Village-ID.

---

### 4. Nachrichten

**GET `/mobile-api/villages/:id/messages`**

Liefert alle Nachrichten eines Dorfs (neueste zuerst).

**URL Parameter:**
- `id` (number) - Village ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "Wichtige Mitteilung",
      "priority": "high",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 5. Mitfahrbänke (RideShares)

**GET `/mobile-api/villages/:id/rideshares`**

Liefert alle aktiven Mitfahrbänke eines Dorfs mit Geo-Koordinaten. Wenn keine echten Einträge vorhanden sind, werden **1-2 Mock-Einträge** generiert.

**URL Parameter:**
- `id` (number) - Village ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mitfahrbank Zentrum",
      "description": "Kostenlose Mitfahrgelegenheit",
      "personCount": 2,
      "maxCapacity": 5,
      "status": "active",
      "latitude": 48.523,
      "longitude": 7.314
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Hinweis:** Wenn keine Mitfahrbänke existieren, werden automatisch Mock-Daten mit Geo-Koordinaten generiert.

---

### 6. Nachricht erstellen

**POST `/mobile-api/villages/:id/messages`**

Erstellt eine neue Nachricht in einem Dorf.

**URL Parameter:**
- `id` (number) - Village ID

**Request Body:**
```json
{
  "text": "Text der Nachricht",
  "priority": "normal"  // optional: "low", "normal", "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "text": "Text der Nachricht",
    "priority": "normal",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Fehler:**
- `400 Bad Request` - Text ist leer oder nur Whitespace

---

## Response Format

Alle Endpoints folgen einem einheitlichen Response-Format:

```typescript
interface ApiResponse<T> {
  success: boolean;     // true bei Erfolg, false bei Fehler
  data: T;             // Die angeforderten Daten oder null bei Fehler
  timestamp: string;   // ISO-8601 Timestamp der Response
}
```

---

## Mock-Daten

### Geo-Koordinaten für Sensoren
- Wenn ein Sensor keine echten Koordinaten hat, werden konsistente Mock-Werte generiert
- Basierend auf der Village-ID für Reproduzierbarkeit
- Bereich: Süddeutschland (ca. 48°N, 7°E mit Offset)

### RideShares
- Wenn ein Dorf keine Mitfahrbänke hat, werden automatisch 1-2 Mock-Einträge generiert
- Mock-Einträge haben negative IDs (z.B. -1, -2)
- Enthalten realistische Geo-Koordinaten und Kapazitätsangaben

---

## Architektur

### Dateien
```
backend/src/mobile/
├── mobile.module.ts          # NestJS Modul
├── mobile.controller.ts      # HTTP Endpoints
├── mobile.service.ts         # Business Logic
├── mobile.controller.spec.ts # Controller Tests
└── mobile.service.spec.ts    # Service Tests
```

### Service-Methoden

```typescript
// Alle Villages mit Sensor-Count
getVillagesSummary(): Promise<VillageResponse[]>

// Detail-Infos für ein Village
getVillageDetail(villageId: number): Promise<VillageDetailResponse>

// Sensoren mit Geo-Koordinaten
getSensorsForVillage(villageId: number): Promise<SensorWithGeo[]>

// Nachrichten
getMessagesForVillage(villageId: number): Promise<MessageResponse[]>

// Mitfahrbänke (mit Mock-Daten)
getRideSharesForVillage(villageId: number): Promise<RideShareWithGeo[]>

// Nachricht erstellen
createMessage(villageId: number, text: string, priority?: string): Promise<MessageResponse>
```

---

## Testing

### Tests ausführen
```bash
npm test -- mobile          # Mobile Tests
npm test -- mobile.service  # Service Tests
npm test -- mobile.controller # Controller Tests
```

### Test-Abdeckung
- 26 Tests insgesamt
- Service-Tests für alle Methoden
- Controller-Tests für alle Endpoints
- Response-Format Validierung
- Error-Handling

---

## Sicherheit

- **KEINE Authentifizierung erforderlich** - API ist public
- Nur aktive Sensoren werden zurückgegeben
- Nur aktive Mitfahrbänke werden zurückgegeben
- Message-Erstellung validiert Village-Existenz

---

## Unterschiede zur Website-API

| Aspekt | Mobile API | Website API |
|--------|-----------|-----------|
| **Authentifizierung** | Nicht erforderlich | JWT Token erforderlich |
| **Base URL** | `/mobile-api/` | `/villages/` |
| **Geo-Koordinaten** | Generiert wenn fehlend | Nicht standard |
| **Mock-Daten** | Für UX/Demo | Nicht vorhanden |
| **Nachrichten** | Nur Lesezugriff + Create | Volle Kontrolle |

---

## Beispiele

### Alle Villages auflisten
```bash
curl http://localhost:3000/mobile-api/villages
```

### Sensoren eines Villages abrufen
```bash
curl http://localhost:3000/mobile-api/villages/1/sensors
```

### Nachricht erstellen
```bash
curl -X POST http://localhost:3000/mobile-api/villages/1/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Neuer Eintrag","priority":"normal"}'
```

---

## Fehlerkodes

- `400 Bad Request` - Ungültige Anfrage (z.B. leerer Text)
- `404 Not Found` - Ressource existiert nicht
- `500 Internal Server Error` - Server-Fehler

Alle Fehler werden auch im `data`-Feld als JSON-Beschreibung zurückgegeben.
