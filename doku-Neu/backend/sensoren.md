# Sensorverwaltung

## Überblick

Das SensorModule ist für die Verwaltung von Sensoren, Sensortypen und Messwerten zuständig.
Es befindet sich unter `backend/src/sensor/` und stellt mehrere REST-Endpunkte bereit.

Sensoren erfassen Daten wie Temperatur, Luftfeuchtigkeit oder Personenzählungen.
Jeder Sensor gehört zu einer Gemeinde und hat einen Sensortyp, der die Einheit definiert.
Messwerte werden als Zeitreihen gespeichert und können aggregiert abgefragt werden.

## Endpunkte

### Sensor-Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/sensors/village/:villageId` | Nein | Alle Sensoren einer Gemeinde auflisten |
| POST | `/api/sensors/village/:villageId` | Ja (JWT) | Neuen Sensor anlegen |
| GET | `/api/sensors/:sensorId` | Nein | Einzelnen Sensor abrufen |
| PATCH | `/api/sensors/:sensorId` | Ja (JWT) | Sensor aktualisieren |
| DELETE | `/api/sensors/:sensorId` | Ja (JWT) | Sensor löschen |

### Messwert-Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| POST | `/api/sensor-readings/:sensorId` | Nein | Messwert(e) einreichen |
| GET | `/api/sensor-readings/:sensorId` | Nein | Messwerte abfragen (mit Filtern) |
| GET | `/api/sensor-readings/:sensorId/timeseries` | Nein | Aggregierte Zeitreihe abrufen |
| GET | `/api/sensor-readings/:sensorId/summary` | Nein | Zusammenfassung (Min/Max/Avg) |

### Sensortyp-Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/sensor-types` | Nein | Alle Sensortypen auflisten |

## Sensoren

### Sensor auflisten

`GET /api/sensors/village/:villageId`

Gibt alle Sensoren einer Gemeinde zurück.
Jeder Sensor enthält zusätzlich den letzten Messwert (Zeitstempel, Wert und Status), sofern vorhanden.
Das wird im SensorService durch eine zusätzliche Abfrage des letzten SensorReading realisiert.

### Sensor anlegen

`POST /api/sensors/village/:villageId` (JWT erforderlich)

Erstellt einen neuen Sensor für die angegebene Gemeinde.

**Eingabe:**
- `name` (String) – Name des Sensors
- `sensorTypeId` (Int) – ID des Sensortyps
- `deviceId` (Int, optional) – ID des zugehörigen Geräts
- `latitude` (Float, optional) – Breitengrad
- `longitude` (Float, optional) – Längengrad
- `infoText` (String, optional) – Beschreibungstext
- `origin` (String, optional) – `HARDWARE` oder `AI_SERVICE`
- `aiProvider` (String, optional) – KI-Anbieter
- `aiModelName` (String, optional) – KI-Modellname
- `aiConfigJson` (String, optional) – KI-Konfiguration als JSON

**Rückgabe:** Der erstellte Sensor mit Sensortyp und letztem Messwert.

### Sensor aktualisieren

`PATCH /api/sensors/:sensorId` (JWT erforderlich)

Aktualisiert die Felder eines bestehenden Sensors.
Nur die mitgesendeten Felder werden geändert (Partial Update).

### Sensor löschen

`DELETE /api/sensors/:sensorId` (JWT erforderlich)

Löscht den Sensor und alle zugehörigen Messwerte und Statuseinträge.

## Messwerte

### Messwert einreichen

`POST /api/sensor-readings/:sensorId`

Akzeptiert einen einzelnen Messwert oder mehrere Messwerte auf einmal.

**Einzelner Messwert:**
```json
{
  "ts": "2025-01-15T10:30:00Z",
  "value": 23.5,
  "status": "OK",
  "extra": {}
}
```

**Mehrere Messwerte:**
```json
{
  "readings": [
    { "ts": "2025-01-15T10:30:00Z", "value": 23.5 },
    { "ts": "2025-01-15T10:35:00Z", "value": 23.8 }
  ]
}
```

Das Feld `ts` ist der Zeitstempel.
Das Feld `status` ist optional und hat den Standardwert `OK`.
Das Feld `extra` kann zusätzliche Metadaten als JSON enthalten.

**Anmerkung:** Dieser Endpunkt erfordert keine Authentifizierung. Vermutlich wurde das so gelöst, damit IoT-Geräte ohne Token-Verwaltung Daten senden können. Für den Produktionsbetrieb sollte hier eine alternative Absicherung (z. B. API-Key) in Betracht gezogen werden.

### Messwerte abfragen

`GET /api/sensor-readings/:sensorId`

**Query-Parameter:**
- `from` (DateTime, optional) – Startzeitpunkt
- `to` (DateTime, optional) – Endzeitpunkt
- `limit` (Int, optional) – Maximale Anzahl der Ergebnisse
- `order` (String, optional) – Sortierung (`asc` oder `desc`)

### Zeitreihen-Aggregation

`GET /api/sensor-readings/:sensorId/timeseries`

Aggregiert Messwerte in Zeitintervalle.
Die Aggregation nutzt die PostgreSQL-Funktion `date_trunc()` für effiziente serverseitige Berechnung.

**Query-Parameter:**
- `bucket` (String) – Intervall: `minute`, `hour`, `day`, `week`, `month`
- `from` (DateTime, optional) – Startzeitpunkt
- `to` (DateTime, optional) – Endzeitpunkt

**Rückgabe:** Eine Liste von Datenpunkten mit Zeitstempel und Durchschnittswert pro Intervall.

Vermutlich wird TimescaleDB hier genutzt, weil die Zeitreihen-Aggregation direkt in der Datenbank deutlich effizienter ist als eine Berechnung im Anwendungscode.

### Zusammenfassung

`GET /api/sensor-readings/:sensorId/summary`

Berechnet statistische Kennwerte über einen Zeitraum.

**Query-Parameter:**
- `from` (DateTime, optional) – Startzeitpunkt
- `to` (DateTime, optional) – Endzeitpunkt

**Rückgabe:**
- `min` – Kleinster Messwert
- `max` – Größter Messwert
- `avg` – Durchschnitt
- `count` – Anzahl der Messwerte
- `last` – Letzter Messwert mit Zeitstempel

## Sensortypen

`GET /api/sensor-types`

Gibt alle verfügbaren Sensortypen zurück, sortiert nach Name.
Sensortypen definieren, welche Art von Daten ein Sensor erfasst.

Beispiele für Sensortypen:
- Temperatur (Einheit: °C)
- Luftfeuchtigkeit (Einheit: %)
- Mitfahrbank (Einheit: Personen)

## Entwurfsentscheidungen

**Warum sind Lese-Endpunkte ohne Authentifizierung?**
Vermutlich wurde dies so umgesetzt, damit Sensordaten auch von externen Systemen oder der öffentlichen Karte abgefragt werden können, ohne einen Login zu erfordern. Schreibende Operationen (Anlegen, Ändern, Löschen von Sensoren) erfordern dagegen einen JWT-Token.

**Warum separate Endpunkte für Messwerte?**
Die Messwert-Endpunkte sind vom Sensor-CRUD getrennt. Das ermöglicht eine unabhängige Skalierung und verhindert, dass große Datenmengen bei einfachen Sensor-Abfragen mitgeladen werden.

## Abhängigkeiten

Das SensorModule enthält:
- SensorService – CRUD-Operationen für Sensoren
- SensorReadingService – Messwerte speichern und abfragen
- SensorController – HTTP-Endpunkte für Sensoren
- SensorReadingController – HTTP-Endpunkte für Messwerte
- SensorTypeController – HTTP-Endpunkt für Sensortypen

Abhängigkeit auf PrismaService für alle Datenbankzugriffe.
Der SensorService wird auch vom VillageModule und MqttModule verwendet.
