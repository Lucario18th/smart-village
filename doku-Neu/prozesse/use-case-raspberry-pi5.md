# Use Case: Raspberry Pi 5 im Smart-Village-Kontext

## Einordnung

Der Raspberry Pi 5 dient in diesem Projekt als praxisnahes Beispielgeraet fuer die Integration von IoT-Hardware in eine Gemeinde.
Er kann je nach Auspraegung als

- IoT-Gateway (Anbindung mehrerer Sensoren und Weiterleitung),
- Sensor-Node (direkt angeschlossene Sensorik),
- oder kombinierte Gateway/Sensor-Einheit

verwendet werden.

## Projektbezug und Quellen im Repository

Die projektspezifischen Beispiele befinden sich im Ordner `Raspberry PI/`:

- `Raspberry PI/Code/soil_mqtt.py` (Messwertuebertragung und Discovery ueber MQTT)
- `Raspberry PI/Code/soil_local_test.py` (lokaler Sensor-/Plausi-Test)
- `Raspberry PI/Doku/Derzeitiger_Stand.md` (aktueller technischer Stand inkl. Setup, Verkabelung und Workflows)

Diese Dateien sind die primaere Referenz fuer Konfiguration, Skriptstruktur und Hardwarebezug auf Raspberry-Pi-Seite.

Der dokumentierte Hardware-Stand nutzt insbesondere Raspberry Pi 5 (Bookworm), BMP280 (I2C) sowie YL-69/LM393 (digitaler Bodenfeuchte-Status ueber D0).

Hinweis zum Aktualitaetsstand:
Falls die begleitende Raspberry-Pi-Doku von der Implementierung abweicht, ist der aktuelle Code im Ordner `Raspberry PI/Code/` als technische Quelle fuehrend.

## Ablauf im Gesamtsystem

Der Ablauf orientiert sich an den bestehenden Prozessen fuer Discovery, Sensor-Datenfluss und App-Auslieferung.

### 1. Erfassung auf dem Raspberry Pi 5

Der Raspberry Pi 5 liest lokale Sensorwerte ein (z. B. Bodenfeuchte, Temperatur, Luftdruck).
Die Messwerte werden durch das Skript aufbereitet und in ein einheitliches Payload-Format ueberfuehrt.
Im aktuellen Grundsetup wird Bodenfeuchte digital als trocken/feucht eingelesen und fuer den Datentransport auf eine Prozent-Skala (0/100) abgebildet.

Fuer den aktuellen Projektstand sind zwei Sensorquellen relevant, die in den Smart-Village-Datenfluss eingebunden werden:

- Bodenfeuchte (YL-69/LM393)
- Umweltdaten ueber BMP280 (insbesondere Temperatur und Luftdruck)

### 2. Anbindung an das Backend

Die Anbindung erfolgt ueblicherweise ueber MQTT:

- Discovery-Topic: `sv/{accountId}/{deviceId}/config`
- Messwert-Topic: `sv/{accountId}/{deviceId}/sensors/{sensorId}`

Wesentliche Konfigurationsparameter des MQTT-Skripts sind `MQTT_URL`, `ACCOUNT_ID`, `VILLAGE`, `DEVICE_ID`, `SENSOR_ID` und `PUBLISH_INTERVAL`.

Alternativ oder ergaenzend ist eine Uebertragung ueber REST (`/api/sensor-readings/:sensorId`) moeglich.

### 3. Registrierung und Mapping auf Entitaeten

Im Backend werden die MQTT-Nachrichten dem bestehenden Datenmodell zugeordnet:

- Raspberry-Pi-Einheit -> Geraet (`Device`)
- angebundene Messstellen -> Sensor (`Sensor`)
- einzelne Datenpunkte -> Messwert (`SensorReading`)

Bei Discovery werden Geraete und Sensoren automatisch angelegt oder aktualisiert, sofern sie noch nicht vorhanden sind.
Die Discovery-Nachricht liefert dabei die technischen Metadaten fuer die Zuordnung im Smart-Village-Datenmodell.

### 4. Sichtbarkeit in App und Website

Nach der Speicherung im Backend stehen die Daten ueber API und App-API zur Verfuegung.
Die Anzeige in Public/App orientiert sich an den bestehenden Feature-Flags und Sensor-Freigaben (u. a. `exposeToApp`).
Damit werden Raspberry-Pi-Daten in denselben Oberflaechen sichtbar wie andere IoT-Quellen einer Gemeinde.

## Bezug zu Rostock / Smart City

Der Rostock-Kontext liefert eine inhaltliche Inspiration fuer kommunale Digitalisierungs-Usecases.
Die dort diskutierten Smart-City-Muster (vernetzte Sensorik, transparente Datenbereitstellung, digitale Statuskommunikation) sind auf Smart-Village-Szenarien uebertragbar.

Im Smart-Village-Kontext bedeutet das: Eine Gemeinde kann mit einem Raspberry Pi 5 niedrigschwellig mit IoT starten und den Ansatz schrittweise erweitern.

Weiterfuehrende Ressource:
https://youtu.be/-ElfgOPmclA?si=9HY43XEayRAcq9en

## Abgrenzung

Dieser Usecase ist ein technisches Integrationsbeispiel und ersetzt keine fachliche Priorisierung einzelner Kommunen.
Die Mobile API ist weiterhin nicht Bestandteil des Dokumentationsumfangs.

Zugangsdaten in Raspberry-Pi-Unterlagen sind als Beispielwerte zu behandeln und vor externen Veroeffentlichungen zu aendern oder zu entfernen.
