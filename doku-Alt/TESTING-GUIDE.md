# Smart Village - Test-Anleitung für neue Features

## Schnell-Test (5 Minuten)

### 1. Gemeinde mit allen Infos registrieren

```bash
# Im Terminal:
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testgemeinde@example.com",
    "password":"TestGemeinde123!",
    "villageName":"Testdorf",
    "municipalityCode":"TV-01",
    "contactEmail":"kontakt@testdorf.de",
    "contactPhone":"+49 123 456789"
  }'

# Expected: HTTP 201, alle Felder im villages array
```

### 2. Login & Admin-Interface öffnen
```bash
# Browser: https://localhost/
# E-Mail: testgemeinde@example.com
# Passwort: TestGemeinde123!
```

### 3. Allgemein-Tab testen
✅ Felder sollten vorausgefüllt sein:
- Ortsname: "Testdorf"
- Gemeinde-ID: "TV-01"
- Kontakt E-Mail: "kontakt@testdorf.de"
- Kontakt Telefon: "+49 123 456789"

✅ Bearbeiten:
- Klick auf "✎ Bearbeiten"
- Ändere Telefonnummer auf "+49 987 654321"
- Test ungültiges Format: "123" → sollte Fehler zeigen (rot)
- Gültig: "+49 (123) 456-789" → sollte OK sein
- Speichern

### 4. Sensoren-Tab testen
✅ Neuen Sensor mit Datenquelle erstellen:
- "+ Neuen Sensor hinzufügen" klicken
- Name: "Temperatur Rathaus"
- Typ: "Temperature" (oder verfügbar)
- Beschreibung: "Im Eingangsbereich"
- API-Endpunkt: `https://api.example.com/sensors/temp1`
- Intervall: `300`
- Speichern

✅ Sensor-Liste sollte neuen Sensor zeigen

### 5. Statistiken-Tab testen
✅ Sollte zeigen:
- "1 Gesamtzahl Sensoren"
- "1 Aktive Sensoren"
- "0 Inaktive Sensoren"
- Tabelle mit:
  - Name: "Temperatur Rathaus"
  - Typ: "Temperature"
  - Status: "✓ Aktiv"

### 6. Module-Tab testen
✅ Sollte 4 Module zeigen:
- Sensoren (enabled)
- Wetterdaten (disabled)
- Nachrichten (disabled)
- Veranstaltungen (disabled)

✅ Versuche:
- Modul aktivieren/deaktivieren
- "Sensoren verwalten" klicken (sollte zu Sensors gehen)

---

## Detaillierte Test-Szenarien

### Szenario 1: Telefonnummer-Validierung

```
Test 1: Gültige Telefonnummern
✅ +49 30 123456789
✅ +49 (30) 123-456-789
✅ 030 123456789
✅ +49301234567890

Test 2: Ungültige Telefonnummern
❌ 123 (zu kurz)
❌ +49 (nur 4 Ziffern)
❌ "abc"
❌ "" (leer - aber optional OK)
```

### Szenario 2: Village-Update API

```bash
# Telefonnummer aktualisieren
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testgemeinde@example.com","password":"TestGemeinde123!"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

curl -X PUT http://localhost:8000/api/villages/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "contactPhone": "+49 456 789123",
    "municipalityCode": "TV-02"
  }'

# Expected: HTTP 200, updated village data
```

### Szenario 3: Sensor mit Datenquelle

```bash
# Sensor erstellen mit API-Quelle
curl -X POST http://localhost:8000/api/sensors/village/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sensorTypeId": 1,
    "name": "Automatisierter Sensor",
    "infoText": "Holt Daten aus externer API"
  }'

# Expected: HTTP 201, sensor created
```

### Szenario 4: Statistics Loading

```
1. Frontend lädt Village-Daten
2. useVillageConfig hook processed Daten
3. StatisticsForm zeigt:
   - Sensor Count
   - Typ-Verteilung
   - Detail-Tabelle
```

---

## Automatisierter Test

### E2E-Test ausführen
```bash
cd /home/leon/smart-village
HTTP_MODE=true node test-scripts/e2e-test.js

# Expected: 9/9 tests passed ✅
```

### Backend Unit-Tests
```bash
cd /home/leon/smart-village/backend
npm test

# Expected: 31 passed, 31 total ✅
```

---

## Troubleshooting

### Problem: Felder sind leer nach Login
**Lösung:** 
- Prüfe ob Village-Daten auf dem Server exist
- Reload die Seite
- Prüfe Browser Console auf Fehler

### Problem: Telefonnummer-Validierung funktioniert nicht
**Lösung:**
- Stelle sicher, dass JavaScript Validierung aktiv ist
- Check die Regex im GeneralSettingsForm
- Mindestens 10 Ziffern erforderlich

### Problem: Statistics Tab zeigt nichts
**Lösung:**
- Erstelle mindestens einen Sensor zuerst
- Reload die Seite
- Prüfe ob config.sensors mit Daten gefüllt ist

### Problem: Module-Tab funktioniert nicht
**Lösung:**
- Prüfe ob config.modules korrekt initialized ist
- Default-Werte sollten loaded sein
- Nicht editierbar - nur Toggle an/aus

---

## Erwartete Ergebnisse

### Login-Prozess
```
1. Register → Village mit Kontaktinfos erstellt ✅
2. Login → Village-Daten geladen ✅
3. Admin UI → Alle Felder prefilled ✅
```

### Data Flow
```
Frontend Input → 
  useVillageConfig() → 
    API Update → 
      Backend Validation → 
        Database Update → 
          Response ✅
```

### Sichtbarkeit
```
Allgemein-Tab:
- Vier neue Felder sichtbar ✅
- Editierbar ✅
- Mit Validierung ✅

Statistiken-Tab:
- Übersicht-Karten ✅
- Typ-Verteilung ✅
- Detail-Tabelle ✅

Module-Tab:
- 4 Module aufgelistet ✅
- Toggle funktioniert ✅
- Info-Box zeigt Hinweis ✅

Sensoren-Tab:
- Neue Felder in Form ✅
- DataSource URL optional ✅
- Update Interval konfigurierbar ✅
```

---

## Performance-Check

### Ladezeiten
```
Admin UI laden: < 2 Sekunden
Village-Daten: < 500ms
Sensors laden: < 500ms
Statistics rendern: < 100ms
```

### API Response Times
```
POST /auth/register: < 1 Sekunde
PUT /villages/:id: < 500ms
GET /villages/:id: < 300ms
```

---

## Bestätigung

Nach allen Tests sollte folgendes funktionieren:

- ✅ Registrierung mit Gemeinde-Infos
- ✅ Kontakt-Email = Login-Email (automatisch)
- ✅ Kontakt-Telefon mit Validierung (min 10 Ziffern)
- ✅ Gemeinde-ID Verwaltung
- ✅ Statistics Tab mit Übersicht
- ✅ Sensor-Konfiguration mit Datenquellen
- ✅ Module-Tab funktionsfähig
- ✅ Alle E2E-Tests bestehen (9/9)
- ✅ Alle Unit-Tests bestehen (31/31)

🎉 **Alle Features getestet und funktionierend!**
