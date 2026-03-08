Dokumentation: Datenbankschema - Smart Village System

Uebersicht

Die Smart Village Datenbank basiert auf PostgreSQL und wird mit Prisma ORM verwaltet. Das Schema definiert Accounts, Villages, Sensors, SensorTypes und SensorReadings.

Hauptmodelle

ACCOUNT (Benutzer)

Speichert Benutzerinformationen und Authentifizierungsdaten.

Felder
- id (Integer, Primary Key)
  Eindeutige Benutzer-ID, auto-increment
  
- email (String, Unique)
  E-Mail Adresse des Benutzers
  Unique Constraint - nur eine Registrierung pro E-Mail
  
- passwordHash (String)
  Gehashtes Passwort (bcrypt mit 10 Runden)
  Passwort wird nie plain gespeichert
  
- createdAt (DateTime)
  Zeitstempel der Registrierung
  Default: CURRENT_TIMESTAMP
  
- lastLoginAt (DateTime, optional)
  Zeitstempel der letzten Anmeldung
  NULL wenn Benutzer sich nie angemeldet hat

Relationen
- villages (1-to-Many)
  Ein Account kann mehrere Villages haben
  Wird beim Account loeschen nicht geloescht (Fremdschluessel Constraint)

Beispiel Daten
{
  "id": 1,
  "email": "admin@example.com",
  "passwordHash": "$2b$10$...",
  "createdAt": "2026-03-04T10:00:00Z",
  "lastLoginAt": "2026-03-04T13:00:00Z"
}

VILLAGE (Gemeinde)

Repraesentiert eine Gemeinde mit ihren Konfigurationsdaten.

Felder
- id (Integer, Primary Key)
  Eindeutige Gemeinde-ID, auto-increment
  
- accountId (Integer, Foreign Key)
  Referenz zum Account (Besitzer der Gemeinde)
  Constraint: Referenziert Account.id
  
- name (String)
  Name der Gemeinde
  Beispiel: "Musterstadt"
  
- locationName (String)
  Standortbeschreibung
  Beispiel: "Bayern, Deutschland"
  
- phone (String, optional)
  Kontaktnummer der Gemeinde
  Beispiel: "089-123456"
  
- infoText (String, optional)
  Willkommens- oder Informationstext
  Beispiel: "Willkommen in unserer Gemeinde"

Relationen
- account (Many-to-One)
  Bezug zum Besitzer Account
  
- sensors (1-to-Many)
  Sensoren die dieser Gemeinde zugehoeren
  
- users (1-to-Many)
  Benutzer der Gemeinde

Beispiel Daten
{
  "id": 1,
  "accountId": 1,
  "name": "Musterstadt",
  "locationName": "Bayern, Deutschland",
  "phone": "089-123456",
  "infoText": "Willkommen in unserer Gemeinde"
}

SENSOR (Messgeraet)

Repraesentiert ein physisches oder virtuelles Messgeraet.

Felder
- id (Integer, Primary Key)
  Eindeutige Sensor-ID, auto-increment
  
- villageId (Integer, Foreign Key)
  Referenz zur Village
  Constraint: Referenziert Village.id
  
- sensorTypeId (Integer, Foreign Key)
  Referenz zum SensorType
  Constraint: Referenziert SensorType.id
  
- name (String)
  Name des Sensors
  Beispiel: "Temperatur Rathaus"
  
- infoText (String, optional)
  Beschreibung des Sensors
  Beispiel: "Temperatur im Rathaus"
  
- isActive (Boolean, Default: true)
  Gibt an ob der Sensor aktiv ist
  Inactive Sensoren werden nicht gemessen

Relationen
- village (Many-to-One)
  Die Gemeinde zu der dieser Sensor gehoert
  
- sensorType (Many-to-One)
  Der Typ dieses Sensors (Temperature, Humidity, etc.)
  
- readings (1-to-Many)
  Alle Messwerte dieses Sensors

Beispiel Daten
{
  "id": 1,
  "villageId": 1,
  "sensorTypeId": 1,
  "name": "Temperatur Rathaus",
  "infoText": "Temperatur im Rathaus",
  "isActive": true
}

SENSORTYPE (Sensortyp)

Vorgegebene Typen von Sensoren mit ihren Eigenschaften.

Felder
- id (Integer, Primary Key)
  Eindeutige Typ-ID, auto-increment
  
- name (String)
  Name des Sensortyps
  Beispiele: "Temperature", "Humidity", "Pressure"
  
- unit (String)
  Masseinheit fuer Messwerte
  Beispiele: "°C", "%", "hPa"
  
- description (String)
  Beschreibung des Sensortyps
  Beispiel: "Lufttemperatur"

Relationen
- sensors (1-to-Many)
  Alle Sensoren dieses Typs

Vordefinierte Typen
1. Temperature - °C - Lufttemperatur
2. Humidity - % - Luftfeuchte
3. Pressure - hPa - Luftdruck
4. Rainfall - mm - Niederschlag
5. Wind Speed - m/s - Windgeschwindigkeit
6. Solar Radiation - W/m² - Solarstrahlung
7. Soil Moisture - % - Bodenfeuchte
8. CO2 - ppm - Kohlendioxid-Konzentration

Beispiel Daten
{
  "id": 1,
  "name": "Temperature",
  "unit": "°C",
  "description": "Lufttemperatur"
}

SENSORREADING (Sensormessung)

Repraesentiert eine einzelne Messung eines Sensors.

Felder
- id (Integer, Primary Key)
  Eindeutige Mess-ID, auto-increment
  
- sensorId (Integer, Foreign Key)
  Referenz zum Sensor
  Constraint: Referenziert Sensor.id
  
- value (Float)
  Der Messwert
  Beispiel: 23.5 fuer Temperatur
  
- status (Enum "ReadingStatus")
  Status der Messung
  Moegliche Werte:
    - OK: Messung erfolgreich
    - WARNING: Warnung (z.B. Grenzwert erreicht)
    - ERROR: Fehler bei der Messung
  
- timestamp (DateTime)
  Zeitstempel der Messung
  Default: CURRENT_TIMESTAMP

Relationen
- sensor (Many-to-One)
  Der Sensor der diese Messung durchgefuehrt hat

Beispiel Daten
{
  "id": 1,
  "sensorId": 1,
  "value": 23.5,
  "status": "OK",
  "timestamp": "2026-03-04T13:07:59Z"
}

Enumerationen

ReadingStatus

Enum fuer den Status von Sensormessungen.

Werte
- OK - Messung erfolgreich
- WARNING - Warnung/Grenzwert
- ERROR - Fehler

Constraints und Indizes

Primaere Schluessel
- Account.id
- Village.id
- Sensor.id
- SensorType.id
- SensorReading.id

Fremdschluessel
- Village.accountId -> Account.id
- Sensor.villageId -> Village.id
- Sensor.sensorTypeId -> SensorType.id
- SensorReading.sensorId -> Sensor.id

Unique Constraints
- Account.email

Indizes (optional, fuer Performance)
- SensorReading.sensorId (fuer schnelle Queries nach Sensor)
- SensorReading.timestamp (fuer Zeitreihen Queries)
- Village.accountId (fuer schnelle Queries nach Account)

Beispiel Datenbeziehungen

Account "max@example.com" (ID: 1)
  |
  +--> Village "Musterstadt" (ID: 1)
        |
        +--> Sensor "Temperatur Rathaus" (ID: 1)
        |     |
        |     +--> SensorReading (23.5°C, 2026-03-04 13:00)
        |     +--> SensorReading (23.7°C, 2026-03-04 14:00)
        |
        +--> Sensor "Feuchte Rathaus" (ID: 2)
              |
              +--> SensorReading (45.2%, 2026-03-04 13:00)

Datenmigration und Schema Aenderungen

Das Schema wird mit Prisma Migrations verwaltet. Migrations sind in folgendem Verzeichnis:
backend/prisma/migrations/

Wichtige Migrations
- 20260302_initial_schema - Initial Setup
- 20260303_seed_sensor_types - Vordefinierte Sensor Typen
- 20260304_add_reading_status_enum - ReadingStatus Enum hinzugefuegt

Neue Migrations erstellen:
npx prisma migrate dev --name <name>

Schema aendern:
1. Aenderungen in backend/prisma/schema.prisma
2. Migration ausloesen mit: npx prisma migrate dev

Backups

Regelmaessige Backups sind essentiell:

PostgreSQL Backup erstellen:
pg_dump -U postgres smart_village_db > backup.sql

Backup wiederherstellen:
psql -U postgres smart_village_db < backup.sql

Docker Container Backup:
docker exec smartvillage-postgres pg_dump -U postgres smart_village_db > backup.sql

Datensicherheit

- Passwoerter werden niemals plain gespeichert
- Alle Passwort Hashes verwenden bcrypt mit 10 Runden
- Sensible Daten (Hashes) werden in API Responses nicht zurueck gesendet
- Fremdschluessel Constraints verhindern Orphan Daten
- Transaktionen sichern Datenkonsistenz

Performance Tipps

1. Indizes verwenden fuer haeufige Queries
2. Pagination bei grossen Datenmengen
3. Lazy Loading von Relationen in ORM Queries
4. Caching von Sensor Types (aendern selten)
5. Zeitreihen Daten in separaten Tabellen fuer schnelle Aggregation
