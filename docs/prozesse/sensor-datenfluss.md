# Sensor-Datenfluss

## Überblick

Sensordaten gelangen auf zwei Wegen in das System: über die REST-API und über MQTT.
Dieses Dokument beschreibt beide Wege und erklärt, wie die Daten verarbeitet und gespeichert werden.

## Datenfluss über die REST-API

### Wann und warum wird dieser Weg genutzt?

Der REST-Endpunkt wird verwendet, wenn ein System oder ein Benutzer Messwerte direkt über HTTP einreichen möchte.
Das kann zum Beispiel ein Skript sein, das periodisch Daten von einem Sensor liest und per HTTP an das Backend sendet.

### Ablauf Schritt für Schritt

1. Ein externes System sendet einen POST-Request an `POST /api/sensor-readings/:sensorId`.
2. Der Request enthält den Messwert im JSON-Format:
   ```json
   {
     "ts": "2025-01-15T10:30:00Z",
     "value": 23.5,
     "status": "OK"
   }
   ```
3. Das Backend (SensorReadingController) empfängt die Anfrage.
4. Die Eingabedaten werden validiert.
5. Der SensorReadingService speichert den Messwert in der Tabelle `SensorReading`.
6. Die Antwort enthält den gespeicherten Datensatz mit ID.

Alternativ können mehrere Messwerte auf einmal gesendet werden:
```json
{
  "readings": [
    { "ts": "2025-01-15T10:30:00Z", "value": 23.5 },
    { "ts": "2025-01-15T10:35:00Z", "value": 23.8 },
    { "ts": "2025-01-15T10:40:00Z", "value": 24.1 }
  ]
}
```

### Beteiligte Komponenten

- SensorReadingController (`backend/src/sensor/`)
- SensorReadingService
- Prisma → PostgreSQL (Tabelle SensorReading)

## Datenfluss über MQTT

### Wann und warum wird dieser Weg genutzt?

MQTT ist der bevorzugte Weg für IoT-Geräte, die kontinuierlich Messwerte senden.
MQTT ist leichtgewichtig und verbraucht wenig Bandbreite, was für batteriebetriebene Geräte wichtig ist.

### Ablauf Schritt für Schritt

1. Ein IoT-Gerät sendet eine MQTT-Nachricht an den Mosquitto-Broker.
2. Das Topic hat das Format: `sv/{accountId}/{deviceId}/sensors/{sensorId}`.
3. Die Nachricht enthält den Messwert:
   ```json
   {
     "value": 23.5,
     "ts": "2025-01-15T10:30:00Z",
     "status": "OK",
     "unit": "°C"
   }
   ```
4. Das Backend (MqttService) hat dieses Topic abonniert und empfängt die Nachricht.
5. Aus dem Topic werden Account-ID, Geräte-ID und Sensor-ID extrahiert.
6. Das Backend prüft in der Datenbank:
   - Existiert das Gerät mit der angegebenen `deviceId`?
   - Gehört das Gerät zu einer Gemeinde des angegebenen Accounts?
   - Existiert der Sensor mit der angegebenen ID und gehört er zu diesem Gerät?
7. Bei erfolgreicher Validierung wird der Messwert über den SensorReadingService gespeichert.
8. Zusätzliche Metadaten werden im `extra`-Feld gespeichert:
   ```json
   {
     "unit": "°C",
     "source": "mqtt",
     "timestampSource": "device",
     "raw": { ... }
   }
   ```
9. Wenn die Nachricht keinen Zeitstempel enthält, wird die Serverzeit verwendet und `timestampSource` auf `"server"` gesetzt.

### Fehlerbehandlung bei MQTT

Ungültige Nachrichten werden nicht gespeichert, aber geloggt.
Typische Fehlerszenarien:

| Fehler | Verhalten |
|--------|-----------|
| Unbekanntes Gerät | Nachricht wird verworfen, Logausgabe |
| Unbekannter Sensor | Nachricht wird verworfen, Logausgabe |
| Ungültiges JSON | Nachricht wird verworfen, Logausgabe |
| Fehlendes `value`-Feld | Nachricht wird verworfen, Logausgabe |
| Gerät gehört nicht zum Account | Nachricht wird verworfen, Logausgabe |

### Beteiligte Komponenten

- Mosquitto (MQTT-Broker)
- MqttService (`backend/src/mqtt/`)
- SensorReadingService (`backend/src/sensor/`)
- Prisma → PostgreSQL (Tabellen: Device, Sensor, SensorReading)

## Datenabfrage

### Einzelne Messwerte

Über `GET /api/sensor-readings/:sensorId` können Messwerte mit Filtern abgefragt werden:
- Zeitraum (`from`, `to`)
- Sortierung (`order`: asc/desc)
- Begrenzung (`limit`)

### Zeitreihen-Aggregation

Über `GET /api/sensor-readings/:sensorId/timeseries` können Messwerte aggregiert werden.
Die Aggregation nutzt die PostgreSQL-Funktion `date_trunc()`.

Beispiel: Durchschnittstemperatur pro Stunde der letzten 24 Stunden.
```
GET /api/sensor-readings/1/timeseries?bucket=hour&from=2025-01-14T10:00:00Z&to=2025-01-15T10:00:00Z
```

Antwort:
```json
[
  { "ts": "2025-01-14T10:00:00Z", "avg": 22.3 },
  { "ts": "2025-01-14T11:00:00Z", "avg": 22.8 },
  { "ts": "2025-01-14T12:00:00Z", "avg": 23.1 }
]
```

### Zusammenfassung

Über `GET /api/sensor-readings/:sensorId/summary` können statistische Kennwerte berechnet werden:
- Minimum, Maximum, Durchschnitt
- Anzahl der Messwerte
- Letzter Messwert mit Zeitstempel

## Darstellung im Frontend

Das Frontend zeigt Sensordaten an mehreren Stellen:

**Kartenansicht (MapPanel):**
Sensoren werden als farbcodierte Marker auf der Karte angezeigt.
Die Farbe hängt vom aktuellen Messwert ab (Gradient von Blau/Grün für niedrige Werte bis Rot für hohe Werte).

**Sensorliste (SensorsSettingsForm):**
Jeder Sensor zeigt den letzten Messwert, den Zeitstempel und den Status an.
Für Mitfahrbank-Sensoren wird die Anzahl wartender Personen angezeigt.

**Statistiken (StatisticsForm):**
Zusammenfassende Statistiken über alle Sensoren der Gemeinde.

## Polling und Echtzeit

Das Frontend fragt die Gemeindedaten regelmäßig ab (Polling).
Das Standardintervall beträgt 5 Sekunden.
Bei jedem Abruf werden auch die letzten Messwerte der Sensoren aktualisiert.

Es gibt aktuell keine WebSocket-Verbindung für Echtzeit-Updates.
Die Polling-Lösung wurde vermutlich gewählt, weil sie einfacher zu implementieren ist und für die bisherigen Anforderungen ausreicht.

## Beispiel: Vollständiger Datenfluss

Ein Temperatursensor an einer Wetterstation in Freiburg:

1. Die Wetterstation (`device: weather-freiburg-01`) misst 23.5 °C.
2. Sie sendet per MQTT: Topic `sv/1/weather-freiburg-01/sensors/5`, Payload `{"value": 23.5, "ts": "2025-01-15T10:30:00Z"}`.
3. Mosquitto empfängt die Nachricht und leitet sie an das Backend weiter.
4. Das Backend validiert: Gerät `weather-freiburg-01` existiert, Sensor 5 gehört dazu.
5. Der Messwert wird in der Datenbank gespeichert.
6. 5 Sekunden später fragt das Frontend die Gemeindedaten ab.
7. Der Sensor zeigt nun "23.5 °C" und den Zeitstempel an.
8. Auf der Karte ändert sich die Farbe des Markers entsprechend dem neuen Wert.
