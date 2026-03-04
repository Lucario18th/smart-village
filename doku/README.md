# Smart Village - Dokumentation

Dokumentation für das Smart Village Gemeindemonitoring System mit REST API und React AdminView.

**Status: Phase 5 Abgeschlossen - Production Ready**

## Schnelleinstieg (5 Minuten)

### 1. System starten
```bash
cd smart-village/infra
docker compose up -d
```

### 2. Zum Frontend
```
https://localhost/
```

### 3. Registrieren & Login
- Beliebige Email eingeben
- Passwort mit mind. 8 Zeichen, 1 Großbuchstabe, 1 Zahl, 1 Sonderzeichen
- Nach Registrierung erfolgt Auto-Login

### 4. Dokumentation lesen
→ **[QUICK-START.md](QUICK-START.md)** (3.9 KB) - Ausführliche Anleitung

## Für deine Rolle

### Administrator oder End-User
1. **[QUICK-START.md](QUICK-START.md)** - System bedienen
2. **[AdminView-Test-Guide.md](AdminView-Test-Guide.md)** - Funktionen testen
3. **[PROJEKT-ABSCHLUSS.md](PROJEKT-ABSCHLUSS.md)** - Features verstehen

### Frontend Entwickler
1. **[QUICK-START.md](QUICK-START.md)** - System starten
2. **[AdminView-Architektur.md](AdminView-Architektur.md)** - Komponenten verstehen
3. **[AdminView-API-Integration.md](AdminView-API-Integration.md)** - API nutzen
4. **[AdminView-Technische-Details.md](AdminView-Technische-Details.md)** - Code Details

### Backend Entwickler
1. **[QUICK-START.md](QUICK-START.md)** - System starten
2. **[Backend-API.md](Backend-API.md)** - API Referenz
3. **[API-ENDPUNKTE-UEBERSICHT.md](API-ENDPUNKTE-UEBERSICHT.md)** - Quick Reference
4. **[Datenbank-Schema.md](Datenbank-Schema.md)** - Datenbank verstehen

### DevOps / Sysadmin
1. **[Implementierungsanleitung.md](Implementierungsanleitung.md)** - Setup & Testing
2. **[Code-Deploy-Server.md](Code-Deploy-Server.md)** - Deployment
3. **[Server-Sicherheit-Deployment.md](Server-Sicherheit-Deployment.md)** - Produktion

### Tester / QA
1. **[AdminView-Test-Guide.md](AdminView-Test-Guide.md)** - 14 Test Szenarien
2. **[QUICK-START.md](QUICK-START.md)** - System bedienen

## Alle Dokumentationen

### Übersicht & Status
- **[PROJEKT-ABSCHLUSS.md](PROJEKT-ABSCHLUSS.md)** (9.4 KB)
  - Zusammenfassung aller implementierten Features
  - System Status und Getestete Funktionen
  - Bekannte Limitierungen
  - Zukünftige Verbesserungen

### Administrator / End-User
- **[QUICK-START.md](QUICK-START.md)** (3.9 KB)
  - System starten
  - Registrierung & Login
  - Gemeinde verwalten
  - Sensoren verwalten
  - Fehler beheben

- **[AdminView-Test-Guide.md](AdminView-Test-Guide.md)** (7.4 KB)
  - 14 detaillierte Test Szenarien
  - Schrittweise Anleitung
  - Erwartete Ergebnisse
  - Backend Verifizierung

### Frontend Development
- **[AdminView-Architektur.md](AdminView-Architektur.md)** (6.8 KB)
  - Komponenten Hierarchie
  - Hook Struktur und State Management
  - Datenfluss
  - Sensor CRUD Operationen

- **[AdminView-API-Integration.md](AdminView-API-Integration.md)** (8.5 KB)
  - Features Übersicht
  - Session Management Architektur
  - API Client Nutzung
  - Error Handling Strategien
  - Test Anleitung

- **[AdminView-Technische-Details.md](AdminView-Technische-Details.md)** (9.4 KB)
  - Code Changes Dokumentation
  - Hook und Component Details
  - API Formats und Request/Response
  - Data Flow Diagramme
  - Performance Optimizations
  - Security Considerations

- **[Frontend-API-Integration.md](Frontend-API-Integration.md)** (8.8 KB)
  - API Client Architektur
  - Token Management
  - Authentifizierung Flow
  - Error Handling

### Backend Development
- **[Backend-API.md](Backend-API.md)** (8.2 KB)
  - Alle Endpunkte dokumentiert
  - Request/Response Formate
  - Authentifizierung und JWT
  - Error Handling Beispiele
  - Pagination

- **[API-ENDPUNKTE-UEBERSICHT.md](API-ENDPUNKTE-UEBERSICHT.md)** (6.0 KB)
  - Schnelle API Referenz
  - Alle Routes mit HTTP Methods
  - curl Beispiele

### Datenbank
- **[Datenbank-Schema.md](Datenbank-Schema.md)** (7.2 KB)
  - Alle Tabellen und Modelle
  - Relationen und Foreign Keys
  - Indizes und Constraints
  - Enums und Defaults
  - Prisma Migrations

- **[Datenbanken.md](Datenbanken.md)** (4.8 KB)
  - PostgreSQL Setup
  - Migrations und Versions
  - Backup und Restore
  - Maintenance

### Deployment & Operations
- **[Implementierungsanleitung.md](Implementierungsanleitung.md)** (6.6 KB)
  - Installation und Setup
  - Docker Konfiguration
  - Testing und Validation
  - Integration Checklist

- **[Code-Deploy-Server.md](Code-Deploy-Server.md)** (3.9 KB)
  - Deployment auf Server
  - Updates und Patches
  - Rollback Prozedur

- **[Server-Sicherheit-Deployment.md](Server-Sicherheit-Deployment.md)** (5.5 KB)
  - Sicherheits-Checklist
  - SSL Zertifikate
  - Firewall Rules
  - Secrets Management

## System Architektur

```
Frontend (React)
├── Components
│   ├── LoginView
│   ├── RegisterView
│   ├── AdminView
│   │   ├── AdminSectionPanel
│   │   └── Sensor CRUD Forms
│   └── ...
├── Hooks
│   ├── useAdminAuth (Authentifizierung)
│   └── useVillageConfig (Gemeinde & Sensoren)
└── API Client (src/api/client.js)

Backend (NestJS)
├── Controllers
│   ├── auth.controller
│   ├── village.controller
│   ├── sensor.controller
│   └── sensor-reading.controller
├── Services
│   ├── auth.service
│   ├── sensor.service
│   └── ...
└── Prisma ORM
    └── PostgreSQL Datenbank

Infrastruktur (Docker)
├── nginx (Reverse Proxy + HTTPS)
├── backend (NestJS Container)
└── postgres (PostgreSQL Container)
```

## API Endpunkte (Zusammenfassung)

```
POST   /api/auth/register          - Neue Benutzer
POST   /api/auth/login             - Login
GET    /api/auth/me                - Aktueller User

GET    /api/villages/:id           - Gemeinde mit Sensoren
PUT    /api/villages/:id           - Gemeinde aktualisieren

GET    /api/sensor-types           - Alle Sensor-Typen
POST   /api/sensors/village/:id    - Neuer Sensor
PATCH  /api/sensors/:id            - Sensor aktualisieren
DELETE /api/sensors/:id            - Sensor löschen

POST   /api/sensor-readings        - Neue Messung
GET    /api/sensor-readings        - Messungen abrufen
```

Vollständige Dokumentation: **[Backend-API.md](Backend-API.md)** und **[API-ENDPUNKTE-UEBERSICHT.md](API-ENDPUNKTE-UEBERSICHT.md)**

## Docker Commands

```bash
# Alle Container starten
docker compose up -d

# Logs anschauen
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f nginx

# Container Status
docker compose ps

# Stop & Start
docker compose stop
docker compose start

# Alles neubuild
docker compose up --build -d

# Datenbank zurücksetzen (!)
docker compose down -v
docker compose up -d
```

## Testing

```bash
# API mit curl testen
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'

# Datenbank direkt queryen
docker compose exec postgres psql -U smartvillage_user -d smartvillage_db

# Frontend Tests durchgehen
# Siehe: AdminView-Test-Guide.md (14 Test Szenarien)
```

## Dokumentations Überblick

| Kategorie | Dateien | Größe |
|-----------|---------|-------|
| Quick Start | 2 | 7.8 KB |
| Frontend | 4 | 33.5 KB |
| Backend | 2 | 14.2 KB |
| Datenbank | 2 | 12.0 KB |
| Deployment | 3 | 13.4 KB |
| **Gesamt** | **13** | **~122 KB** |

## Wichtige Features

- ✅ Benutzer Registration & Login
- ✅ Gemeinde Konfiguration (CRUD)
- ✅ Sensor Verwaltung (CRUD)
- ✅ JWT Token Authentifizierung
- ✅ REST API mit NestJS
- ✅ PostgreSQL Datenbank
- ✅ Docker Container Orchestration
- ✅ HTTPS mit Nginx
- ✅ Responsive React UI
- ✅ Error Handling & Validation

## Was wird nicht (noch) unterstützt

- Sensor Readings Visualisierung (API vorhanden, UI nicht)
- Module Settings API Integration (lokal funktionierend)
- Real-time Updates via WebSockets
- Offline-First Support
- Concurrent User Konflikt-Erkennung

## Hilfreich zum Beginnen

1. Projekt klonen / aktuell halten
2. **[QUICK-START.md](QUICK-START.md)** komplett lesen
3. Docker starten und System testen
4. Je nach Rolle zusätzliche Docs lesen
5. Dokumentation bei Fragen konsultieren

## Support

- Logs prüfen: `docker compose logs backend`
- Datenbank direkt queryen: `docker exec postgres psql ...`
- Browser DevTools für Frontend Debugging (F12)
- Artikel "Fehler beheben" in **[QUICK-START.md](QUICK-START.md)**

## Hinweise

- Alle Dokumentation ist in **Deutsch** geschrieben
- Keine **Emojis** in Dokumentationen
- Alle Dateien im **Markdown Format** (.md)
- Code-Beispiele in entsprechenden Sprachen (JavaScript, SQL, Bash, etc.)

---

**Projekt Status: Phase 5 Fertig - Production Ready**

Für Fragen oder Probleme siehe die entsprechende Dokumentation für deine Rolle.
