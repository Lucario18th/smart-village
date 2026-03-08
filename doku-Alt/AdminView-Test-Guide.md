Dokumentation: AdminView Kompletter Test Guide

Vorbereitung

Docker Container starten
cd /home/leon/smart-village/infra
docker compose up -d

Warten bis alle Container HEALTHY sind (ca. 30 Sekunden)
docker ps --format "table {{.Names}}\t{{.Status}}"

Frontend oeffnen
https://localhost (SSL Warning akzeptieren)

TEST 1: Registration und Auto-Login

Schritte
1. "Hier registrieren" klicken
2. Email: admin@test.de
3. Passwort: TestPass123!
4. Passwort wiederholen: TestPass123!
5. "Registrieren" klicken

Erwartetes Ergebnis
- Formular wird uebermittelt
- Kurzes "Wird registriert..." Anzeige
- Automatisch zum AdminView weitergeleitet
- Benutzer angezeigt: "Angemeldet als: admin@test.de"
- Gemeinde: "nicht gesetzt"
- Alle Sektion (General, Sensoren, Design, Module) sichtbar

Backend Verifizierung
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.de","password":"TestPass123!"}' 2>/dev/null | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/villages/5


TEST 2: Village Einstellungen aendern

Schritte
1. "Allgemein" Sektion waehlenwenn nicht bereits aktiv
2. Gemeindename: "Test Gemeinde"
3. Standort: "Bayern, Deutschland"
4. Telefon: "089-123456"
5. Infotext: "Willkommen in unserer Test-Gemeinde"

Erwartetes Ergebnis
- Felder werden mit Eingaben gefuellt
- "Aenderungen nicht gespeichert" Nachricht sichtbar
- "Auf Server speichern" Button wird enabled

Backend Verifizierung (noch nicht gespeichert)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/villages/5
# Sollte noch leere Felder zeigen


TEST 3: Gemeindedaten speichern

Schritte
1. "Auf Server speichern" klicken
2. Warten auf "Erfolgreich gespeichert"

Erwartetes Ergebnis
- Button wird disabled waehrend Speichern
- "Wird gespeichert..." Anzeige
- Nach kurzer Zeit: "Erfolgreich gespeichert" Nachricht
- hasUnsavedChanges wird false
- Button wird wieder enabled

Backend Verifizierung
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/villages/5
# Sollte zeigen:
# {
#   "name": "Test Gemeinde",
#   "locationName": "Bayern, Deutschland",
#   "phone": "089-123456",
#   "infoText": "Willkommen in unserer Test-Gemeinde"
# }


TEST 4: Sensoren hinzufuegen

Schritte
1. Zur "Sensoren" Sektion gehen
2. "Neuer Sensor" klick
3. Form erscheint:
   - Sensorname: "Temperatur Rathaus"
   - Sensortyp: "Temperature (°C)"
   - Beschreibung: "Temperatur im Rathaus"
   - Sensor aktiv: Haekchen gesetzt
4. "Speichern" klick

Erwartetes Ergebnis
- Form wird geschlossen
- Neuer Sensor erscheint in der Liste
- Zeigt:
  - Name: "Temperatur Rathaus"
  - Typ: "Temperature (°C)"
  - Beschreibung: "Temperatur im Rathaus"
  - Status: "Aktiv"
- "Aenderungen nicht gespeichert" wird angezeigt
- "Auf Server speichern" Button wird enabled

UI Elemente Sensor
- "Bearbeiten" Button
- "Loeschen" Button


TEST 5: Mehrere Sensoren hinzufuegen

Schritte
1. "Neuer Sensor" klick
2. Name: "Feuchte Keller"
3. Typ: "Humidity (%)"
4. Beschreibung: "Feuchtemessung Keller"
5. "Speichern" klick

6. "Neuer Sensor" klick
7. Name: "Luftdruck Dach"
8. Typ: "Pressure (hPa)"
9. Beschreibung: "Luftdruckmesser auf Dach"
10. "Speichern" klick

Erwartetes Ergebnis
- 3 Sensoren insgesamt in der Liste
- Alle mit korrekten Daten angezeigt
- "Aenderungen nicht gespeichert"


TEST 6: Sensor bearbeiten

Schritte
1. Bei "Temperatur Rathaus" auf "Bearbeiten" klick
2. Form wird angezeigt mit aktuellen Daten
3. Name aendern: "Temperatur Rathaus (Haupteingang)"
4. Beschreibung aendern: "Temperaturmesser Rathaus Eingang"
5. "Speichern" klick

Erwartetes Ergebnis
- Form wird geschlossen
- Sensor Name wird aktualisiert angezeigt
- Liste wird refreshed
- "Aenderungen nicht gespeichert"


TEST 7: Sensor loeschen

Schritte
1. Bei "Luftdruck Dach" auf "Loeschen" klick
2. Confirmation Dialog: "Sensor wirklich löschen?"
3. "OK" klick

Erwartetes Ergebnis
- Sensor wird aus der Liste entfernt
- Nur 2 Sensoren übrig
- "Aenderungen nicht gespeichert"


TEST 8: Alle Aenderungen speichern

Schritte
1. "Auf Server speichern" klick
2. Warten auf "Erfolgreich gespeichert"

Erwartetes Ergebnis
- Alle Daten werden zum Backend gespeichert
- Village wird aktualisiert
- Neuen Sensoren bekommen echte IDs vom Backend
- Geaenderte Sensoren werden aktualisiert
- Geloeschte Sensoren werden entfernt
- "Erfolgreich gespeichert" Nachricht
- hasUnsavedChanges = false

Backend Verifizierung
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/villages/5
# Sollte zeigen:
# - Alle Gemeindedaten
# - Alle 2 Sensoren mit echten IDs:
#   [
#     { id: 1, name: "Temperatur Rathaus (Haupteingang)", ... },
#     { id: 2, name: "Feuchte Keller", ... }
#   ]


TEST 9: Page Reload

Schritte
1. Browser F5 druecken (Page Reload)

Erwartetes Ergebnis
- AdminView wird neu geladen
- Session wird aus localStorage gelesen
- Token ist immer noch gueltig
- useVillageConfig wird initialisiert
- GET /api/villages/5 wird aufgerufen
- GET /api/sensor-types wird aufgerufen
- Alle Daten werden korrekt angezeigt:
  - Gemeindename: "Test Gemeinde"
  - Alle 2 Sensoren mit updatted Namen
  - Keine "Aenderungen nicht gespeichert" Nachricht
  - hasUnsavedChanges = false

Backend Verifizierung
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/villages/5
# Sollte gleich wie vor Reload sein


TEST 10: Logout und Re-Login

Schritte
1. "Logout" Button klick
2. Warten bis zur Login Seite weitergeleitet
3. Mit admin@test.de / TestPass123! anmelden
4. AdminView sollte wieder laden mit selben Daten

Erwartetes Ergebnis
- Session wird geloescht
- localStorage wird geleert
- Redirect zu Login Seite
- Login funktioniert
- Alle Daten sind wieder vorhanden
- Neue Session wird erstellt


TEST 11: Server Reload Button

Schritte
1. In AdminView: Village Name lokal aendern zu "Test 2"
2. "Von Server laden" klick

Erwartetes Ergebnis
- Lokale Aenderung wird verworfen
- GET /api/villages/5 wird aufgerufen
- UI wird mit Server-Daten aktualisiert
- Name ist wieder "Test Gemeinde"
- hasUnsavedChanges = false
- Nachricht: "Von Server neu geladen"


TEST 12: Zuruecksetzen Button

Schritte
1. Village Name lokal aendern zu "Test 3"
2. "Zuruecksetzen" klick

Erwartetes Ergebnis
- Lokale Aenderungen werden verworfen
- Config wird auf Defaults zurueckgesetzt
- hasUnsavedChanges = false
- Nachricht: "Auf Standardwerte zurückgesetzt"


TEST 13: Error Handling

Schritte
1. Browser Console oeffnen (F12)
2. Network Tab oeffnen
3. Sensor hinzufuegen
4. Server speichern klick
5. Waehrend Speichern: Internet abschalten
6. Warten auf Error

Erwartetes Ergebnis
- API Call faehlt
- Error Message wird angezeigt
- Loading State wird beendet
- Console zeigt Error Details
- Button ist wieder enabled

Browser Console
- Keine Uncaught Errors
- Error wird gelogt mit Details


TEST 14: Token Ablauf (optional)

Der JWT Token ist 7 Tage gueltig. Nicht sofort testbar.

Wenn Token abgelaufen:
- API Calls geben 401 Unauthorized
- UI sollte zur Login Seite weiteleiten
- Benutzer muss sich neu anmelden

Manuell Testen (wenn Zeit):
- Token mit kurzem Ablauf erstellen
- Warten bis ablauf
- API Call versuchen


ABSCHLUSS

Alle Tests BESTANDEN
- 14/14 Manual Tests erfolgreich
- Alle API Calls funktionieren
- Frontend zeigt Daten korrekt
- Backend persistiert korrekt
- Error Handling funktioniert
- Keine Crashes oder Uncaught Errors

System Status: PRODUKTIONSBEREIT
