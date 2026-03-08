# Projektübersicht – Smart Village

## Was ist Smart Village?

Smart Village ist eine Studienarbeit an der DHBW Lörrach.
Das Projekt wurde von Studierenden des Studiengangs Informatik (TIF 23) entwickelt und von Herrn Schenk betreut.

Ziel des Projekts ist eine Plattform, mit der Gemeinden ihre IoT-Infrastruktur verwalten können.
Dazu gehören Sensoren, Controller und andere Geräte, die Daten wie Temperatur, Luftfeuchtigkeit oder Personenzählungen erfassen.
Die erfassten Daten werden gespeichert, auf einer Karte visualisiert und über ein Web-Dashboard verwaltet.

## Anwendungsfälle

Das System deckt folgende zentrale Anwendungsfälle ab:

Gemeindeverantwortliche können sich registrieren und ein Konto anlegen.
Nach der E-Mail-Verifizierung können sie sich anmelden und ihre Gemeinde konfigurieren.

Im Web-Dashboard verwalten sie Sensoren und Geräte.
Neue Geräte können entweder manuell angelegt oder automatisch über MQTT erkannt werden.
Sensoren liefern Messwerte, die als Zeitreihen gespeichert werden.

Auf einer interaktiven Karte (OpenStreetMap) werden alle Sensoren und Geräte mit ihren Standorten angezeigt.
Die Karte zeigt farbcodierte Marker, die den aktuellen Messwert darstellen.

Ein besonderer Sensortyp ist die Mitfahrbank.
Dabei handelt es sich um Sitzbänke, an denen wartende Personen gezählt werden, um Mitfahrgelegenheiten zu koordinieren.

Administratoren mit erweiterten Rechten können Konten löschen.
Dabei werden alle zugehörigen Daten kaskadierend entfernt.

## Hauptkomponenten

Das System besteht aus folgenden Komponenten:

**Backend (NestJS):**
Das Backend ist eine REST-API, geschrieben in TypeScript mit dem Framework NestJS.
Es verwaltet Konten, Gemeinden, Sensoren, Geräte und Messwerte.
Außerdem empfängt es Sensordaten über MQTT.
Die Authentifizierung erfolgt über JWT-Tokens.

**Frontend (React):**
Das Frontend ist ein Web-Dashboard, gebaut mit React und Vite.
Es bietet eine Administrationsoberfläche mit Formularen, einer Kartenansicht und Statistiken.
Die Kommunikation mit dem Backend läuft über einen zentralen API-Client.

**Datenbank (PostgreSQL mit TimescaleDB):**
Alle Daten werden in einer PostgreSQL-Datenbank gespeichert.
TimescaleDB wird als Erweiterung genutzt, um Zeitreihendaten effizient zu verarbeiten.
Das ORM Prisma verwaltet das Schema und die Migrationen.

**MQTT-Broker (Mosquitto):**
Ein Mosquitto-Broker empfängt Nachrichten von IoT-Geräten.
Das Backend abonniert bestimmte Topics und verarbeitet die eingehenden Sensordaten.
Über ein Discovery-Protokoll können sich neue Geräte automatisch anmelden.

**Reverse Proxy (Nginx):**
Nginx dient als Einstiegspunkt für alle HTTP-Anfragen.
Es liefert das Frontend aus und leitet API-Anfragen an das Backend weiter.
HTTPS wird über selbstsignierte Zertifikate bereitgestellt.

**E-Mail-Dienst (MailHog):**
In der Entwicklungsumgebung wird MailHog als SMTP-Server genutzt.
Es fängt Verifizierungs-E-Mails ab, die bei der Registrierung verschickt werden.

## Zusammenspiel der Komponenten

Der typische Datenfluss sieht folgendermaßen aus:

Ein Benutzer ruft das Web-Dashboard im Browser auf.
Nginx liefert die React-Anwendung aus.
Das Frontend sendet REST-Anfragen an das Backend, die von Nginx an den Backend-Container weitergeleitet werden.

Das Backend verarbeitet die Anfragen, greift auf die Datenbank zu und gibt JSON-Antworten zurück.
Geschützte Endpunkte erfordern einen gültigen JWT-Token im Authorization-Header.

Parallel dazu empfängt das Backend Sensordaten über MQTT.
IoT-Geräte veröffentlichen Messwerte auf bestimmten Topics.
Das Backend validiert die Nachrichten und speichert die Daten in der Datenbank.

Das Frontend fragt regelmäßig neue Daten ab (Polling alle 5 Sekunden).
Neu entdeckte Geräte oder Sensoren werden dem Benutzer über eine Benachrichtigung angezeigt.

```
Benutzer (Browser)
       |
       | HTTPS (Port 443)
       v
    Nginx ─────────────── liefert React-App aus
       |
       | /api/* Proxy
       v
   Backend (NestJS, Port 8000)
       |           |            |
       v           v            v
  PostgreSQL    Mosquitto    MailHog
  (Port 5432)  (Port 1883)  (Port 1025)
       ^
       |
  IoT-Geräte / Simulatoren
  (MQTT-Nachrichten)
```

## Hinweis zur Mobile API

Es existiert im Backend ein Modul unter `backend/src/mobile/`, das eine öffentliche REST-API für mobile Anwendungen bereitstellt.
Diese Mobile API wird in naher Zukunft vollständig neu gestaltet.
Sie ist daher in dieser Dokumentation nicht beschrieben.
Gleiches gilt für den Ordner `app/` und alle Dokumente mit dem Prefix `MOBILE-API` im Hauptverzeichnis.
