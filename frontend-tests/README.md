# 🧪 Frontend Test Suite

Einfache HTML-basierte Test-Seite für manuelles Testing der Smart Village API.

## 📖 Übersicht

Diese Seite ermöglicht es dir:
- ✅ Login mit vordefinierten Credentials zu testen
- ✅ Account-Informationen abzurufen
- ✅ Sensoren zu verwalten (erstellen, löschen, auflisten)
- ✅ Sensor-Daten anzuschauen
- ✅ HTTPS mit Self-Signed Certificates zu testen

## 🚀 Verwendung

### Option 1: Lokal mit Browser öffnen
```bash
# Einfach die HTML-Datei im Browser öffnen
file:///home/leon/smart-village/frontend-tests/index.html
```

**Achtung:** Browser warnt vor Self-Signed Certificate - einfach "Fortfahren" klicken.

### Option 2: Mit lokalem HTTP Server
```bash
cd /home/leon/smart-village/frontend-tests
python3 -m http.server 8080
# Dann öffnen: http://localhost:8080/
```

## 👤 Test Credentials

```
Email:    test@test.de
Password: test1234
```

Diese Credentials werden automatisch in der Login-Form eingetragen.

## 📋 Features

### Login Tab
- Email & Passwort eingeben
- JWT Token erhalten und speichern
- Token wird automatisch für weitere Requests verwendet

### Sensoren Tab
- **📥 Sensoren laden** - Liste aller Sensoren abrufen
- **➕ Neuer Sensor** - Neuen Sensor erstellen (Type, Name, Standort)
- **🗑️ Löschen** - Sensor löschen

### Account Tab
- Account-Informationen anschauen
- User ID, Email, etc. sehen

## 🔐 Token Storage

Der JWT Token wird in `localStorage` gespeichert:
```javascript
localStorage.getItem('authToken')
localStorage.removeItem('authToken')  // Logout
```

## 🔧 Technische Details

- **test-config.js** - API Helper Funktionen
- **styles.css** - CSS Styling
- **index.html** - Haupt-HTML mit JavaScript

### API Calls

Alle API Calls über HTTPS mit Self-Signed Certificate:
```javascript
// Mit Token
apiCallWithAuth('/api/sensors', { method: 'GET' })

// Ohne Token
apiCall('/api/auth/login', { method: 'POST', body: ... })
```

## ⚠️ Browser Warnings

Beim ersten Besuch warnt der Browser vor dem Self-Signed Certificate.
**Das ist normal und gewünscht!**

Klicke auf:
1. "Advanced" / "Weitere Informationen"
2. "Proceed anyway" / "Fortfahren trotzdem"

## 🐛 Debugging

Öffne die Browser Developer Console (F12) um:
- ✅ API Responses zu sehen
- ✅ Token zu prüfen
- ✅ Fehler zu debuggen

## 📝 Beispiel API Calls

Die HTML-Seite macht diese Calls:

```
POST /api/auth/login
  { email, password }

GET /api/auth/me
  (mit Authorization Header)

GET /api/sensors
  (mit Authorization Header)

POST /api/sensors
  { name, sensorTypeId, location }

DELETE /api/sensors/{id}
  (mit Authorization Header)

POST /api/sensors/{id}/readings
  { value, status, timestamp }

GET /api/sensors/{id}/readings
```

## 🎯 Nächste Schritte

1. Docker Compose starten: `docker compose up`
2. Backend wartet auf Requests: `https://localhost:8000`
3. HTML-Seite öffnen und Login testen
4. Oder: E2E Test-Script starten (siehe test-scripts/README.md)
