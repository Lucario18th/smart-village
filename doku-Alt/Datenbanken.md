# Datenbankarchitektur – Smart Village

## Übersicht

- Ziel: Relationale Datenbank in 3NF für Konten, Dörfer, Nutzer, Sensoren und kontinuierliche Sensordaten.
- Empfohlene DB: PostgreSQL (optional TimescaleDB‑Extension), alternativ SQLite für lokale Tests.

---

## Logische Struktur (3NF)

### 1. Accounts und Dörfer

**accounts**

- `id` (PK)
- `email` (UNIQUE)
- `password_hash`
- `created_at`
- `last_login_at`

**villages**

- `id` (PK)
- `account_id` (FK → accounts.id)
- `name` (Dorfname, optional UNIQUE)
- `location_name` (Ortsname, z.B. Stadt/Gemeinde)
- `phone`
- `info_text`

_Erläuterung:_ Ein Account kann mehrere Dörfer verwalten. Ortsinformationen liegen zentral in `villages`, um Redundanz zu vermeiden.

---

### 2. Nutzer im Dorf

**users**

- `id` (PK)
- `village_id` (FK → villages.id)
- `email` (UNIQUE)
- `password_hash`
- `display_name`
- `phone`
- `info_text`

_Erläuterung:_ Nutzer sind an ein Dorf gebunden. Trennung von `accounts` und `users` ermöglicht später Rollenmodelle und mehrere Dörfer je Account.

---

### 3. Sensor‑Typen und Sensoren

**sensor_types**

- `id` (PK)
- `name` (z.B. `temperature`, `weight`, `fill_level`)
- `unit` (z.B. `°C`, `kg`, `%`)
- `description`

**sensors**

- `id` (PK)
- `village_id` (FK → villages.id)
- `sensor_type_id` (FK → sensor_types.id)
- `name` (z.B. `trash_bin_1`, `bus_stop_3`)
- `info_text`
- `is_active` (BOOLEAN)

_Erläuterung:_ Sensor‑Typen sind ausgelagert, damit Einheit und Beschreibung nur einmal gepflegt werden. Konkrete Sensoren referenzieren Dorf und Typ.

---

### 4. Sensorstatus

**sensor_status**

- `id` (PK)
- `sensor_id` (FK → sensors.id)
- `status` (z.B. `OK`, `WARN`, `ERROR`)
- `message`
- `updated_at`

_Erläuterung:_ Speichert den aktuellen Zustand eines Sensors. Historische Statusänderungen können bei Bedarf in eine zusätzliche Tabelle ausgelagert werden.

---

### 5. Zeitreihen der Sensordaten

**sensor_readings**

- `id` (PK)
- `sensor_id` (FK → sensors.id)
- `ts` (TIMESTAMP WITH TIME ZONE)
- `value` (NUMERIC / DOUBLE PRECISION)
- `status` (optional, z.B. `OK`, `WARN`, `ERROR`)
- `extra` (JSONB, optional für zusätzliche Metadaten je Messung)

_Erläuterung:_ Alle Messwerte werden als Zeitreihe gespeichert. Typische Abfragen: Verläufe, Durchschnitte, Min/Max, Fehlersuche.

---

## Normalisierung (3NF)

- Jedes Attribut hängt nur vom Primärschlüssel seiner Tabelle ab.
- Wiederholende Informationen (z.B. Einheiten, Ortsnamen) sind ausgelagert in:
  - `sensor_types` (Typ/Einh./Beschreibung)
  - `villages` (Ortsname, Kontaktdaten)
- Wichtige Fremdschlüssel:
  - `villages.account_id` → `accounts.id`
  - `users.village_id` → `villages.id`
  - `sensors.village_id` → `villages.id`
  - `sensors.sensor_type_id` → `sensor_types.id`
  - `sensor_status.sensor_id` → `sensors.id`
  - `sensor_readings.sensor_id` → `sensors.id`

Damit werden Redundanzen minimiert und Inkonsistenzen vermieden.

---

## Indexierung und Performance

Empfohlene Indexe:

- `sensor_readings(sensor_id, ts DESC)`  
  - Schnelle Abfragen von Verläufen und letzten Werten pro Sensor.
- `sensor_readings(ts)`  
  - Zeitbasierte Auswertungen über alle Sensoren.
- `users.email`, `accounts.email` (UNIQUE Index)  
  - Schnelle Authentifizierung und Sicherstellung der Eindeutigkeit.

---

## Physische Umsetzung / Technologien

**Relationale Stammdaten**

- DB: PostgreSQL (oder SQLite für Prototyp)
- Tabellen: `accounts`, `villages`, `users`, `sensor_types`, `sensors`, `sensor_status`, `sensor_readings`
- Vorteile:
  - Ideal für 3NF und JOINs.
  - Gute Unterstützung für `JSONB` (Feld `extra`).

**Zeitreihenoptimierung (optional)**

- Option 1: Reines PostgreSQL  
  - Für kleine bis mittlere Datenmengen ausreichend.
- Option 2: TimescaleDB‑Extension  
  - Optimiert `sensor_readings` als Hypertable (Retention, Kompression, bessere Zeitreihenabfragen).

**Lokale Entwicklung**

- SQLite mit identischem Schema:
  - Sehr leichter Start auf einem Mini‑PC.
  - Späterer Wechsel zu PostgreSQL problemlos möglich.

---

## Tabellenübersicht

| Ebene           | Tabelle           | Zweck                                      |
|----------------|-------------------|--------------------------------------------|
| Auth / Konten  | `accounts`        | Logins und Kontenverwaltung                |
| Dörfer         | `villages`        | Dörfer/Standorte eines Accounts            |
| Nutzer         | `users`           | Nutzer pro Dorf                            |
| Sensor‑Meta    | `sensor_types`    | Sensortyp, Einheit, Beschreibung           |
| Sensoren       | `sensors`         | Konkrete Sensoren in Dörfern               |
| Status         | `sensor_status`   | Aktueller Zustand eines Sensors            |
| Zeitreihen     | `sensor_readings` | Historische Messwerte mit Zeitstempel      |
