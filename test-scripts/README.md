# 🧪 E2E Test Scripts

Automatisierte Test-Scripts zum Testen der Smart Village API über HTTPS mit Self-Signed Certificates.

## 📖 Übersicht

Dieses Package enthält:
- `e2e-test.js` - Haupttest-Script (Node.js)
- `e2e-test.sh` - Bash Wrapper zum Starten

## 🚀 Starten

### Option 1: Direkt mit Node.js
```bash
cd /home/leon/smart-village/test-scripts
node e2e-test.js
```

### Option 2: Mit Bash Wrapper
```bash
cd /home/leon/smart-village/test-scripts
bash e2e-test.sh
# oder einfach
./e2e-test.sh
```

## 👤 Test Credentials

Das Script verwendet automatisch:
```
Email:    test@test.de
Password: test1234
```

Diese wurden im Backend seeded und sind sofort verfügbar.

## ✅ Was wird getestet?

Das Script führt **9 automatisierte Tests** durch:

1. **Health Check** - `GET /health`
   - Prüft ob Backend läuft
   
2. **Login** - `POST /api/auth/login`
   - Authentifiziert den Test-User
   - Speichert JWT Token
   
3. **Get Account Info** - `GET /api/auth/me`
   - Prüft Account Daten
   - Verwendet Bearer Token
   
4. **Get Sensors** - `GET /api/sensors`
   - Lädt alle Sensoren des Users
   
5. **Create Sensor** - `POST /api/sensors`
   - Erstellt einen neuen Test-Sensor
   - Type: Temperature (ID: 1)
   
6. **Send Single Reading** - `POST /api/sensors/{id}/readings`
   - Sendet eine Sensor-Messung
   
7. **Send Multiple Readings** - 5x Sensor-Daten
   - Testet mehrere Requests hintereinander
   - Zufällige Temperatur-Werte (10-40°C)
   
8. **Get Readings** - `GET /api/sensors/{id}/readings`
   - Prüft ob Daten gespeichert wurden
   
9. **Delete Sensor** - `DELETE /api/sensors/{id}`
   - Löscht den Test-Sensor

## 🎨 Ausgabe

Das Script gibt farbige Ausgabe:
```
✅ Erfolg - grün
❌ Fehler - rot
⚠️  Warnung - gelb
ℹ️  Info - cyan
```

**Beispiel Output:**
```
╔════════════════════════════════════════════════╗
║     Smart Village E2E Test Suite                ║
║     Testing HTTPS with Self-Signed Certs       ║
╚════════════════════════════════════════════════╝

ℹ️  API URL: https://localhost:8000
ℹ️  Test User: test@test.de
⚠️  SSL Verification: DISABLED (self-signed certs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: Health Check

✅ Health check successful
```

## 🔐 HTTPS & Self-Signed Certificates

Das Script akzeptiert automatisch Self-Signed Certificates:
```javascript
rejectUnauthorized: false
```

Das ist notwendig weil das Backend mit selbstsigniertem Cert läuft.

## ⚙️ Konfiguration

Änderungen in der Config-Section des Scripts:
```javascript
const CONFIG = {
  API_URL: 'https://localhost:8000',
  TEST_USER: {
    email: 'test@test.de',
    password: 'test1234',
  },
};
```

## 🔄 Exit Codes

- `0` - Alle Tests erfolgreich ✅
- `1` - Tests fehlgeschlagen ❌

Das ermöglicht es, das Script in CI/CD Pipelines zu nutzen.

## 🐛 Debugging

### Script mit Debug-Ausgabe starten
```bash
node --inspect e2e-test.js
```

### Spezifische Tests debuggen
Kommentiere im Script die Test-Calls aus/ein:
```javascript
// results.push({ name: 'Health Check', passed: await testHealth() });
results.push({ name: 'Login', passed: await testLogin() });
// ...
```

## 📝 Abhängigkeiten

- Node.js (built-in `https` module)
- Keine zusätzlichen npm packages nötig
- Einfach zu deployen

## 🎯 Use Cases

1. **CI/CD Integration** - Tests vor Production Deploy
2. **Health Monitoring** - Regelmäßige Tests per Cron
3. **Development** - Quick Testing während der Entwicklung
4. **Load Testing** - Script mehrfach parallel starten

### Beispiel: Mehrfach parallel
```bash
for i in {1..5}; do
  node e2e-test.js &
done
wait
```

## 📊 Sensor Daten Format

Das Script sendet Sensor-Daten im Format:
```javascript
{
  value: "25.43",        // Temperatur als String
  status: "OK",          // Status: OK, WARN, ERROR
  timestamp: "2026-03-03T14:50:00.000Z"  // ISO 8601
}
```

## 🚀 Nächste Schritte

1. **Docker Compose starten:**
   ```bash
   cd /home/leon/smart-village
   docker compose up -d
   ```

2. **Warten bis Backend ready ist** (5-10 Sekunden)

3. **Test-Script starten:**
   ```bash
   node test-scripts/e2e-test.js
   ```

4. **Resultate prüfen** - Sollte `9/9 tests passed` sein ✅

## ✅ Expected Output

Bei erfolgreichem Durchlauf:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Summary

✅ Health Check
✅ Login
✅ Get Account Info
✅ Get Sensors
✅ Create Sensor
✅ Send Single Reading
✅ Send Multiple Readings
✅ Get Readings
✅ Delete Sensor

Result: 9/9 tests passed
```

## 🆘 Troubleshooting

### "Connection refused"
- Backend läuft nicht - `docker compose up` starten
- Falscher Port - Prüfe ob 8000 korrekt ist

### "Login failed"
- Test-User existiert nicht - Migration prüfen
- Passwort falsch - Prüfe test1234

### "SSL verification failed"
- Das sollte nicht passieren - rejectUnauthorized ist auf false
- Node.js Version >= 12 verwenden

### "Read timeout"
- Backend ist langsam - Debugging starten
- Docker Compose Health Checks prüfen
