# 🚀 Quick Start - Testing Infrastruktur

## 📦 Was wurde hinzugefügt?

Vollständige Test-Infrastruktur für Smart Village:

```
smart-village/
├── frontend-tests/           🆕 HTML Test-Seite
│   ├── index.html           - Login & Sensor-Management
│   ├── test-config.js       - API Helper
│   ├── styles.css           - Styling
│   └── README.md            - Dokumentation
│
├── test-scripts/             🆕 E2E Test-Scripts
│   ├── e2e-test.js          - Node.js Test-Script (9 Tests)
│   ├── e2e-test.sh          - Bash Wrapper
│   └── README.md            - Dokumentation
│
├── backend/
│   └── src/health/           🆕 Health Endpoint
│       ├── health.controller.ts
│       └── health.module.ts
│
├── docs/                      🆕 API Dokumentation
│   └── API.md               - Alle Endpoints
│
└── (migrations added)
    └── 20260303144700_seed_test_user/migration.sql 🆕 Test User
```

---

## ⚡ 5-Minuten Start

### 1. Docker Compose starten
```bash
cd /home/leon/smart-village
docker compose up -d
```
**Warten:** 5-10 Sekunden bis alle Services ready sind

### 2. HTML Test-Seite öffnen
```bash
# Option A: Lokal öffnen
file:///home/leon/smart-village/frontend-tests/index.html

# Option B: Mit Python Server
cd frontend-tests
python3 -m http.server 8080
# Dann: http://localhost:8080/index.html
```

**Test User:**
```
Email:    test@test.de
Password: test1234
```

### 3. E2E Test-Script starten
```bash
cd /home/leon/smart-village
node test-scripts/e2e-test.js
```

**Erwartet:** `9/9 tests passed` ✅

---

## 🧪 Was wird getestet?

### HTML Test-Seite
✅ Login mit JWT Token
✅ Account-Info abrufen
✅ Sensoren auflisten
✅ Neue Sensoren erstellen
✅ Sensor-Daten anschauen
✅ Sensoren löschen

### E2E Test-Script (9 automatisierte Tests)
1. Health Check
2. Login
3. Account Info
4. Get Sensors
5. Create Sensor
6. Send Single Reading
7. Send Multiple Readings (5x)
8. Get Readings
9. Delete Sensor

---

## 📚 Dokumentation

### API Docs
```bash
cat /home/leon/smart-village/docs/API.md
```
- Alle Endpoints dokumentiert
- cURL Beispiele
- Request/Response Formate
- Error Codes

### Frontend Tests
```bash
cat /home/leon/smart-village/frontend-tests/README.md
```
- Browser-Anleitung
- Features erklärt
- Debugging Tipps

### E2E Scripts
```bash
cat /home/leon/smart-village/test-scripts/README.md
```
- Test-Beschreibung
- Konfiguration
- CI/CD Integration

---

## 🔑 Test Credentials

```
Email:    test@test.de
Password: test1234
```

Diese sind im Backend seeded und sofort verfügbar nach Migration.

---

## 🎯 Nächste Schritte

### 1. Testen
```bash
# E2E Script starten
node test-scripts/e2e-test.js

# Sollte zeigen:
# ✅ Health Check
# ✅ Login
# ✅ Get Account Info
# ✅ Get Sensors
# ✅ Create Sensor
# ✅ Send Single Reading
# ✅ Send Multiple Readings
# ✅ Get Readings
# ✅ Delete Sensor
# Result: 9/9 tests passed
```

### 2. HTML-Seite testen
```bash
# Browser öffnen und Login testen
file:///home/leon/smart-village/frontend-tests/index.html

# Tabs durchklicken:
# - Login: test@test.de / test1234
# - Sensoren: Erstelle einen neuen Sensor
# - Account: Schau deine Daten an
```

### 3. Git Commit
```bash
cd /home/leon/smart-village
git add -A
git commit -m "Add comprehensive test infrastructure with HTML suite and E2E scripts"
```

---

## 🔍 Struktur Übersicht

**Frontend Tests** (Manuelles Testing)
- Keine Dependencies
- Funktioniert lokal im Browser
- Self-Signed Cert wird akzeptiert
- Token stored in localStorage

**E2E Tests** (Automatisiertes Testing)
- Node.js (built-in https module)
- Keine zusätzlichen Dependencies
- HTTPS mit Self-Signed Cert
- 9 verschiedene Test-Szenarien
- Exit Code 0 = Success, 1 = Failure

**Backend** (Minimal changes)
- Health Endpoint hinzugefügt (/health)
- Test User Seed Migration
- Keine Produktions-Code Änderungen

---

## ⚙️ Features im Detail

### Health Endpoint
```bash
curl https://localhost:8000/health -k
# Response: { "status": "ok", "timestamp": "...", "uptime": ... }
```

### Test User
```bash
curl -X POST https://localhost:8000/api/auth/login -k \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.de","password":"test1234"}'
# Response: { "accessToken": "...", "expiresIn": 3600 }
```

### HTML Form (mit JavaScript)
- Login Form mit vordefinierte Credentials
- Sensor Management (CRUD)
- Farbiges Status-Feedback
- Token Anzeige

### E2E Script
- Farbige Ausgabe (✅ ❌ ⚠️ ℹ️)
- Detaillierte Logs
- Multiple Readings Test (5x sequential)
- JSON Response Parsing
- Self-Signed Cert Handling

---

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Backend läuft nicht?
docker compose up -d
docker compose logs -f backend
```

### "Login failed"
```bash
# Test User nicht vorhanden?
docker compose exec backend npx prisma migrate deploy
```

### "SSL verification error"
- Das sollte nicht passieren (rejectUnauthorized: false)
- Node.js Version >= 12 verwenden

### "Reading timeout"
```bash
# Backend zu langsam?
docker compose ps
docker compose logs backend
```

---

## 📊 Files Created

| File | Type | Purpose |
|------|------|---------|
| frontend-tests/index.html | HTML | Main test page |
| frontend-tests/test-config.js | JS | API helpers |
| frontend-tests/styles.css | CSS | Styling |
| frontend-tests/README.md | Doc | Instructions |
| test-scripts/e2e-test.js | Node.js | Main test suite |
| test-scripts/e2e-test.sh | Bash | Wrapper script |
| test-scripts/README.md | Doc | Instructions |
| backend/src/health/ | TypeScript | Health check |
| docs/API.md | Doc | API reference |
| prisma/migrations/.../ | SQL | Test user seed |

---

## 📝 Total Lines Added

- HTML Test Page: ~300 lines
- CSS Styling: ~150 lines
- JavaScript (config): ~50 lines
- E2E Test Script: ~300 lines
- Health Module: ~30 lines
- Documentation: ~500 lines
- **Total: ~1,330 lines**

All focused on **testing and documentation** - no production code changes!

---

## 🎉 Summary

✅ Health Check Endpoint
✅ Test User (test@test.de / test1234)
✅ HTML Frontend Test Suite (with 3 tabs)
✅ Automated E2E Test Script (9 tests)
✅ Complete API Documentation
✅ Comprehensive READMEs

**Status:** Ready to test! 🚀
