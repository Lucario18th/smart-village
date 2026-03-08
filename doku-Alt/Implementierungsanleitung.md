Dokumentation: Smart Village API Integration - Implementierungsanleitung

Zusammenfassung der letzten Aenderungen

Das Smart Village System wurde um umfassende API Integration erweitert. Das Backend bietet nun alle notwendigen Endpunkte zur Verwaltung von Gemeinden, Sensoren und Sensordaten. Das Frontend kommuniziert über einen zentralen API Client mit dem Backend.

Implementierte Features

1. Village Management API
   - GET /api/villages/:villageId - Gemeinde abrufen
   - PUT /api/villages/:villageId - Gemeinde aktualisieren

2. Sensor Management API
   - GET /api/sensors/village/:villageId - Sensoren einer Gemeinde
   - POST /api/sensors/village/:villageId - Sensor erstellen
   - PATCH /api/sensors/:sensorId - Sensor aktualisieren
   - DELETE /api/sensors/:sensorId - Sensor loeschen

3. SensorType API
   - GET /api/sensor-types - Alle verfuegbaren Sensor-Typen

4. API Client Erweiterung
   - apiClient.villages.get(id)
   - apiClient.villages.update(id, data)
   - apiClient.sensors.delete(sensorId)
   - apiClient.sensorTypes.list()

Dateistruktur und Aenderungen

Backend Neu
- src/village/village.controller.ts
- src/village/village.module.ts
- src/sensor/sensor-type.controller.ts

Backend Geaendert
- src/app.module.ts (VillageModule registriert)
- src/sensor/sensor.module.ts (SensorTypeController registriert)
- src/sensor/sensor.controller.ts (DELETE Endpunkt, @UseGuards)
- src/sensor/sensor.service.ts (delete Methode)

Frontend Geaendert
- src/api/client.js (villages, sensorTypes, sensors.delete)

Dokumentation Neu
- doku/Backend-API.md - Komplette API Dokumentation
- doku/Frontend-API-Integration.md - Frontend Integration Guide
- doku/Datenbank-Schema.md - Datenbankschema Dokumentation
- doku/AdminView-Architektur.md - AdminView Architektur Guide

Laufen und Testen

Container Start

cd /home/leon/smart-village/infra
docker compose up -d

Alle Container sollten starten und healthy sein:
- smartvillage-postgres: HEALTHY
- smartvillage-backend: HEALTHY
- smartvillage-nginx: HEALTHY (nach ca. 30 Sekunden)

Test-Benutzer erstellen

curl -X POST https://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}'

Login und Token abrufen

curl -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}'

Antwort enthaelt accessToken.

API testen

Gemeinde abrufen:
curl -H "Authorization: Bearer <TOKEN>" \
  https://localhost/api/villages/<VILLAGE_ID>

Sensor-Types abrufen:
curl https://localhost/api/sensor-types

Sensor erstellen:
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"sensorTypeId":1,"name":"Test Sensor"}' \
  https://localhost/api/sensors/village/<VILLAGE_ID>

Frontend testen

1. https://localhost oeffnen
2. "Hier registrieren" klicken
3. Neue E-Mail und Passwort eingeben
4. Registrieren klicken
5. Mit Benutzer automatisch anmelden
6. AdminView sollte oeffnen mit:
   - Benutzer Email angezeigt
   - Sensoren Liste
   - Gemeinde-Einstellungen
7. Gemeindename aendern
8. Unten auf "Server Speichern" klicken
9. Aenderung sollte in DB gespeichert sein

Verifizierung mit Backend

Nach dem Speichern im Frontend:
curl -H "Authorization: Bearer <TOKEN>" \
  https://localhost/api/villages/<VILLAGE_ID>

Die geaenderten Felder sollten in der Response sichtbar sein.

Integration in AdminView (noch zu implementieren)

Die useVillageConfig Hook muss noch aktualisiert werden um:

1. Bei Mount: Village Daten vom Backend laden
   - GET /api/villages/:villageId

2. Bei Sensor-Operation: APIs aufrufen
   - addSensor -> POST /api/sensors/village/:villageId
   - updateSensor -> PATCH /api/sensors/:sensorId
   - removeSensor -> DELETE /api/sensors/:sensorId

3. Beim Speichern: Village Daten aktualisieren
   - PUT /api/villages/:villageId

Die aktuelle useVillageConfig.js hat bereits diese Struktur, nutzt aber noch localStorage. Sie muss mit echten API Calls kombiniert werden.

Security Hinweise

1. JWT Tokens sind 7 Tage gueltig
2. Sensible Daten werden nicht in Responses gesendet
3. Passwort-Hashes sind mit bcrypt geschuetzt
4. HTTPS wird durch Nginx erzwungen
5. CORS ist nicht konfiguriert (lokal ok, aber in Produktion beachten)

Wichtige Environment Variablen

Im Backend Container (wird durch docker-compose gesetzt):
- DATABASE_URL=postgresql://smartvillage:smartvillage@smartvillage-postgres:5432/smartvillage
- JWT_SECRET=... (sollte in .env stehen)
- JWT_EXPIRATION=604800 (7 Tage in Sekunden)

Haendisches Testen Checklist

Backend API
[ ] GET /api/health - Status pruefen
[ ] POST /api/auth/register - Neuer Benutzer
[ ] POST /api/auth/login - Anmelden
[ ] GET /api/auth/me - Benutzer Info
[ ] GET /api/sensor-types - Sensor Typen
[ ] GET /api/villages/:id - Gemeinde laden
[ ] PUT /api/villages/:id - Gemeinde speichern
[ ] POST /api/sensors/village/:id - Sensor erstellen
[ ] GET /api/sensors/village/:id - Sensoren laden
[ ] PATCH /api/sensors/:id - Sensor aktualisieren
[ ] DELETE /api/sensors/:id - Sensor loeschen

Frontend Integration
[ ] Registrierung funktioniert
[ ] Login funktioniert und Token wird gespeichert
[ ] AdminView ladet und zeigt Email
[ ] Gemeindedaten anzeigen
[ ] Gemeindedaten aendern
[ ] Aenderungen speichern
[ ] Aenderungen in DB persist

Kommande Schritte

1. useVillageConfig vollstaendig mit APIs integrieren
2. AdminView Sensor Management UI fertigstellen
3. Error Handling in allen API Calls
4. Loading/Error States in UI
5. Optimistische Updates fuer bessere UX
6. Datenbankmigrationen testen bei Schema Aenderungen
7. Rate Limiting im Backend
8. CORS Konfiguration fuer Produktion
9. Monitoring und Logging
10. Backup/Restore Prozesse dokumentieren

Dateiverweise

Vollstaendige Dokumentation:

Backend API Referenz:
/home/leon/smart-village/doku/Backend-API.md

Frontend Integration Guide:
/home/leon/smart-village/doku/Frontend-API-Integration.md

Datenbankschema:
/home/leon/smart-village/doku/Datenbank-Schema.md

AdminView Architektur:
/home/leon/smart-village/doku/AdminView-Architektur.md

Quellcode:

API Client:
/home/leon/smart-village/website/src/api/client.js

Admin Auth Hook:
/home/leon/smart-village/website/src/hooks/useAdminAuth.js

Village Config Hook:
/home/leon/smart-village/website/src/hooks/useVillageConfig.js

Village Controller:
/home/leon/smart-village/backend/src/village/village.controller.ts

SensorType Controller:
/home/leon/smart-village/backend/src/sensor/sensor-type.controller.ts

Kontakt und Support

Bei Fragen oder Problemen:
1. Logs pruefen: docker logs smartvillage-backend
2. API direkt testen mit curl
3. Browser Developer Tools fuer Frontend Issues
4. Datenbankabfragen pruefen
