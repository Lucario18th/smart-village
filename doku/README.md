Dokumentation: Smart Village

Projektdokumentation und Guides fuer das Smart Village Gemeindemonitoring System

Neue API Integration (2026-03-04)

Diese Dokumentation beschreibt die Smart Village REST API und deren Frontend-Integration mit React.

Schnelleinstieg

1. API-ENDPUNKTE-UEBERSICHT.md - Start hier!
   Schnelle Referenz aller API Endpunkte mit curl Beispielen und JavaScript Nutzung

2. Implementierungsanleitung.md
   Setup, Testing, und Integration Guide fuer Entwickler

Detaillierte Dokumentation

Backend-API.md
Komplette Referenz aller REST API Endpunkte mit:
- Request/Response Formate
- Authentifizierung und JWT
- Error Handling und Statuscodes
- Pagination Beispiele

Frontend-API-Integration.md
Frontend Architektur und Integration mit Backend:
- API Client Schicht (src/api/client.js)
- React Hooks (useAdminAuth, useVillageConfig)
- JWT Token Management in localStorage
- Kompletter Datenfluss

AdminView-Architektur.md
AdminView Komponenten und State Management:
- Komponenten Hierarchie
- useAdminAuth und useVillageConfig Hooks
- Sensor CRUD Operationen
- Loading States und Error Handling
- Performance Optimierungen

Datenbank-Schema.md
PostgreSQL Datenbankschema Dokumentation:
- Account, Village, Sensor, SensorType, SensorReading Modelle
- Relationen und Foreign Keys
- Constraints und Indizes
- Prisma Migrations
- Backups und Recovery

System Dokumentation

Code-Deploy-Server.md
Server Deployment und Infrastruktur Konfiguration

Server-Sicherheit-Deployment.md
Sicherheit, HTTPS, und Produktion Best Practices

Netzwerk- und Zugriffskonzept.md
Netzwerk Architektur und Zugriffskontrolle

Datenbanken.md
Datenbankeinrichtung, Verwaltung und Maintenance

Projektstruktur

backend/
  src/
    village/ - Neue Village API (2026-03-04)
    sensor/ - Sensor Management
    auth/ - Authentifizierung
    prisma/ - Datenbankverbindung

website/
  src/
    api/client.js - Zentrale API Kommunikation
    hooks/ - useAdminAuth, useVillageConfig
    components/ - React UI Komponenten

infra/
  docker-compose.yml - Container Orchestrierung
  nginx/ - Reverse Proxy Konfiguration

Entwicklertools

curl testen
curl -H "Authorization: Bearer <TOKEN>" https://localhost/api/villages/1

Docker Logs
docker logs smartvillage-backend
docker logs smartvillage-postgres
docker logs smartvillage-nginx

Datenbank abfragen
docker exec smartvillage-postgres psql -U postgres smart_village_db -c "SELECT * FROM \"Account\";"

Frontend bauen
cd website && npm install && npm run build

Backend bauen
cd backend && npm install && npm run build

Weitere Dokumentation

In diesem Verzeichnis befindet sich die Projektdokumentation

