# Deployment und Betrieb

## Voraussetzungen

Folgende Software muss auf dem Server installiert sein:
- Docker und Docker Compose
- Git (für das Klonen des Repositories)

## Schnellstart

### 1. Repository klonen

```bash
git clone <repository-url>
cd smart-village
```

### 2. Umgebungsvariablen anpassen

Die Datei `infra/smartvillage.env` enthält alle Konfigurationsparameter.
Für den Produktionsbetrieb müssen mindestens folgende Werte angepasst werden:

```bash
# Sicheres Passwort für die Datenbank
POSTGRES_PASSWORD=<sicheres-passwort>
DATABASE_URL=postgresql://smartvillage:<sicheres-passwort>@smartvillage-postgres:5432/smartvillage?schema=public

# Sicherer Schlüssel für JWT-Signierung
JWT_SECRET=<zufälliger-schlüssel>

# Korrekte Frontend-URL für CORS
FRONTEND_URL=https://<domain>
```

### 3. SSL-Zertifikate bereitstellen

Für HTTPS müssen Zertifikate unter `infra/certs/` abgelegt werden:
- `nginx-selfsigned.crt` – Zertifikat
- `nginx-selfsigned.key` – Privater Schlüssel

Für die Entwicklung können selbstsignierte Zertifikate erstellt werden:
```bash
cd infra/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx-selfsigned.key -out nginx-selfsigned.crt
```

Für den Produktionsbetrieb sollten Zertifikate von einer Zertifizierungsstelle (z. B. Let's Encrypt) verwendet werden.

### 4. System starten

```bash
cd infra
docker compose up -d
```

Docker Compose baut die Images und startet alle Dienste.
Die Startreihenfolge wird automatisch über Health-Checks gesteuert.

### 5. Status prüfen

```bash
docker compose ps
docker compose logs -f backend
```

Das System ist bereit, wenn alle Container den Status "healthy" haben.

**Zugang:**
- Frontend: `https://localhost` (oder die konfigurierte Domain)
- Backend-API: `https://localhost/api/health`
- MailHog (Entwicklung): `http://localhost:8025`

## Erster Login

1. Im Browser die Frontend-URL aufrufen.
2. Auf "Registrieren" klicken.
3. E-Mail, Passwort und Standort eingeben.
4. In MailHog (`http://localhost:8025`) den Verifizierungscode abrufen.
5. Den 6-stelligen Code im Verifizierungsformular eingeben.
6. Mit den registrierten Zugangsdaten anmelden.

## Datenbank

### Migrationen

Prisma-Migrationen werden beim Start des Backend-Containers automatisch ausgeführt.
Manuelle Migrationen können wie folgt durchgeführt werden:

```bash
# In den Backend-Container wechseln
docker exec -it smartvillage-backend sh

# Migration erstellen (Entwicklung)
npx prisma migrate dev --name beschreibung

# Migration anwenden (Produktion)
npx prisma migrate deploy
```

### Seed-Daten

Testdaten können mit dem Seed-Skript geladen werden:

```bash
docker exec -it smartvillage-backend sh
npx prisma db seed
```

### Backup

```bash
# Datenbank-Backup erstellen
docker exec smartvillage-postgres pg_dump -U smartvillage smartvillage > backup.sql

# Backup wiederherstellen
docker exec -i smartvillage-postgres psql -U smartvillage smartvillage < backup.sql
```

### Direkter Datenbankzugriff

```bash
docker exec -it smartvillage-postgres psql -U smartvillage -d smartvillage
```

## Aktualisierung

Um eine neue Version des Systems zu deployen:

```bash
cd smart-village
git pull origin main

cd infra
docker compose down
docker compose build
docker compose up -d
```

Bei Schema-Änderungen werden die Migrationen beim Neustart automatisch angewendet.

## Logs

```bash
# Alle Logs
docker compose logs -f

# Nur Backend
docker compose logs -f backend

# Nur Datenbank
docker compose logs -f postgres

# Nur Nginx
docker compose logs -f nginx
```

## Dienste neu starten

```bash
# Einzelnen Dienst neu starten
docker compose restart backend

# Alle Dienste neu starten
docker compose restart

# Alles stoppen und entfernen
docker compose down

# Alles stoppen und Volumes entfernen (Datenverlust)
docker compose down -v
```

## Deployment auf dem DHBW-Server

Die Anwendung wurde für den Betrieb auf einem Proxmox-VM mit Ubuntu konfiguriert.
Die Deployment-Schritte sind:

1. Per SSH auf den Server verbinden.
2. Repository aktualisieren (`git pull`).
3. Docker-Images neu bauen und starten.

Für eine automatisierte Deployment-Pipeline kann GitHub Actions verwendet werden.
Die Dokumentation dazu befindet sich im alten Dokument `doku/Server-Sicherheit-Deployment.md`.

## Troubleshooting

**Backend startet nicht:**
- Prüfen, ob PostgreSQL gesund ist: `docker compose ps`
- Logs prüfen: `docker compose logs backend`
- Datenbankverbindung testen: `docker exec smartvillage-backend nc -z smartvillage-postgres 5432`

**Frontend nicht erreichbar:**
- Prüfen, ob Nginx läuft: `docker compose ps nginx`
- Prüfen, ob Zertifikate vorhanden sind: `ls infra/certs/`
- Nginx-Logs prüfen: `docker compose logs nginx`

**Sensordaten kommen nicht an:**
- MQTT-Broker prüfen: `docker compose logs mosquitto`
- Backend-Logs auf MQTT-Fehler prüfen: `docker compose logs backend | grep -i mqtt`
- MQTT-Konfiguration in `smartvillage.env` prüfen

**E-Mail-Verifizierung funktioniert nicht:**
- MailHog-Oberfläche prüfen: `http://localhost:8025`
- SMTP-Konfiguration in `smartvillage.env` prüfen
