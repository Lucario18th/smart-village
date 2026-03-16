# Smart Village - Quick Start Guide

## 1. System Starten

```bash
cd ~/smart-village/infra
docker compose up -d
```

Warten Sie ca. 30 Sekunden bis alle Container HEALTHY sind:
```bash
docker compose ps
```

## 2. Zum Frontend gehen

```
https://localhost/
```

Browser möchte SSL-Warnung zeigen? Das ist normal für Self-Signed Certs in Development.

## 3. Registrieren

- **Email**: beliebig (z.B. max@example.com)
- **Password**: mind. 8 Zeichen mit:
  - 1 Großbuchstabe (A-Z)
  - 1 Zahl (0-9)
  - 1 Sonderzeichen (!@#$%^&*)

Beispiel: `TestPass123!`

Nach Registrierung erfolgt **automatischer Login** → AdminView wird geladen

## 4. Gemeinde verwalten

**Allgemein Tab:**
- Gemeinde Name ändern
- Ort eintragen
- Telefon eintragen
- Info Text eingeben
- **SPEICHERN**: Button "Auf Server speichern" unten

**Sensoren Tab:**
- **Neuer Sensor**: Button clicken
  - Typ auswählen (Temperatur, Luftfeuchtigkeit, etc.)
  - Name eingeben
  - Beschreibung eingeben (optional)
  - Hinzufügen clicken
- **Bearbeiten**: Sensor in Liste clicken
- **Löschen**: Delete Icon in Sensor-Zeile
- **SPEICHERN**: Button "Auf Server speichern" unten

## 5. Test User (für schnelle Tests)

```
Email: test@example.com
Password: TestPassword123!
```

## API Endpunkte (Backend)

```
POST   /api/auth/register        - Neue Benutzer
POST   /api/auth/login           - Login
GET    /api/auth/me              - Aktueller User
GET    /api/villages/:id         - Gemeinde mit Sensoren
PUT    /api/villages/:id         - Gemeinde aktualisieren
GET    /api/sensor-types         - Alle Sensor-Typen
POST   /api/sensors/village/:id  - Neuer Sensor
PATCH  /api/sensors/:id          - Sensor aktualisieren
DELETE /api/sensors/:id          - Sensor löschen
```

## Debugging

### Backend Logs anschauen
```bash
docker compose logs backend -f
```

### Database direkt queryen
```bash
docker compose exec postgres psql -U smartvillage_user -d smartvillage_db
```

```sql
SELECT * FROM villages;
SELECT * FROM sensors;
SELECT * FROM "SensorType";
```

### Browser Console prüfen
- F12 drücken
- Console Tab öffnen
- Keine roten Error Messages sollten sichtbar sein

### API Calls anschauen
- F12 → Network Tab
- Alle API Calls sollten Status 200 oder 201 haben

## Probleme beheben

### "Backend ist nicht erreichbar"
```bash
docker compose restart backend
# oder
docker compose up --build -d backend
```

### "Datenbank-Fehler"
```bash
docker compose restart postgres
docker compose logs postgres
```

### "Session bleibt nicht erhalten"
- Cookies aktivieren im Browser
- localStorage sollte verfügbar sein
- Privatmodus deaktivieren

### "Sensoren werden nicht gespeichert"
- Stelle sicher, dass "Auf Server speichern" geklickt wurde
- Warte bis Loading-Nachricht weg ist
- Refresh die Seite
- Sensoren sollten noch da sein

## Dokumentation

Für mehr Details siehe:
- **PROJEKT-ABSCHLUSS.md** - Vollständiger Überblick
- **AdminView-API-Integration.md** - API Integration Details
- **AdminView-Test-Guide.md** - 14 Test Szenarien
- **AdminView-Technische-Details.md** - Technische Implementation
- **Backend-API.md** - Alle API Endpunkte
- **Implementierungsanleitung.md** - Setup & Installation

## Support

Fehler in den Logs?
```bash
docker compose logs backend | tail -50
```

Alle Containers stoppen:
```bash
docker compose down
```

Alles reset (inklusive Datenbank):
```bash
docker compose down -v
docker compose up -d
```

## Wichtige Keys

- **Gemeinde ID**: Wird beim Login aus JWT Token extrahiert (sub)
- **API Token**: In localStorage unter 'access_token' gespeichert
- **Session**: In localStorage unter 'smart-village-admin-session' gespeichert

## Performance Tips

- Erst alle Änderungen vornehmen, dann einmal speichern
- Don't refresh während Daten geladen werden
- Mehrere Sensoren auf einmal hinzufügen, dann speichern
- Browser Cache clearen bei CSS/Design Problemen (Ctrl+Shift+R)
