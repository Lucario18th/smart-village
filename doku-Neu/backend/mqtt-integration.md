# MQTT-Integration

## Überblick

Das MqttModule verbindet das Backend mit einem MQTT-Broker (Mosquitto).
IoT-Geräte veröffentlichen Sensordaten und Konfigurationsnachrichten über MQTT-Topics.
Das Backend abonniert diese Topics und verarbeitet die eingehenden Nachrichten.

Die Implementierung befindet sich unter `backend/src/mqtt/`.

## Konfiguration

Die MQTT-Verbindung wird über Umgebungsvariablen konfiguriert:

| Variable | Beschreibung | Standardwert |
|----------|-------------|-------------|
| `MQTT_HOST` | Hostname des MQTT-Brokers | mosquitto |
| `MQTT_PORT` | Port des MQTT-Brokers | 1883 |
| `MQTT_USERNAME` | Benutzername (optional) | (leer) |
| `MQTT_PASSWORD` | Passwort (optional) | (leer) |
| `MQTT_TOPIC_PATTERN` | Topic-Muster für Sensordaten | `sv/+/+/sensors/+` |
| `MQTT_DISCOVERY_PATTERN` | Topic-Muster für Discovery | `sv/+/+/config` |

Das Modul wird nur initialisiert, wenn `MQTT_HOST` gesetzt ist.
Beim Start des Backends wird die MQTT-Verbindung hergestellt und die Topics abonniert.

## Topic-Struktur

### Sensordaten-Topic

Format: `sv/{accountId}/{deviceId}/sensors/{sensorId}`

Beispiel: `sv/1/weatherstation-01/sensors/42`

Die Platzhalter `+` im Muster `sv/+/+/sensors/+` bedeuten, dass alle Nachrichten akzeptiert werden, unabhängig von Account-ID, Geräte-ID und Sensor-ID.

### Discovery-Topic

Format: `sv/{accountId}/{deviceId}/config`

Beispiel: `sv/1/weatherstation-01/config`

Über dieses Topic melden sich neue Geräte an und teilen ihre Sensor-Konfiguration mit.

## Datenformat

### Sensordaten

Nachrichten auf dem Sensordaten-Topic haben folgendes Format:

```json
{
  "value": 23.5,
  "ts": "2025-01-15T10:30:00Z",
  "status": "OK",
  "unit": "°C",
  "extra": {}
}
```

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| value | Float | Ja | Numerischer Messwert |
| ts | DateTime | Nein | Zeitstempel (wenn nicht angegeben, wird die Serverzeit verwendet) |
| status | String | Nein | Status: OK, SUSPECT oder ERROR (Standard: OK) |
| unit | String | Nein | Einheit (zur Information) |
| extra | Object | Nein | Zusätzliche Metadaten |

### Discovery-Nachricht

Nachrichten auf dem Discovery-Topic haben folgendes Format:

```json
{
  "villageId": 1,
  "device": {
    "name": "Wetterstation Rathaus",
    "latitude": 47.99,
    "longitude": 7.85
  },
  "sensors": [
    {
      "sensorId": 42,
      "sensorTypeId": 1,
      "name": "Temperatur",
      "infoText": "Außentemperatur",
      "latitude": 47.99,
      "longitude": 7.85
    }
  ]
}
```

| Feld | Beschreibung |
|------|-------------|
| villageId | ID der Gemeinde, zu der das Gerät gehört |
| device.name | Name des Geräts |
| device.latitude/longitude | Standort des Geräts |
| sensors[].sensorId | Sensor-ID (optional, wenn leer wird nach Name gesucht) |
| sensors[].sensorTypeId | ID des Sensortyps |
| sensors[].name | Name des Sensors |

## Verarbeitung von Sensordaten

Wenn eine Nachricht auf einem Sensordaten-Topic empfangen wird, geschieht Folgendes:

1. Die Topic-Bestandteile werden extrahiert: Account-ID, Geräte-ID und Sensor-ID.
2. Es wird geprüft, ob das Gerät in der Datenbank existiert und zur richtigen Gemeinde gehört.
3. Es wird geprüft, ob der Sensor existiert und zum Gerät passt.
4. Bei erfolgreicher Validierung wird der Messwert über den SensorReadingService gespeichert.
5. Metadaten wie `unit`, `source: "mqtt"` und `timestampSource` werden im `extra`-Feld gespeichert.

Wenn die Nachricht keinen Zeitstempel (`ts`) enthält, wird die aktuelle Serverzeit verwendet.
In diesem Fall wird `timestampSource: "server"` in den Metadaten vermerkt.

Ungültige Nachrichten werden geloggt, aber nicht gespeichert.

## Verarbeitung von Discovery-Nachrichten

Wenn eine Nachricht auf einem Discovery-Topic empfangen wird, geschieht Folgendes:

1. Die Topic-Bestandteile werden extrahiert: Account-ID und Geräte-ID.
2. Das Gerät wird in der Datenbank gesucht.
3. Wenn das Gerät nicht existiert, wird es mit den angegebenen Daten erstellt.
4. Wenn das Gerät existiert, werden Name und Standort aktualisiert.
5. Für jeden Sensor in der Nachricht:
   - Wenn eine `sensorId` angegeben ist, wird der Sensor anhand der ID gesucht.
   - Wenn keine `sensorId` angegeben ist, wird nach Name gesucht.
   - Wenn der Sensor nicht existiert, wird er neu angelegt.
   - Wenn der Sensor existiert, werden seine Daten aktualisiert.

Dieser Prozess ermöglicht es IoT-Geräten, sich automatisch beim System anzumelden, ohne manuell konfiguriert werden zu müssen.

## Beispiel: Sensor-Datenerfassung über MQTT

1. Ein Temperatur-Sensor sendet eine Nachricht an `sv/1/weather-01/sensors/5`:
   ```json
   {"value": 21.3, "ts": "2025-03-08T14:00:00Z", "status": "OK"}
   ```
2. Das Backend empfängt die Nachricht und extrahiert: Account 1, Gerät `weather-01`, Sensor 5.
3. Das Backend prüft, ob Gerät `weather-01` existiert und zu einer Gemeinde von Account 1 gehört.
4. Das Backend prüft, ob Sensor 5 zu diesem Gerät gehört.
5. Der Messwert wird in der Tabelle `SensorReading` gespeichert.
6. Im Frontend wird beim nächsten Polling-Zyklus (alle 5 Sekunden) der neue Messwert angezeigt.

## Entwurfsentscheidungen

**Warum MQTT?**
MQTT ist ein leichtgewichtiges Protokoll, das speziell für IoT-Geräte konzipiert ist.
Es verbraucht wenig Bandbreite und unterstützt zuverlässige Nachrichtenübermittlung.
Vermutlich wurde es gewählt, weil viele IoT-Geräte MQTT nativ unterstützen.

**Warum automatische Discovery?**
Die automatische Geräteerkennung reduziert den manuellen Konfigurationsaufwand.
Neue Geräte müssen nur eine Discovery-Nachricht senden und werden automatisch registriert.
Das vereinfacht die Inbetriebnahme neuer Hardware erheblich.

**Warum keine Authentifizierung am Broker?**
In der aktuellen Konfiguration ist anonymer Zugriff am MQTT-Broker erlaubt.
Für den Produktionsbetrieb sollte die Authentifizierung aktiviert werden, um unbefugte Geräte auszuschließen.

## MQTT-Simulator

Für Testzwecke existiert ein Simulator unter `simulations/mqtt-freiburg/`.
Dieser sendet simulierte Sensordaten und Discovery-Nachrichten an den MQTT-Broker.

**Starten:**
```bash
cd simulations/mqtt-freiburg
npm install
npm run simulate
```

**Szenarien:**
- `npm run simulate` – Standard-Szenario mit verschiedenen Sensortypen
- `npm run simulate:mitfahrbank` – Mitfahrbank-Szenario
- `npm run simulate:errors` – Fehler-Szenario zum Testen der Fehlerbehandlung

Der Simulator ist nicht Teil der Docker-Compose-Konfiguration und muss manuell gestartet werden.

## Abhängigkeiten

Das MqttModule enthält:
- MqttService – MQTT-Verbindung und Nachrichtenverarbeitung
- Nutzt SensorReadingService aus dem SensorModule
- Nutzt ConfigService für die Konfiguration
- Nutzt PrismaService für den Datenbankzugriff
