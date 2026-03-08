# Infrastruktur und Docker

## Überblick

Das gesamte System wird über Docker Compose betrieben.
Alle Dienste laufen als Container in einem gemeinsamen Docker-Netzwerk namens `smartvillage-net`.
Die Konfigurationsdateien befinden sich im Verzeichnis `infra/`.

## Dienste

Die Docker-Compose-Datei (`infra/docker-compose.yml`) definiert fünf Dienste:

### Nginx (Reverse Proxy und Webserver)

| Eigenschaft | Wert |
|-------------|------|
| Container-Name | smartvillage-nginx |
| Image | Gebaut aus `website/Dockerfile` |
| Ports | 80 (HTTP), 443 (HTTPS) |
| Aufgabe | Liefert das React-Frontend aus und leitet API-Anfragen an das Backend weiter |

Nginx hat zwei Funktionen.
Erstens liefert es die statischen Dateien des React-Builds aus dem Verzeichnis `/usr/share/nginx/html` aus.
Zweitens leitet es alle Anfragen unter `/api/` an den Backend-Container weiter.

HTTP-Anfragen auf Port 80 werden per 301-Redirect auf HTTPS (Port 443) umgeleitet.
HTTPS nutzt selbstsignierte Zertifikate, die unter `infra/certs/` liegen müssen.

Die Nginx-Konfiguration befindet sich unter `infra/nginx/default.conf`.
Für SPA-Routing gibt es die Regel `try_files $uri $uri/ /index.html`, damit alle Routen auf die React-App verweisen.

Nginx startet erst, wenn das Backend gesund ist (Health-Check-Abhängigkeit).

### Backend (NestJS API)

| Eigenschaft | Wert |
|-------------|------|
| Container-Name | smartvillage-backend |
| Image | Gebaut aus `backend/Dockerfile` |
| Port | 8000 |
| Aufgabe | REST-API und MQTT-Verarbeitung |

Das Backend wird in einem zweistufigen Docker-Build erstellt.
In der ersten Stufe werden die Abhängigkeiten installiert, der Prisma-Client generiert und der TypeScript-Code kompiliert.
In der zweiten Stufe wird nur der kompilierte Code mit den Produktionsabhängigkeiten in das finale Image kopiert.

Beim Start wartet das Backend auf die Verfügbarkeit der Datenbank (Health-Check-Abhängigkeit auf PostgreSQL).
Prisma-Migrationen werden beim Start automatisch ausgeführt.

Der Health-Check prüft alle 30 Sekunden den Endpunkt `GET /api/health`.

### PostgreSQL mit TimescaleDB

| Eigenschaft | Wert |
|-------------|------|
| Container-Name | smartvillage-postgres |
| Image | timescale/timescaledb:latest-pg15 |
| Port | 5432 |
| Aufgabe | Relationale Datenbank mit Zeitreihenerweiterung |

Die Datenbank speichert alle Anwendungsdaten.
TimescaleDB erweitert PostgreSQL um effiziente Zeitreihenabfragen, die für die Sensordaten genutzt werden.

Die Datenbankdateien werden auf dem Host unter `/srv/smartvillage/postgres-data/` persistiert.
Dadurch bleiben die Daten auch nach einem Neustart der Container erhalten.

Der Health-Check nutzt `pg_isready` und prüft alle 10 Sekunden die Verfügbarkeit.

Die Zugangsdaten sind in der Datei `infra/smartvillage.env` konfiguriert:
- Datenbankname: `smartvillage`
- Benutzer: `smartvillage`
- Passwort: konfigurierbar (Standard: `CHANGEME_POSTGRES_PASSWORD`)

### Mosquitto (MQTT-Broker)

| Eigenschaft | Wert |
|-------------|------|
| Container-Name | smartvillage-mosquitto |
| Image | eclipse-mosquitto:2 |
| Port | 1883 |
| Aufgabe | MQTT-Broker für IoT-Kommunikation |

Mosquitto empfängt MQTT-Nachrichten von IoT-Geräten und leitet sie an das Backend weiter.
Das Backend abonniert bestimmte Topics und verarbeitet die eingehenden Daten.

Die aktuelle Konfiguration (`infra/mosquitto/config/mosquitto.conf`) erlaubt anonymen Zugriff:
```
listener 1883
allow_anonymous true
```

Für den Produktionsbetrieb sollte die Authentifizierung aktiviert werden.

Persistente Daten und Logs werden unter `infra/mosquitto/data/` und `infra/mosquitto/log/` gespeichert.

### MailHog (E-Mail-Test)

| Eigenschaft | Wert |
|-------------|------|
| Container-Name | smartvillage-mailhog |
| Image | mailhog/mailhog:v1.0.1 |
| Ports | 1025 (SMTP), 8025 (Web-UI) |
| Aufgabe | SMTP-Server zum Testen von E-Mails |

MailHog fängt alle E-Mails ab, die das Backend versendet.
In der Entwicklungsumgebung werden Verifizierungs-E-Mails hierhin geschickt.
Über die Web-Oberfläche auf Port 8025 können die E-Mails eingesehen werden.

MailHog ist nur für die Entwicklung gedacht.
In einer Produktionsumgebung muss ein echter SMTP-Server konfiguriert werden.

## Netzwerkarchitektur

Alle Container sind über das Docker-Netzwerk `smartvillage-net` (Bridge-Modus) verbunden.
Innerhalb dieses Netzwerks können sich die Container über ihre Container-Namen ansprechen.

```
Externe Anfragen
       |
       v
  Nginx (Port 80/443)
       |
       |── Statische Dateien (React-App)
       |
       └── /api/* ──> Backend (Port 8000)
                          |
                          |── PostgreSQL (Port 5432)
                          |── Mosquitto (Port 1883)
                          └── MailHog (Port 1025)
```

Die interne Kommunikation verwendet folgende Adressen:
- Backend zu Datenbank: `postgresql://smartvillage:PASSWORT@smartvillage-postgres:5432/smartvillage`
- Backend zu MQTT: `mqtt://mosquitto:1883`
- Backend zu SMTP: `smartvillage-mailhog:1025`
- Nginx zu Backend: `http://smartvillage-backend:8000`

## Startreihenfolge

Docker Compose startet die Dienste in der folgenden Reihenfolge, basierend auf Health-Check-Abhängigkeiten:

1. PostgreSQL startet und wird über `pg_isready` geprüft.
2. MailHog und Mosquitto starten parallel (keine Abhängigkeiten).
3. Das Backend startet, sobald PostgreSQL gesund ist und MailHog läuft.
4. Nginx startet, sobald das Backend gesund ist.

## Umgebungsvariablen

Alle Umgebungsvariablen sind in `infra/smartvillage.env` definiert.
Die wichtigsten sind:

| Variable | Beschreibung | Standardwert |
|----------|-------------|-------------|
| `NODE_ENV` | Umgebung (development/production) | development |
| `PORT` | Backend-Port | 8000 |
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | (siehe smartvillage.env) |
| `JWT_SECRET` | Geheimnis für JWT-Signierung | CHANGEME_JWT_SECRET |
| `JWT_EXPIRES_IN` | Gültigkeit des JWT-Tokens | 1h |
| `FRONTEND_URL` | URL des Frontends (für CORS) | https://localhost |
| `SMTP_HOST` | SMTP-Server | smartvillage-mailhog |
| `SMTP_PORT` | SMTP-Port | 1025 |
| `MQTT_HOST` | MQTT-Broker-Host | mosquitto |
| `MQTT_PORT` | MQTT-Broker-Port | 1883 |
| `MQTT_TOPIC_PATTERN` | Topic-Muster für Sensordaten | sv/+/+/sensors/+ |
| `MQTT_DISCOVERY_PATTERN` | Topic-Muster für Discovery | sv/+/+/config |

## Volumes

| Volume | Host-Pfad | Container-Pfad | Beschreibung |
|--------|-----------|----------------|-------------|
| postgres-data | /srv/smartvillage/postgres-data | /var/lib/postgresql/data | Datenbankdateien |
| nginx-config | infra/nginx/default.conf | /etc/nginx/conf.d/default.conf | Nginx-Konfiguration (read-only) |
| certs | infra/certs/ | /etc/nginx/certs/ | SSL-Zertifikate (read-only) |
| mosquitto-config | infra/mosquitto/config/ | /mosquitto/config | Mosquitto-Konfiguration |
| mosquitto-data | infra/mosquitto/data/ | /mosquitto/data | Persistente MQTT-Daten |
| mosquitto-log | infra/mosquitto/log/ | /mosquitto/log | MQTT-Logs |
| csv | infra/csv/ | — | CSV-Import-Dateien |
