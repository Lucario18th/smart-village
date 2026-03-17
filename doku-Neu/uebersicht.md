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

Fuer oeffentliche Nutzer gibt es eine Landingpage und eine Public-User-Ansicht im Browser.
Die Landingpage stellt Projektinformationen, Team, Rechtslinks sowie Einstiegspunkte zu User/Admin bereit.
Zusaetzlich bietet sie einen Android-Download-Button zur App.

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
Das Frontend ist eine Webanwendung, gebaut mit React und Vite.
Es umfasst:
- Landingpage (`/`),
- Public-User-Bereich (`/user`, `/village/:villageId`),
- Admin-Bereich (`/admin/*`).

Die Kommunikation mit dem Backend läuft über einen zentralen API-Client.
Public-Ansichten nutzen die App-API (`/api/app/...`) und aktualisieren Daten via Polling.

**Datenbank (PostgreSQL mit TimescaleDB):**
Alle Daten werden in einer PostgreSQL-Datenbank gespeichert.
TimescaleDB wird als Erweiterung genutzt, um Zeitreihendaten effizient zu verarbeiten.
Das ORM Prisma verwaltet das Schema und die Migrationen.

**MQTT-Broker (Mosquitto):**
Ein Mosquitto-Broker empfängt Nachrichten von IoT-Geräten.
Das Backend abonniert bestimmte Topics und verarbeitet die eingehenden Sensordaten.
Über ein Discovery-Protokoll können sich neue Geräte automatisch anmelden.
Zusaetzlich stellt Mosquitto einen WebSocket-Listener bereit, damit Browser-Clients MQTT-Daten direkt empfangen koennen.

**Reverse Proxy (Nginx):**
Nginx dient als Einstiegspunkt für alle HTTP-Anfragen.
Es liefert das Frontend aus und leitet API-Anfragen an das Backend weiter.
Der Pfad `/mqtt` wird als WebSocket-Proxy auf den Mosquitto-WebSocket-Port weitergeleitet.
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
Fuer Public-Daten werden Live-Messwerte zusaetzlich direkt per MQTT-WebSocket eingemischt.

Sowohl mobile App als auch Public-Website verwenden die gleichen App-API-Kernendpunkte:
- `GET /api/app/villages`
- `GET /api/app/villages/:villageId/config`
- `GET /api/app/villages/:villageId/initial-data`

In der Public-Oberflaeche werden Tabs und Inhalte dynamisch aus den Village-Feature-Flags erzeugt.
Deaktivierte Module werden nicht angezeigt.

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
