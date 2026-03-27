# Dokumentation – Smart Village
*Studienarbeit · DHBW Lörrach · TIF 23 · Semester 5 & 6*

Diese Seite ist der zentrale Einstiegspunkt für alle Dokumente des Smart-Village-Projekts.  
Diese Seite bietet eine strukturierte Übersicht über alle Dokumente des Projekts.

---

## Schnellnavigation

| Gesuchter Inhalt | Dokument |
|-------------|----------|
| Projektübersicht, Ziele, Warum wurde das gebaut? | [`PROJEKT-DOKUMENTATION.md`](PROJEKT-DOKUMENTATION.md) — Teil 1 (4MAT: Warum / Was / Wie / Was-wenn) |
| Wie wird das Projekt lokal gestartet? | [`../README.md`](../README.md) — Abschnitt Quickstart |
| Systemarchitektur und Technologieentscheidungen | [`PROJEKT-DOKUMENTATION.md`](PROJEKT-DOKUMENTATION.md) — Teil 2 + [`../doku-Neu/architektur/`](../doku-Neu/architektur/) |
| REST-API-Endpunkte und Referenz | [`../doku-Neu/api/`](../doku-Neu/api/) |
| Einen Sensor oder ein IoT-Gerät anbinden | [`PROJEKT-DOKUMENTATION.md`](PROJEKT-DOKUMENTATION.md) — Teil 3 + [`../doku-Neu/prozesse/`](../doku-Neu/prozesse/) |
| Deployment, Betrieb, Sicherheit | [`../doku-Neu/betrieb/`](../doku-Neu/betrieb/) |
| Wie wurde KI im Projekt eingesetzt? | [`KI-NUTZUNG.md`](KI-NUTZUNG.md) |
| Semester-5-Konzept und Technologierecherche | [`../doku-Neu/abgabe-semester-5/` (Abgabe 5. Semester)](../doku-Neu/abgabe-semester-5/) |
| Letzte Änderungen | [`aenderungen-2026-03-24.md`](aenderungen-2026-03-24.md) |
| Alte/archivierte Dokumentation | [`../doku-Alt/`](../doku-Alt/) *(veraltet — nur Archiv)* |

---

## Alle Dokumente im Überblick

**`docs/` — Zentrale Projektdokumentation:**

| Datei | Beschreibung                                                                                                                |
|-------|-----------------------------------------------------------------------------------------------------------------------------|
| [`PROJEKT-DOKUMENTATION.md`](PROJEKT-DOKUMENTATION.md) | Hauptdokumentation nach 4MAT: Projektvision, Architektur, Technologieentscheidungen, Endnutzer-Anleitung, Sensorintegration |
| [`KI-NUTZUNG.md`](KI-NUTZUNG.md) | Dokumentation des KI-Einsatzes: GitHub Copilot, Agent Mode, Prompt-Engineering, Probleme und Erkenntnisse                   |
| [`aenderungen-2026-03-24.md`](aenderungen-2026-03-24.md) | Changelog der letzten größeren Änderungen (24.03.2026)                                                                      |

**`doku-Neu/` — Technische Detaildokumentation (aktueller Stand):**

| Pfad                                                                 | Beschreibung |
|----------------------------------------------------------------------|-------------|
| [`architektur/`](../doku-Neu/architektur/)                           | Systemarchitektur, Datenmodell, Infrastruktur-Übersicht |
| [`api/`](../doku-Neu/api/)                                           | REST-API-Referenz und Endpunkte |
| [`app/`](../doku-Neu/app/)                                           | Mobile App-Dokumentation: Architektur, Module, API-Anbindung |
| [`backend/`](../doku-Neu/backend/)                                   | Backend-Dokumentation: MQTT-Integration, App-API, Module |
| [`frontend/`](../doku-Neu/frontend/)                                 | Frontend-Dokumentation: Komponenten, State, Routing |
| [`betrieb/`](../doku-Neu/betrieb/)                                   | Deployment, Sicherheitskonzept, Betriebsanleitungen |
| [`prozesse/`](../doku-Neu/prozesse/)                                 | Prozessbeschreibungen: Auto-Discovery, Sensor-Onboarding |
| [`abgabe-semester-5/`](../doku-Neu/abgabe-semester-5/)               | Abgabe Semester 5: Technologierecherche, LoRaWAN-Evaluation, Konzeptphase |
| [`API.md`](../doku-Neu/API.md)                                       | API-Übersichtsdokument |
| [`uebersicht.md`](../doku-Neu/uebersicht.md)                         | Projektübersicht |
| [`aenderungen-2026-03-15.md`](../doku-Neu/aenderungen-2026-03-15.md) | Changelog 15.03.2026 |
| [`aenderungen-2026-03-17.md`](../doku-Neu/aenderungen-2026-03-17.md) | Changelog 17.03.2026 |
| [`aenderungen-2026-03-18.md`](../doku-Neu/aenderungen-2026-03-18.md) | Changelog 18.03.2026 |
| [`aenderungen-2026-03-23.md`](../doku-Neu/aenderungen-2026-03-23.md) | Changelog 23.03.2026 |
| [`aenderungen-2026-03-27.md`](../doku-Neu/aenderungen-2026-03-27.md) | Changelog 24.03.2026 |
| [`Smart-Village.pdf`](../doku-Neu/Smart-Village.pdf)                 | PDF-Export der Projektdokumentation |

---

## Projektverlauf

- **Semester 5 — Ideen- und Recherchephase:** Evaluation von IoT-Protokollen (LoRaWAN, MQTT, Zigbee u. a.), Architekturkonzepte, Anforderungsanalyse, erster kleiner Prototyp. Ergebnisse unter [`doku-Neu/abgabe-semester-5/`](../doku-Neu/abgabe-semester-5/).
- **Semester 6 — Umsetzungsphase:** Sehr ausführliche, iterative Implementierung — Backend (NestJS, MQTT, Prisma), Web-App (React + Vite), Mobile App (Kotlin), Raspberry Pi-Integration mit echten Sensoren (BMP280, YL-69), Auto-Discovery, Kartenansicht (OpenStreetMap), KI-gestützte Tests, Security-Hardening. Kontinuierliche Erweiterung bis zur finalen Präsentation. Das Projekt hat sich weit über den ursprünglichen Smart-Village-Rahmen hinaus entwickelt und hat bereits Smart-City-Umfang erreicht.

---

## Hinweis zu doku-Alt

> ⚠️ **Der Ordner [`doku-Alt/`](../doku-Alt/) enthält Dokumentation aus frühen Projektphasen.**
> Diese Inhalte sind **nicht mehr aktuell** und werden nicht weiter gepflegt.
> Der Ordner bleibt als Archiv erhalten, um den Projektverlauf vollständig nachvollziehen zu können.
> Für den aktuellen Stand ausschließlich [`doku-Neu/`](../doku-Neu/) und [`docs/`](./) verwenden.
