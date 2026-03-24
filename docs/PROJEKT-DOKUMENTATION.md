# Smart-Village Projektdokumentation

Dieses Dokument ist der zentrale Einstieg in das Smart-Village-Projekt der DHBW Loerrach. Es kombiniert Projektvision, Architektur, Designentscheidungen und eine praxisnahe Endnutzer-Anleitung.

Grundlage sind die bestehenden technischen Detaildokumente unter `doku-Neu/` sowie die aktuelle Codebasis.

---

## Teil 1: Projektuebersicht nach 4MAT

## 1.1 WARUM - Der Bedarf und die Vision

### Problemstellung

Smart Village adressiert ein reales Problem vieler laendlicher und kleinerer Kommunen: Digitale Infrastruktur und datenbasierte Verwaltungsprozesse sind haeufig weniger ausgebaut als in grossen Staedten.

Konkret entstehen dadurch folgende Herausforderungen:

- Sensorik- und Umweltdaten sind nicht zentral verfuegbar.
- Daten aus Geraeten, Kartenansichten und Verwaltungsprozessen sind nicht durchgaengig verbunden.
- Buerger erhalten wichtige Informationen nicht immer zeitnah und transparent.
- Kommunen haben hohe Einstiegsbarrieren bei IoT-Integration.

### Vision und Ziele

Das Ziel von Smart Village ist eine integrierte Plattform, mit der Kommunen:

- IoT-Infrastruktur strukturiert verwalten,
- Sensordaten zuverlaessig erfassen und auswerten,
- Verwaltungsinformationen digital und nachvollziehbar bereitstellen,
- sowie Buergerzugang ueber Website und App standardisiert umsetzen koennen.

### Wer profitiert?

- Gemeinden/Kommunen: technische und fachliche Verwaltungsoberflaeche
- Buerger: transparente oeffentliche Informationen und aktuelle Messdaten
- Entwicklerteams: modularer, dokumentierter Aufbau fuer Wartung und Erweiterung

### Identifizierte Use Cases

- Gemeinde-Dashboard fuer Sensoren, Geraete, Karten und Statusmeldungen
- MQTT-gestuetzte Auto-Discovery neuer IoT-Geraete
- Raspberry-Pi-Integration als Praxisbeispiel fuer kommunale IoT-Einstiege
- Smart-City-Inspiration (Rostock) fuer uebertragbare Smart-Village-Szenarien
- Digitale kommunale Rueckmeldung (Informationsbereitstellung und Einordnung von Feedback)

## 1.2 WAS - Das System und seine Funktionen

### Kernfunktionen

- Verwaltung von Gemeinden (Village)
- Registrierung/Anmeldung mit E-Mail-Verifizierung
- Verwaltung von Geraeten (Device) und Sensoren (Sensor)
- Speicherung von Messwerten als Zeitreihe (SensorReading)
- MQTT-Ingestion fuer IoT-Daten
- Auto-Discovery fuer neue Geraete/Sensoren
- Admin-Dashboard und Public-Ansicht
- App-API fuer Public-Website und mobile Clients
- Kartenvisualisierung mit OpenStreetMap

### Hauptkomponenten

- Backend: NestJS, Prisma, PostgreSQL/TimescaleDB, MQTT
- Frontend: React, Vite, Leaflet
- Infrastruktur: Docker Compose, Nginx, Mosquitto, MailHog
- Mobile API: vorhanden, aber in der aktuellen Doku bewusst ausgeklammert (geplantes Redesign)

### Datenmodell (Kurzueberblick)

Zentrale Entitaeten:

- Account
- Village
- Device
- Sensor
- SensorType
- SensorReading

Kernbeziehungen:

- Ein Account verwaltet eine oder mehrere Villages.
- Eine Village enthaelt Devices und Sensors.
- Ein Device kann mehrere Sensors enthalten.
- Ein Sensor erzeugt viele SensorReadings.

Details: `../doku-Neu/architektur/datenmodell.md`

## 1.3 WIE - Architektur und technische Umsetzung

### High-Level-Architektur

- Backend stellt REST-Endpunkte bereit und konsumiert MQTT-Nachrichten.
- Frontend (SPA) ruft API/App-API auf und visualisiert Daten inkl. Karten.
- Datenbank speichert Stammdaten und Zeitreihen.
- MQTT-Broker verbindet IoT-Geraete mit dem Backend.
- Nginx dient als Reverse Proxy, TLS-Endpunkt und Sicherheitsgrenze.

### Deploymentmodell

Standard-Setup ueber Docker Compose mit typischen Diensten:

- `nginx`
- `backend`
- `postgres`
- `mosquitto`
- `mailhog`

Typische lokale Endpunkte:

- Frontend: `https://localhost`
- API: `https://localhost/api/...`
- Health: `https://localhost/api/health`
- MailHog: `https://localhost:8025`
- MQTT TCP: `localhost:1883`
- MQTT WebSocket (via Nginx): `wss://localhost/mqtt`

Details: `../doku-Neu/architektur/infrastruktur.md`, `../doku-Neu/betrieb/deployment.md`

### Sicherheit (aktueller Stand)

- JWT-basierte Authentifizierung mit Guards
- E-Mail-Verifizierung fuer neue Konten
- Eingabevalidierung ueber DTOs/Validation Pipe
- SQL-Hardening (parametrisierte Queries, keine unsichere Raw-Query-Nutzung)
- Sicherheitsheader via Helmet/Nginx (u. a. HSTS, nosniff, X-Frame-Options)
- Container-Hardening (npm ci, reduzierte Runtime, Non-Root-User)
- Rate-Limiting am Edge (Nginx)

Details: `../doku-Neu/betrieb/sicherheit.md`, `../doku-Neu/aenderungen-2026-03-18.md`

### Exemplarischer Datenfluss

IoT-Geraet -> MQTT -> Backend -> Datenbank -> REST/App-API -> Frontend/App

Praxisbeispiel (Sensorwerte):

1. Geraet publiziert an Topic `sv/{accountId}/{deviceId}/sensors/{sensorId}`.
2. Backend validiert Topic und Payload.
3. Messwert wird als SensorReading gespeichert.
4. Frontend/App aktualisieren Darstellung per Polling (und teilweise MQTT-WebSocket-Livewerten).

## 1.4 WAS-WENN - Erweiterbarkeit und Zukunft

### Skalierbarkeit

Das aktuelle Design ist fuer mehrere Gemeinden nutzbar (mandantennahe Trennung via Account/Village).

Ausbaustufen:

- horizontale Skalierung des Backends
- strengere Auth/ACL pro Village
- DB-Optimierung und ggf. Read-Modelle
- spaeterer Schnitt zu Microservice-orientierten Bausteinen

### Erweiterungsmoeglichkeiten

- neue Sensortypen und Fachmodule
- weitere IoT-Protokolle (z. B. LoRaWAN/Zigbee-Gateways)
- erweiterte Analytics und Alerting
- Mobile-API-Redesign (bereits als kuenftige Aufgabe benannt)

### Lessons Learned / offene Punkte

- Kommunale Abstimmungsprozesse brauchen realistisch mehr Zeit als geplant.
- Technische Funktionsfaehigkeit allein reicht nicht; organisatorischer Fit ist entscheidend.
- Sicherheit wurde bereits gehaertet, aber verbleibende Punkte (z. B. MQTT-Auth in Produktion) sind relevant.

---

## Teil 2: Designentscheidungen und Technologievergleiche

Hinweis: Die Spalte "gewaehlt" basiert auf der aktuellen Codebasis. Die Spalte "nicht gewaehlt" dokumentiert im Projektkontext bewertete Alternativen.

## 2.1 Backend-Framework

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| NestJS | Ja | Modulare Architektur, TypeScript-nativ, Guards/Pipes/DI out-of-the-box, gute Integration mit Prisma und MQTT. |
| Express.js | Nein | Zu low-level fuer den gewuenschten strukturierten Modulansatz; mehr Boilerplate fuer Validation/Security-Patterns. |
| Fastify (direkt) | Nein | Sehr performant, aber fuer den Projektkontext weniger naheliegend als NestJS als strukturierender Rahmen. |
| Django | Nein | Team- und Stack-Fokus auf TypeScript in Backend und Frontend. |

## 2.2 ORM / Datenzugriff

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| Prisma | Ja | Type-safe Client, klare Migrationen, gutes Schema-Management, starke DX mit TypeScript. |
| TypeORM | Nein | Im Projektkontext weniger konsistente Type-Safety und Migrationserfahrung als mit Prisma. |
| Sequelize | Nein | Aelteres API-Gefuehl und schwacherer TypeScript-Komfort im Vergleich zu Prisma. |
| Raw SQL als Standardzugriff | Nein | Hoeheres Fehler- und Sicherheitsrisiko, geringere Wartbarkeit. |

## 2.3 Datenbank

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| PostgreSQL (+ TimescaleDB) | Ja | Robuste relationale Basis, gute Zeitreihen-Eignung, Prisma-kompatibel, produktionsbewaehrt. |
| MySQL | Nein | Fuer den Projektkontext weniger attraktiv bei Zeitreihen-/Erweiterungsanforderungen. |
| MongoDB | Nein | Datenmodell ist klar relational (Account/Village/Device/Sensor/Reading). |
| SQLite | Nein | Nicht fuer produktionsnahe Multi-User-Szenarien dieser Art gedacht. |

## 2.4 Frontend-Framework

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| React | Ja | Grosse Community, komponentenbasierte Architektur, Teamerfahrung, gute Karten-/API-Integration. |
| Vue.js | Nein | Solide Alternative, aber im Projekt weniger Teamfokus als React. |
| Angular | Nein | Fuer Projektgroesse zu schwergewichtig und mit hoeherem Overhead. |
| Svelte | Nein | Gutes Konzept, aber kleineres Oekosystem im Projektkontext. |

## 2.5 Build-Tool Frontend

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| Vite | Ja | Sehr schnelle Dev-Zyklen, moderne ESM-Basis, einfache Konfiguration. |
| Webpack | Nein | Hoeherer Konfigurations- und Build-Aufwand im Vergleich zu Vite. |
| Create React App | Nein | Fuer moderne Projektanforderungen nicht mehr erste Wahl. |

## 2.6 IoT-Kommunikation

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| MQTT | Ja | Leichtgewichtig, IoT-Standard, Publish/Subscribe passend fuer Sensorstreams und Discovery. |
| REST als primaerer IoT-Transport | Nein | Fuer kontinuierliche Sensordaten ineffizienter als MQTT. |
| WebSockets als primaere Device-Anbindung | Nein | Fuer Embedded-IoT weniger standardisiert als MQTT im Projektkontext. |
| CoAP | Nein | Im Projekt nicht priorisiert, kleineres direktes Team-/Tooling-Setup. |

## 2.7 Authentifizierung

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| JWT | Ja | Stateless Ansatz, gut mit NestJS Guards kombinierbar, API-/App-kompatibel. |
| Session/Cookie-basiert (serverseitig) | Nein | Hoeherer operativer Aufwand fuer Session-Store und API-Patterns. |
| OAuth2/OIDC als Kernauth | Nein | Fuer den aktuellen Scope ohne Drittanbieter-Login ueberdimensioniert. |

## 2.8 Containerisierung / Deployment

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| Docker + Docker Compose | Ja | Reproduzierbares Setup fuer Entwicklung/Betrieb, einfache Inbetriebnahme. |
| Kubernetes | Nein | Fuer Projektgroesse und Betriebsaufwand derzeit zu komplex. |
| Bare-Metal/ohne Container | Nein | Schlechter reproduzierbar, hoeherer Setup- und Drift-Aufwand. |

## 2.9 Reverse Proxy / Webserver

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| Nginx | Ja | Stabil, performant, klare Proxy-/TLS-/Security-Header-Konfiguration. |
| Apache | Nein | Im Projektkontext nicht priorisiert gegenueber Nginx. |
| Caddy | Nein | Gute Option, aber Team/Projektkonfiguration bereits auf Nginx ausgerichtet. |

## 2.10 Styling / UI-Ansatz

| Technologie | Gewaehlt? | Begruendung |
|---|---|---|
| Custom CSS (inkl. Theme-System) | Ja | Im Projekt umgesetzt; volle Kontrolle ueber Design und Kontraste. |
| Tailwind CSS | Nein | Keine Nutzung in package.json oder Komponentenstruktur erkennbar. |
| Material-UI | Nein | Keine Nutzung in package.json; UI ist komponenten- und CSS-basiert umgesetzt. |
| Bootstrap | Nein | Nicht im Build/Styling-Stack enthalten. |

---

## Teil 3: Endnutzer-Anleitung - Sensoren und Geraete einbinden

Zielgruppe dieses Teils: Gemeinde-Administratoren mit wenig bis mittlerem technischen Vorwissen.

## 3.1 Ueberblick: Sensoren und Anwendungsfaelle

| Sensortyp | Beispiel-Hardware | Anwendungsfall | Datenformat |
|---|---|---|---|
| Temperatur | DHT22, BME280, BMP280 | Wetterstation, Ortsklima | float (Grad C) |
| Luftfeuchtigkeit | DHT22, BME280 | Klimaueberwachung | float (Prozent) |
| Luftdruck | BMP280, BME280 | Wettertrend | float (hPa) |
| Bodenfeuchte | YL-69/LM393, kapazitive Sensoren | Bewaesserung, Gruenflaechen | float (Prozent bzw. projektabhaengig) |
| CO2 | MH-Z19, SCD30 | Luftqualitaet | float/int (ppm) |
| Mitfahrbank | projektspezifische Erfassung | Mobilitaets-Usecase | int (Personen) |
| Wind / Regen / Solar (optional je Hardware) | Wettermodule | Umweltmonitoring | float |

Hinweis: In der Seed-Konfiguration sind u. a. Temperature, Humidity, Pressure, Rainfall, Wind Speed, Solar Radiation, Soil Moisture, CO2 und Mitfahrbank vorgesehen.

## 3.2 Hardware-Empfehlungen fuer IoT-Gateways

| Geraet | Geeignet fuer | Vorteile | Nachteile |
|---|---|---|---|
| Raspberry Pi 5 | Zentrale Sensor-Knoten, MQTT-Gateway | Leistungsstark, viele Schnittstellen, gute Community | Hoeherer Stromverbrauch |
| Raspberry Pi Zero W | Kleine Sensor-Nodes | Geringe Kosten, kompakt | Weniger Rechenleistung |
| ESP32 | Einfache, stromsparende Sensor-Nodes | Sehr guenstig, WLAN/Bluetooth | Begrenzte Ressourcen |
| Arduino + Netzwerkmodul | Sehr einfache Einzelsensoren | Niedrige Einstiegshuerde | Geringere Flexibilitaet fuer komplexere Workflows |

## 3.3 Schritt-fuer-Schritt: Sensor mit Raspberry Pi 5 einbinden

### Schritt 1: Hardware vorbereiten

- Raspberry Pi installieren und ins Netzwerk bringen.
- Sensoren anschliessen (z. B. BMP280 via I2C, Bodenfeuchte digital an GPIO).
- Sensorbibliotheken installieren.

Praxisreferenz: `../Raspberry PI/Doku/Derzeitiger_Stand.md`

### Schritt 2: MQTT-Client konfigurieren

Im Pi-Skript mindestens setzen:

- `MQTT_URL`
- `ACCOUNT_ID`
- `DEVICE_ID`
- `SENSOR_ID`
- `PUBLISH_INTERVAL`

Typische Topics im Projekt:

- Discovery: `sv/{accountId}/{deviceId}/config`
- Messwert: `sv/{accountId}/{deviceId}/sensors/{sensorId}`

### Schritt 3: Geraet im Backend anlegen

Im Adminbereich:

1. anmelden,
2. zu Geraeteverwaltung wechseln,
3. neues Geraet mit eindeutiger `deviceId` anlegen,
4. Position/Name setzen.

Alternativ kann das Geraet per Discovery automatisch erstellt werden.

### Schritt 4: Sensor zuordnen und freigeben

Im Adminbereich Sensor anlegen oder ueber Discovery uebernehmen:

- passender Sensortyp,
- eindeutige Sensor-ID,
- optional Beschreibung und Position,
- fuer Public/App-Sichtbarkeit `exposeToApp` aktivieren.

### Schritt 5: Auto-Discovery (optional)

Wenn Discovery genutzt wird:

1. Geraet sendet initiale Config-Payload,
2. Backend erkennt Device/Sensor,
3. Administrator prueft und finalisiert Sichtbarkeit/Felder.

Details: `../doku-Neu/prozesse/auto-discovery.md`

### Schritt 6: Daten verifizieren

- Im Admin-Dashboard pruefen, ob Werte eintreffen.
- `dataStale` sollte nach aktuellen Messungen auf `false` gehen.
- Public-Ansicht pruefen: Sensor sichtbar, wenn `exposeToApp = true` und Feature-Freigaben aktiv sind.

## 3.4 Code-Beispiele fuer IoT-Geraete

### Beispiel A: Python (Raspberry Pi, Temperatur + Luftfeuchtigkeit via MQTT)

```python
import time
import json
import paho.mqtt.client as mqtt

MQTT_URL = "mqtt://localhost:1883"
MQTT_HOST = "localhost"
MQTT_PORT = 1883
ACCOUNT_ID = "1"
DEVICE_ID = "weather-station-01"
TEMP_SENSOR_ID = 1001
HUM_SENSOR_ID = 1002

client = mqtt.Client()
client.connect(MQTT_HOST, MQTT_PORT, 60)

while True:
    # Beispielwerte (in Produktion echte Sensordaten lesen)
    temperature = 21.7
    humidity = 56.2

    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    temp_payload = {
        "value": temperature,
        "ts": ts,
        "status": "OK",
        "unit": "C"
    }
    hum_payload = {
        "value": humidity,
        "ts": ts,
        "status": "OK",
        "unit": "%"
    }

    client.publish(
        f"sv/{ACCOUNT_ID}/{DEVICE_ID}/sensors/{TEMP_SENSOR_ID}",
        json.dumps(temp_payload),
        qos=0
    )
    client.publish(
        f"sv/{ACCOUNT_ID}/{DEVICE_ID}/sensors/{HUM_SENSOR_ID}",
        json.dumps(hum_payload),
        qos=0
    )

    time.sleep(60)
```

### Beispiel B: Node.js (generische Sensor-Publikation)

```javascript
const mqtt = require('mqtt');

const config = {
  broker: 'mqtt://localhost:1883',
  accountId: '1',
  deviceId: 'iot-node-01',
  sensorId: '2001'
};

const client = mqtt.connect(config.broker);

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  setInterval(() => {
    const value = Number((20 + Math.random() * 5).toFixed(1));
    const payload = JSON.stringify({
      value,
      ts: new Date().toISOString(),
      status: 'OK',
      unit: 'C'
    });

    const topic = `sv/${config.accountId}/${config.deviceId}/sensors/${config.sensorId}`;
    client.publish(topic, payload, (err) => {
      if (err) {
        console.error('Publish error:', err);
      } else {
        console.log(`Published ${value} to ${topic}`);
      }
    });
  }, 60000);
});
```

Praxiscode im Repository:

- `../Raspberry PI/Code/soil_mqtt.py`
- `../Raspberry PI/Code/soil_local_test.py`

## 3.5 Troubleshooting

| Problem | Wahrscheinliche Ursache | Loesung |
|---|---|---|
| Sensor nicht sichtbar | `exposeToApp` deaktiviert | Sensor im Adminbereich freigeben |
| Sensor `dataStale = true` | Keine neuen Messwerte > ca. 60s | MQTT-Verbindung und Publisher-Skript pruefen |
| MQTT-Verbindung fehlschlaegt | Falscher Broker/Port/TLS | `MQTT_URL`, Netzwerk und Ports pruefen |
| Discovery erkennt Geraet nicht | Payload/Topic ungueltig | Topic-Format und Discovery-Payload gegen Doku pruefen |
| Messwerte kommen nicht an | Sensor-ID/Topic passt nicht zum Backend-Modell | IDs und Topic-Struktur konsistent halten |
| Login/Verifizierung klappt nicht | SMTP/MailHog oder Tokenproblem | MailHog, Auth-Konfiguration und Logs pruefen |

## 3.6 Weitere Ressourcen

- Rostock-Ressource: https://youtu.be/-ElfgOPmclA?si=9HY43XEayRAcq9en
- API-Referenz: `../doku-Neu/api/endpunkte.md`
- MQTT-Integration: `../doku-Neu/backend/mqtt-integration.md`
- Auto-Discovery: `../doku-Neu/prozesse/auto-discovery.md`
- Deployment: `../doku-Neu/betrieb/deployment.md`
- Sicherheitskonzept: `../doku-Neu/betrieb/sicherheit.md`

---

## Anhang: Weiterfuehrende Links

- Doku-Einstieg: `../doku-Neu/README.md`
- Projektuebersicht: `../doku-Neu/uebersicht.md`
- Systemarchitektur: `../doku-Neu/architektur/system-uebersicht.md`
- Datenmodell: `../doku-Neu/architektur/datenmodell.md`
- App-API: `../doku-Neu/backend/app-api.md`
- Aenderungshistorie: `../doku-Neu/aenderungen-2026-03-15.md`, `../doku-Neu/aenderungen-2026-03-17.md`, `../doku-Neu/aenderungen-2026-03-18.md`, `../doku-Neu/aenderungen-2026-03-23.md`

---

## Kurzfazit

Smart Village verbindet technische IoT-Infrastruktur mit kommunaler Nutzbarkeit. Das System ist bereits funktional und dokumentiert, gleichzeitig offen fuer Erweiterungen bei Skalierung, Integrationen und mobilen Schnittstellen. Die Kombination aus modularer Architektur, klaren Prozessen und praxisnahen IoT-Workflows macht das Projekt sowohl fuer Entwicklungsteams als auch fuer kommunale Anwender gut einsetzbar.
