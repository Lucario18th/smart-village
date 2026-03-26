# Smoke Tests – Datenbank & API

Dieses Dokument beschreibt manuelle und skriptbasierte Smoke Tests, um nach einer Migration oder einem Deployment sicherzustellen, dass das System korrekt funktioniert.

---

## Voraussetzungen

- Docker Compose läuft (`docker compose ps` zeigt alle Services als `running`)
- PostgreSQL ist erreichbar und Prisma-Migrationen wurden ausgeführt
- Backend antwortet auf Health-Endpoint

---

## 1. Health Check – Backend erreichbar

```bash
curl -k https://localhost/api/health
```

**Erwartete Antwort:**
```json
{ "status": "ok" }
```

Fehlt diese Antwort, sind Backend oder Nginx nicht gestartet:
```bash
docker compose logs backend
docker compose logs nginx
```

---

## 2. Datenbankmigrationen verifizieren

```bash
docker compose exec backend npx prisma migrate status
```

**Erwartetes Ergebnis:** Alle Migrationen als `Applied` markiert, keine `Pending`-Migrationen.

Bei ausstehenden Migrationen:
```bash
docker compose exec backend npx prisma migrate deploy
```

---

## 3. Datenbankverbindung testen

```bash
docker compose exec postgres psql -U smartvillage -d smartvillage -c "\dt"
```

**Erwartetes Ergebnis:** Liste aller Tabellen (Account, Village, Device, Sensor, SensorReading, SensorType, VillageFeatures, …).

---

## 4. API-Endpunkte testen (ohne Auth)

### Öffentliche App-API – Villages auflisten

```bash
curl -k https://localhost/api/app/villages
```

**Erwartetes Ergebnis:** JSON-Array mit Villages (kann leer sein `[]`).

### Health-Endpunkt

```bash
curl -k https://localhost/api/health
```

**Erwartetes Ergebnis:** `{"status":"ok"}`

---

## 5. Authentifizierung testen

### Registrierung (neuer Account)

```bash
curl -k -X POST https://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Smoke Test"}'
```

**Erwartetes Ergebnis:** HTTP 201, Bestätigungs-E-Mail erscheint in MailHog unter http://localhost:8025.

### Login (verifizierter Account)

```bash
curl -k -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**Erwartetes Ergebnis:** HTTP 200 mit `access_token`.

---

## 6. MQTT-Broker testen

### Verbindung prüfen

```bash
docker compose exec mosquitto mosquitto_pub \
  -h localhost -p 1883 \
  -t "sv/1/test-device/sensors/1" \
  -m '{"value":21.5,"ts":"2026-01-01T00:00:00Z","status":"OK","unit":"C"}'
```

**Erwartetes Ergebnis:** Kein Fehler; im Backend-Log (`docker compose logs backend`) erscheint die eingehende MQTT-Nachricht.

### Topic abonnieren (in zweitem Terminal)

```bash
docker compose exec mosquitto mosquitto_sub \
  -h localhost -p 1883 \
  -t "sv/#"
```

---

## 7. Seed-Daten einspielen (optional)

```bash
docker compose exec backend npx prisma db seed
```

**Erwartetes Ergebnis:** Erfolgsmeldung, Seed-Daten (Demo-Village, Sensoren, Sensortypen) in der Datenbank vorhanden.

Verifizieren:
```bash
curl -k https://localhost/api/app/villages
```

---

## 8. Produktiv-System (DHBW-Netz)

Für Smoke Tests gegen das Produktivsystem unter https://192.168.23.113:

```bash
# Health Check
curl -k https://192.168.23.113/api/health

# Öffentliche Villages
curl -k https://192.168.23.113/api/app/villages
```

> **Hinweis:** Das Produktivsystem ist ausschließlich im DHBW-internen Netzwerk erreichbar.

---

## 9. Checkliste nach Deployment / Migration

| Schritt | Befehl / Aktion | Erwartet |
|---|---|---|
| Backend läuft | `docker compose ps backend` | `Up` |
| PostgreSQL läuft | `docker compose ps postgres` | `Up` |
| Migrationen applied | `npx prisma migrate status` | Alle `Applied` |
| Health-Endpoint | `GET /api/health` | `{"status":"ok"}` |
| App-API Villages | `GET /api/app/villages` | HTTP 200, JSON-Array |
| MQTT erreichbar | `mosquitto_pub` Testpublikation | Kein Verbindungsfehler |
| MailHog erreichbar | Browser → http://localhost:8025 | MailHog-UI lädt |

---

## Weiterführende Dokumente

- Deployment-Anleitung: `../betrieb/deployment.md`
- Sicherheitskonzept: `../betrieb/sicherheit.md`
- MQTT-Integration: `../backend/mqtt-integration.md`
- API-Referenz: `../api/endpunkte.md`
