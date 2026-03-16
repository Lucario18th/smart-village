# Auto-Discovery von Geräten und Sensoren

## Überblick

Das Auto-Discovery-System ermöglicht es IoT-Geräten, sich automatisch beim Smart-Village-System anzumelden.
Neue Geräte müssen nur eine Nachricht über MQTT senden, um registriert zu werden.
Das Dashboard zeigt neu entdeckte Geräte und Sensoren automatisch an.

## Wann und warum wird dieser Prozess genutzt?

Die automatische Erkennung wird genutzt, wenn neue IoT-Geräte in einer Gemeinde installiert werden.
Statt jedes Gerät manuell im Dashboard anzulegen, sendet das Gerät eine Konfigurationsnachricht über MQTT.
Das Backend erkennt das neue Gerät, erstellt die entsprechenden Einträge in der Datenbank und das Frontend zeigt sie an.

Das spart Konfigurationsaufwand und reduziert die Fehleranfälligkeit bei der manuellen Dateneingabe.

## Ablauf im Backend

### Schritt 1: Gerät sendet Discovery-Nachricht

Das IoT-Gerät veröffentlicht eine Nachricht auf dem MQTT-Topic:
```
sv/{accountId}/{deviceId}/config
```

Beispiel:
```
Topic: sv/1/weather-station-01/config
```

Die Nachricht enthält die Gerätekonfiguration:
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
      "sensorTypeId": 1,
      "name": "Temperatur",
      "infoText": "Außentemperatur",
      "latitude": 47.99,
      "longitude": 7.85
    },
    {
      "sensorTypeId": 2,
      "name": "Luftfeuchtigkeit",
      "infoText": "Relative Luftfeuchtigkeit",
      "latitude": 47.99,
      "longitude": 7.85
    }
  ]
}
```

### Schritt 2: Backend empfängt die Nachricht

Das Backend (MqttService) hat das Topic-Muster `sv/+/+/config` abonniert.
Es empfängt die Nachricht und extrahiert die Account-ID und Geräte-ID aus dem Topic.

### Schritt 3: Gerät prüfen oder erstellen

Das Backend sucht in der Datenbank nach einem Gerät mit der `deviceId` aus dem Topic.

**Falls das Gerät nicht existiert:**
- Ein neues Device wird in der Datenbank angelegt.
- Name, Standort und Village-Zuordnung werden aus der Nachricht übernommen.

**Falls das Gerät bereits existiert:**
- Name und Standort werden aktualisiert, falls sie sich geändert haben.

### Schritt 4: Sensoren prüfen oder erstellen

Für jeden Sensor in der Nachricht:

**Suche nach bestehendem Sensor:**
- Wenn eine `sensorId` in der Nachricht angegeben ist, wird nach dieser ID gesucht.
- Wenn keine `sensorId` angegeben ist, wird nach dem Sensornamen gesucht.

**Falls der Sensor nicht existiert:**
- Ein neuer Sensor wird angelegt mit den Daten aus der Nachricht.
- Der Sensor wird dem Gerät und der Gemeinde zugeordnet.

**Falls der Sensor bereits existiert:**
- Die Daten (Name, Beschreibung, Standort) werden aktualisiert.

### Schritt 5: Bestätigung

Das Backend loggt die erfolgreiche Verarbeitung.
Es gibt keine explizite Rückmeldung an das Gerät über MQTT.

## Ablauf im Frontend

### Polling und Erkennung

Der Hook `useVillageConfig` fragt regelmäßig die Gemeindedaten ab (Standard: alle 5 Sekunden).
Bei jedem Abruf werden die geladenen Sensoren und Geräte mit dem internen Zustand verglichen.

Wenn neue Einträge erkannt werden, die nicht im aktuellen Zustand vorhanden sind:

1. Die neuen Einträge werden in einer internen Menge erfasst.
2. Ein Debounce-Timer von 1,2 Sekunden wird gestartet.
3. Nach Ablauf des Timers wird eine Toast-Benachrichtigung angezeigt.
4. Die Benachrichtigung zeigt an, welche Geräte oder Sensoren neu entdeckt wurden.

### Discovery-Badge

In der SensorsSettingsForm werden neu entdeckte Geräte mit einem Badge gekennzeichnet.
Das hilft dem Benutzer zu erkennen, welche Geräte über MQTT automatisch hinzugefügt wurden.

### Konfigurierbarkeit

| Umgebungsvariable | Beschreibung | Standardwert |
|--------------------|-------------|-------------|
| `VITE_DISCOVERY_POLL_INTERVAL_MS` | Polling-Intervall in Millisekunden | 5000 |
| `VITE_AUTO_REFRESH_ENABLED` | Auto-Refresh aktiviert | true |

## Beispiel: Neue Wetterstation wird installiert

1. Ein Techniker installiert eine neue Wetterstation in Musterdorf.
2. Die Wetterstation hat die Geräte-ID `weather-musterdorf-02`.
3. Beim Einschalten sendet die Wetterstation eine Discovery-Nachricht:
   ```
   Topic: sv/1/weather-musterdorf-02/config
   Payload: {
     "villageId": 1,
     "device": { "name": "Wetterstation Schulhof", "latitude": 48.01, "longitude": 7.83 },
     "sensors": [
       { "sensorTypeId": 1, "name": "Temperatur Schulhof" },
       { "sensorTypeId": 2, "name": "Luftfeuchtigkeit Schulhof" }
     ]
   }
   ```
4. Das Backend empfängt die Nachricht und erstellt das Gerät und die zwei Sensoren.
5. Im Dashboard des Gemeindeverantwortlichen erscheint nach wenigen Sekunden eine Benachrichtigung: "Neues Gerät entdeckt: Wetterstation Schulhof".
6. Das Gerät und die Sensoren erscheinen in der Sensorliste mit einem Discovery-Badge.
7. Die Wetterstation beginnt, Messwerte zu senden:
   ```
   Topic: sv/1/weather-musterdorf-02/sensors/<sensorId>
   Payload: { "value": 21.3, "unit": "°C" }
   ```
8. Die Messwerte werden auf der Karte und in der Sensorliste angezeigt.

## Entwurfsentscheidungen

**Warum Discovery über MQTT und nicht über REST?**
IoT-Geräte kommunizieren typischerweise über MQTT.
Indem die Discovery ebenfalls über MQTT läuft, muss das Gerät nur ein Protokoll unterstützen.
Das vereinfacht die Firmware-Entwicklung auf der Geräteseite.

**Warum Polling statt Push-Benachrichtigungen im Frontend?**
Das Frontend verwendet Polling, weil keine WebSocket-Verbindung zwischen Frontend und Backend existiert.
Polling ist einfacher zu implementieren und erfordert keine zusätzliche Infrastruktur.
Der Nachteil ist eine Verzögerung von bis zu 5 Sekunden, bis neue Geräte angezeigt werden.

**Warum ein Debounce bei der Benachrichtigung?**
Wenn mehrere Geräte gleichzeitig entdeckt werden, würden ohne Debounce mehrere Benachrichtigungen erscheinen.
Der Debounce-Timer fasst mehrere Entdeckungen in einer einzigen Benachrichtigung zusammen.

## Abhängigkeiten

Beteiligte Komponenten:
- MqttService (Backend) – Empfängt und verarbeitet Discovery-Nachrichten
- PrismaService – Erstellt Geräte und Sensoren in der Datenbank
- useVillageConfig (Frontend) – Polling und Erkennung neuer Einträge
- SensorsSettingsForm (Frontend) – Anzeige mit Discovery-Badge
