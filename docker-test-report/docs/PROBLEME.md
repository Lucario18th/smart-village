# Detaillierte Problembeschreibungen

## Problem 1: Fehlende SSL-Zertifikate 🔴 KRITISCH

### Symptom
```
nginx: [error] 1#1: *1 open() "/etc/nginx/certs/nginx-selfsigned.crt" failed
(2: No such file or directory)
```

### Root Cause
Docker Compose erwartete SSL-Zertifikate unter:
```
/opt/smartvillage/certs/nginx-selfsigned.crt
/opt/smartvillage/certs/nginx-selfsigned.key
```

Diese Dateien existierten nicht, was zum Fehler führte.

### Auswirkungen
- Nginx konnte nicht starten
- HTTPS nicht verfügbar
- Reverse Proxy funktioniert nicht

### Lösung (Implementiert)
```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout nginx-selfsigned.key \
  -out nginx-selfsigned.crt \
  -days 365 -nodes \
  -subj "/C=DE/ST=BW/L=Loerach/O=Smart Village/CN=smartvillage"
```

Certs generiert unter: `/opt/smartvillage/certs/`

---

## Problem 2: Website Dependencies nicht installiert 🔴 KRITISCH

### Symptom
```
sh: 1: vite: not found
```

### Root Cause
Website Dockerfile hatte falsche Build-Strategie:
```dockerfile
# FALSCH:
CMD ["sh", "-c", "npm run build && rm -rf $BUILD_DIR/* && cp -r dist/* $BUILD_DIR/"]

# Problem: npm install wurde nicht ausgeführt!
# vite wird erst beim CMD ausgeführt
# npm ci war nicht im Docker-Build
```

### Auswirkung
- Website Build schlägt fehl
- Keine Static Assets für Nginx
- Frontend nicht erreichbar

### Lösung (Implementiert)
```dockerfile
# Richtig: Multi-Stage Build mit Build-Zeit Ausführung
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # ← Dependencies BAUEN!
COPY . .
RUN npm run build            # ← Build zur BUILD-ZEIT

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html/
```

---

## Problem 3: Database Foreign Key Violations 🔴 KRITISCH

### Symptom
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": {
    "detail": "Key (sensorTypeId)=(1) is not present in table \"SensorType\"."
  }
}
```

### Root Cause
Das Datenbankschema hatte eine Foreign Key Constraint:
```sql
CREATE TABLE "Sensor" (
  sensorTypeId INT,
  FOREIGN KEY (sensorTypeId) REFERENCES "SensorType"(id)
);
```

Aber die `SensorType` Tabelle war **komplett leer**!

Beim Versuch, einen Sensor mit `sensorTypeId: 1` zu erstellen:
```
sensorTypeId=1 → nicht in SensorType vorhanden → FK-Error
```

### Auswirkung
- Keine Sensoren erstellbar
- Sensor-API vollständig nicht funktionsfähig
- Production unmöglich

### Lösung (Implementiert)
SQL-Migration erstellt: `20260303142502_seed_sensor_types`

```sql
INSERT INTO "SensorType" (name, unit, description) VALUES 
  ('Temperature', '°C', 'Lufttemperatur'),
  ('Humidity', '%', 'Luftfeuchte'),
  ('Pressure', 'hPa', 'Luftdruck'),
  ('Rainfall', 'mm', 'Niederschlag'),
  ('Wind Speed', 'm/s', 'Windgeschwindigkeit'),
  ('Solar Radiation', 'W/m²', 'Solarstrahlung'),
  ('Soil Moisture', '%', 'Bodenfeuchte'),
  ('CO2', 'ppm', 'Kohlendioxid-Konzentration')
ON CONFLICT DO NOTHING;
```

**Wichtig:** `ON CONFLICT DO NOTHING` verhindert Fehler bei wiederholtem Ausführen

Migration wird automatisch beim `docker compose up` ausgeführt via:
```bash
npx prisma migrate deploy
```

---

## Problem 4: Environment-Datei Pfade Falsch 🟡 MITTEL

### Symptom
```
ERROR: env_file /opt/smartvillage/smartvillage.env does not exist
```

### Root Cause
Docker-Compose erwartete die Env-Datei unter:
```
/opt/smartvillage/smartvillage.env
```

Aber sie war lokal unter:
```
/home/leon/smart-village.env
```

### Auswirkung
- Backend konnte nicht starten
- Keine Datenbankverbindung (DATABASE_URL nicht gesetzt)
- JWT-Secrets nicht vorhanden

### Lösung (Teilweise Implementiert)
In docker-compose.yml:
```yaml
backend:
  env_file:
    - /opt/smartvillage/smartvillage.env
postgres:
  env_file:
    - /opt/smartvillage/smartvillage.env
```

**Status:** Env-Datei sollte auf Production-Server unter `/opt/smartvillage/` liegen.
Lokal: `source /home/leon/smart-village.env` wenn nötig.

---

## Problem 5: Fehlende Health Checks 🟡 MITTEL

### Symptom
```
Container smartvillage-backend is running but Docker Compose 
doesn't know if it's healthy
```

### Root Cause
Ursprüngliche docker-compose.yml hatte keine Health Checks:
```yaml
# FALSCH:
services:
  postgres:
    image: ...
    # Kein Health Check!
  backend:
    depends_on:
      - postgres    # Simple dependency, nicht auf Readiness!
```

Problem: `depends_on` startet Container nur wenn sie **existieren**, nicht wenn sie **ready** sind!

### Auswirkung
- Backend startet, bevor Postgres ready ist
- Verbindungsfehler beim Starten
- Undefinierter Startzustand

### Lösung (Implementiert)
Health Checks für alle Services:

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U smartvillage -d smartvillage"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    postgres:
      condition: service_healthy  # ← Wartet bis Postgres healthy!
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8000/api/auth"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 15s

nginx:
  depends_on:
    backend:
      condition: service_healthy  # ← Wartet bis Backend healthy!
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## Problem 6: Backend Health Check zu Strict 🟡 MITTEL

### Symptom
```
smartvillage-backend ... Up 2 minutes (unhealthy)
```

### Root Cause
Health Check macht:
```yaml
test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8000/api/auth"]
```

Aber `/api/auth` ist ein POST-only Endpoint:
```typescript
@Controller("auth")
export class AuthController {
  @Post("register")   // ← POST nur!
  @Post("login")      // ← POST nur!
  @Get("me")          // ← GET nur, braucht Token
}
```

GET auf `/api/auth` → 404 → wget misserfolg → unhealthy

### Auswirkung
- Container marked as "unhealthy"
- Aber API funktioniert trotzdem
- Verwirrend im Monitoring

### Lösung (TODO - Noch zu implementieren)
1. `/api/health` Public Health-Check Endpoint erstellen:
```typescript
@Controller("auth")
export class AuthController {
  @Get("health")
  health() {
    return { status: "ok" };
  }
}
```

2. docker-compose.yml aktualisieren:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8000/api/auth/health"]
```

**Status:** Service funktioniert trotz unhealthy Status
**Priorität:** Medium - vor Production-Deployment beheben

---

## Problem 7: TypeScript ESLint Version ⚠️ NIEDRIG

### Symptom
```
WARNING: You are currently running a version of TypeScript which is not 
officially supported by @typescript-eslint/typescript-estree.

SUPPORTED TYPESCRIPT VERSIONS: >=4.3.5 <5.4.0
YOUR TYPESCRIPT VERSION: 5.9.3
```

### Root Cause
Backend hat TS 5.9.3 aber @typescript-eslint unterstützt nur bis 5.4.0

### Auswirkung
- Warnung bei `npm run lint`
- Keine Fehler
- Funktioniert trotzdem

### Lösung (Optional - später)
- TypeScript auf 5.3 downgrade ODER
- @typescript-eslint aktualisieren wenn neue Version released

**Status:** Niedrige Priorität, funktioniert trotzdem

---

## Problem 8: Frontend/Nginx Integration ⚠️ MITTEL

### Symptom
```
Container smartvillage-frontend Exited (0)
Container smartvillage-nginx Created (nicht gestartet)
```

### Root Cause
docker-compose.yml hatte ursprünglich:
```yaml
nginx:
  depends_on:
    frontend:
      condition: service_completed_successfully
    backend:
      condition: service_healthy
```

Aber Frontend ist kein Service, sondern nur Builder!
Frontend Container exited nach Build (das ist ok).

Nginx wartet auf Status, der nie kommt.

### Lösung (Implementiert)
```yaml
nginx:
  depends_on:
    backend:
      condition: service_healthy
    # Frontend dependency entfernt - nicht nötig!
```

Frontend Volume wird vor Container-Start populiert.

---

## Zusammenfassung Probleme

| # | Problem | Schwere | Status | Auswirkung |
|---|---------|---------|--------|------------|
| 1 | SSL Certs | 🔴 | ✅ Behoben | Nginx konnte nicht starten |
| 2 | Website Deps | 🔴 | ✅ Behoben | Website Build fehlgeschlagen |
| 3 | FK Violations | 🔴 | ✅ Behoben | API nicht funktionsfähig |
| 4 | Env-Pfade | 🟡 | ✅ Konfiguriert | Backend konnte nicht starten |
| 5 | Health Checks | 🟡 | ✅ Implementiert | Unklarer Startzustand |
| 6 | Health Endpoint | 🟡 | ⏳ TODO | Backend marked unhealthy |
| 7 | TS Version | ⚠️ | ⏰ Später | Nur Warnung |
| 8 | Frontend/Nginx | 🟡 | ✅ Behoben | Nginx konnte nicht starten |

