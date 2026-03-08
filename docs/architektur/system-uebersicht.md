# Systemarchitektur

## Architekturstil

Das Smart-Village-System folgt einer klassischen Drei-Schichten-Architektur.
Das Frontend bildet die Präsentationsschicht, das Backend die Geschäftslogik und die Datenbank die Datenhaltung.
Die Kommunikation zwischen Frontend und Backend erfolgt über eine REST-API.
Zusätzlich gibt es einen MQTT-Kanal für die Echtzeitdatenerfassung von IoT-Geräten.

Alle Komponenten laufen als Docker-Container und sind über ein gemeinsames Netzwerk verbunden.

## Backend-Module

Das Backend ist mit NestJS in TypeScript geschrieben.
Es ist in mehrere Module aufgeteilt, die jeweils eine klar abgegrenzte Aufgabe haben.

| Modul | Verzeichnis | Aufgabe |
|-------|-------------|---------|
| AppModule | `backend/src/` | Hauptmodul, registriert alle anderen Module |
| AuthModule | `backend/src/auth/` | Registrierung, Login, JWT-Authentifizierung, E-Mail-Verifizierung |
| VillageModule | `backend/src/village/` | Gemeindedaten lesen und aktualisieren |
| SensorModule | `backend/src/sensor/` | Sensoren, Sensortypen und Messwerte verwalten |
| DeviceModule | `backend/src/device/` | IoT-Geräte (Controller) verwalten |
| LocationModule | `backend/src/location/` | Postleitzahl- und Ortssuche |
| AdminModule | `backend/src/admin/` | Administratorfunktionen (Kontolöschung) |
| MqttModule | `backend/src/mqtt/` | MQTT-Verbindung und Nachrichtenverarbeitung |
| PrismaModule | `backend/src/prisma/` | Datenbankzugriff über Prisma ORM |

Jedes Modul besteht typischerweise aus einem Controller (HTTP-Endpunkte), einem Service (Geschäftslogik) und gegebenenfalls DTOs (Data Transfer Objects) für die Validierung.

Vermutlich wurde die Aufteilung in Module gewählt, um die Trennung der Zuständigkeiten (Separation of Concerns) umzusetzen.
Jedes Modul kann unabhängig getestet und gewartet werden.

**Hinweis:** Das Modul `backend/src/mobile/` gehört zur Mobile API und ist in dieser Dokumentation nicht beschrieben.

## Frontend-Aufbau

Das Frontend ist eine React-Anwendung, die mit Vite gebaut wird.
Es handelt sich um eine Single-Page-Application (SPA), die nach dem Build als statische Dateien über Nginx ausgeliefert wird.

Die wichtigsten Schichten im Frontend sind:

| Schicht | Verzeichnis | Aufgabe |
|---------|-------------|---------|
| Einstiegspunkt | `website/src/main.jsx` | React-App initialisieren, Themes laden |
| Routing | `website/src/App.jsx` | Zustandsbasiertes Routing (Login, Registrierung, Dashboard) |
| API-Client | `website/src/api/client.js` | Zentrale HTTP-Kommunikation mit dem Backend |
| Authentifizierung | `website/src/auth/` | Session-Verwaltung mit JWT im LocalStorage |
| Hooks | `website/src/hooks/` | Wiederverwendbare Logik (useAdminAuth, useVillageConfig) |
| Konfiguration | `website/src/config/` | Datenmodell, Themes, Navigation |
| Komponenten | `website/src/components/` | React-Komponenten für alle Ansichten |
| Hilfsfunktionen | `website/src/utils/` | Geocoding, Karten-Berechnung |
| Mocks | `website/src/mocks/` | Mock Service Worker für die Entwicklung |

## Abhängigkeiten zwischen Modulen

Das folgende Diagramm zeigt die Abhängigkeiten der Backend-Module:

```
AppModule
├── ConfigModule           (globale Konfiguration)
├── PrismaModule           (globaler Datenbankzugriff)
│
├── AuthModule
│   ├── JwtModule          (Token-Erstellung und -Prüfung)
│   ├── PassportModule     (Authentifizierungsstrategie)
│   └── EmailService       (E-Mail-Versand über Nodemailer)
│
├── VillageModule
│   └── SensorService      (Sensordaten für die Gemeinde laden)
│
├── SensorModule
│   ├── SensorService      (Sensor-CRUD)
│   └── SensorReadingService (Messwerte verwalten)
│
├── DeviceModule
│   └── DeviceService      (Geräte-CRUD)
│
├── LocationModule
│   └── (nur PrismaService)
│
├── AdminModule
│   └── AdminService       (kaskadierende Kontolöschung)
│
└── MqttModule
    ├── SensorReadingService (Messwerte aus MQTT speichern)
    └── ConfigService       (MQTT-Konfiguration lesen)
```

Das VillageModule nutzt den SensorService, um beim Laden einer Gemeinde auch die zugehörigen Sensoren mit letztem Messwert zurückzugeben.
Das MqttModule nutzt den SensorReadingService, um empfangene MQTT-Nachrichten direkt als Messwerte in der Datenbank zu speichern.

## Technologie-Stack

| Komponente | Technologie | Version |
|-----------|-------------|---------|
| Backend-Framework | NestJS | 10.x |
| Programmiersprache (Backend) | TypeScript | 5.x |
| Datenbank | PostgreSQL mit TimescaleDB | 15 |
| ORM | Prisma | 5.10 |
| Frontend-Framework | React | 18.2 |
| Build-Tool (Frontend) | Vite | 5.0 |
| Karten | Leaflet / React-Leaflet | 1.9 / 4.2 |
| MQTT-Broker | Eclipse Mosquitto | 2 |
| Reverse Proxy | Nginx | Alpine |
| Containerisierung | Docker / Docker Compose | — |
| Authentifizierung | JWT (jsonwebtoken) | — |
| Passwort-Hashing | bcrypt | — |
| E-Mail-Versand | Nodemailer | 6.9 |
| Validierung | class-validator / class-transformer | — |
| Test-Framework (Backend) | Jest | — |
| Test-Framework (Frontend) | Vitest | 1.6 |
| Mock-Framework (Frontend) | MSW (Mock Service Worker) | 2.x |

## Entwurfsentscheidungen

**Warum NestJS?**
NestJS bietet eine strukturierte Modularchitektur mit Dependency Injection.
Vermutlich wurde es gewählt, weil es eine klare Projektstruktur erzwingt und gut mit TypeScript zusammenarbeitet.
Für ein Studienprojekt mit mehreren Entwicklern erleichtert das die Zusammenarbeit.

**Warum Prisma?**
Prisma generiert typsichere Datenbankzugriffe aus dem Schema.
Das reduziert Fehler bei der Datenbankinteraktion und macht Migrationen einfach nachvollziehbar.

**Warum TimescaleDB?**
Sensordaten sind Zeitreihendaten.
TimescaleDB erweitert PostgreSQL um effiziente Aggregationsfunktionen für solche Daten.
So können Abfragen wie "Durchschnittswert pro Stunde" direkt in der Datenbank berechnet werden.

**Warum ein zentraler API-Client im Frontend?**
Der API-Client in `client.js` bündelt alle HTTP-Anfragen an einer Stelle.
Das vereinfacht die Wartung, weil Änderungen an der API nur an einer Stelle angepasst werden müssen.
Vermutlich wurde dieses Muster gewählt, um die Kopplung zwischen Komponenten und API gering zu halten.

**Warum Mock Service Worker?**
MSW erlaubt es, das Frontend ohne laufendes Backend zu entwickeln.
Die Mocks laufen direkt im Browser und fangen HTTP-Anfragen ab.
Das beschleunigt die Frontend-Entwicklung und ermöglicht unabhängiges Arbeiten.
