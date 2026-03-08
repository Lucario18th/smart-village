# Datenmodell

## Überblick

Das Datenbankschema wird mit Prisma definiert und verwaltet.
Die Schema-Datei befindet sich unter `backend/prisma/schema.prisma`.
Prisma generiert daraus typsichere Datenbankzugriffe und verwaltet Migrationen.

Als Datenbank wird PostgreSQL 15 mit der TimescaleDB-Erweiterung verwendet.
TimescaleDB ermöglicht effiziente Zeitreihenabfragen, insbesondere für Sensordaten.

## Entitäten

### Account (Konto)

Ein Account repräsentiert ein Benutzerkonto.
Jeder Account kann eine oder mehrere Gemeinden verwalten.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| email | String (unique) | E-Mail-Adresse des Benutzers |
| passwordHash | String | Gehashtes Passwort (bcrypt) |
| isAdmin | Boolean | Ob der Benutzer Administratorrechte hat (Standard: false) |
| emailVerified | Boolean | Ob die E-Mail verifiziert wurde (Standard: false) |
| verificationCode | String (optional) | 6-stelliger Verifizierungscode |
| verificationCodeExpiresAt | DateTime (optional) | Ablaufzeitpunkt des Codes |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzter Änderungszeitpunkt |

**Beziehungen:** Ein Account hat mehrere Villages (1:n).

**Verwendung:** Wird bei der Registrierung angelegt. Der Account ist die Grundlage für die Authentifizierung. Nach erfolgreicher E-Mail-Verifizierung kann sich der Benutzer anmelden.

### Village (Gemeinde)

Eine Village repräsentiert eine Gemeinde im System.
Sie enthält Metadaten wie Name, Kontaktdaten und Standort.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| accountId | Int | Fremdschlüssel auf Account |
| name | String | Name der Gemeinde |
| locationName | String (optional) | Ortsbezeichnung |
| postalCodeId | Int (optional) | Fremdschlüssel auf PostalCode |
| phone | String (optional) | Telefonnummer |
| infoText | String (optional) | Informationstext |
| contactEmail | String (optional) | Kontakt-E-Mail |
| contactPhone | String (optional) | Kontakttelefon |
| municipalityCode | String (optional) | Gemeindekennziffer |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzter Änderungszeitpunkt |

**Beziehungen:**
- Gehört zu einem Account (n:1).
- Hat mehrere Sensors (1:n).
- Hat mehrere Devices (1:n).
- Hat mehrere Users (1:n).
- Hat mehrere Messages (1:n).
- Hat mehrere RideShares (1:n).
- Hat optional eine PostalCode-Zuordnung (n:1).
- Hat optional einen VillageFeatures-Eintrag (1:1).

**Verwendung:** Wird bei der Registrierung automatisch zusammen mit dem Account angelegt. Über das Dashboard können die Metadaten der Gemeinde bearbeitet werden.

### Sensor

Ein Sensor erfasst Messwerte wie Temperatur, Luftfeuchtigkeit oder Personenzählungen.
Er kann einem Gerät zugeordnet sein oder eigenständig existieren.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| villageId | Int | Fremdschlüssel auf Village |
| deviceId | Int (optional) | Fremdschlüssel auf Device |
| sensorTypeId | Int | Fremdschlüssel auf SensorType |
| name | String | Name des Sensors |
| infoText | String (optional) | Beschreibungstext |
| isActive | Boolean | Ob der Sensor aktiv ist (Standard: true) |
| receiveData | Boolean | Ob der Sensor Daten empfangen soll (Standard: true) |
| exposeToApp | Boolean | Ob Messwerte an die mobile App gesendet werden duerfen (Standard: false) |
| latitude | Float (optional) | Breitengrad des Standorts |
| longitude | Float (optional) | Längengrad des Standorts |
| origin | SensorOrigin | Herkunft des Sensors: HARDWARE oder AI_SERVICE |
| aiProvider | String (optional) | KI-Anbieter (nur bei AI_SERVICE) |
| aiModelName | String (optional) | KI-Modellname (nur bei AI_SERVICE) |
| aiConfigJson | String (optional) | KI-Konfiguration als JSON (nur bei AI_SERVICE) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzter Änderungszeitpunkt |

**Beziehungen:**
- Gehört zu einer Village (n:1).
- Gehört optional zu einem Device (n:1).
- Hat einen SensorType (n:1).
- Hat mehrere SensorReadings (1:n).
- Hat optional einen SensorStatus (1:1).

**Verwendung:** Sensoren werden entweder manuell über das Dashboard angelegt oder automatisch über MQTT-Discovery registriert. Sie sammeln Messwerte, die als Zeitreihen gespeichert werden.

### SensorType (Sensortyp)

Ein SensorType definiert die Art eines Sensors mit der zugehörigen Einheit.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| name | String (unique) | Name des Sensortyps (z. B. "Temperatur") |
| unit | String | Maßeinheit (z. B. "°C", "Personen") |
| description | String (optional) | Beschreibung des Sensortyps |

**Beziehungen:** Wird von mehreren Sensors referenziert (1:n).

**Verwendung:** Sensortypen werden in der Datenbank vorgehalten und beim Anlegen eines Sensors ausgewählt. Beispiele: Temperatur (°C), Luftfeuchtigkeit (%), Mitfahrbank (Personen).

### SensorReading (Messwert)

Ein SensorReading ist ein einzelner Datenpunkt eines Sensors zu einem bestimmten Zeitpunkt.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| sensorId | Int | Fremdschlüssel auf Sensor |
| ts | DateTime | Zeitstempel des Messwerts |
| value | Float | Numerischer Messwert |
| status | ReadingStatus | Status: OK, SUSPECT oder ERROR |
| extra | Json (optional) | Zusätzliche Metadaten als JSON |

**Beziehungen:** Gehört zu einem Sensor (n:1).

**Verwendung:** Messwerte werden entweder über die REST-API (`POST /api/sensor-readings/:sensorId`) oder über MQTT empfangen. Sie bilden die Zeitreihe eines Sensors und können aggregiert abgefragt werden (z. B. Durchschnitt pro Stunde).

### SensorStatus

Der aktuelle Status eines Sensors.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| sensorId | Int (unique) | Fremdschlüssel auf Sensor |
| status | String | Aktueller Status: OK, WARN, ERROR oder UNKNOWN |
| message | String (optional) | Statusnachricht |

**Beziehungen:** Gehört zu genau einem Sensor (1:1).

**Verwendung:** Wird automatisch aktualisiert und zeigt den aktuellen Gesundheitszustand eines Sensors an.

### Device (Gerät)

Ein Device repräsentiert ein physisches IoT-Gerät oder einen Controller.
An ein Gerät können mehrere Sensoren angeschlossen sein.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| deviceId | String (unique) | Eindeutige Geräte-ID (z. B. Hardware-Seriennummer) |
| villageId | Int | Fremdschlüssel auf Village |
| name | String | Name des Geräts |
| latitude | Float (optional) | Breitengrad |
| longitude | Float (optional) | Längengrad |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzter Änderungszeitpunkt |

**Beziehungen:**
- Gehört zu einer Village (n:1).
- Hat mehrere Sensors (1:n).

**Verwendung:** Geräte werden manuell angelegt oder über MQTT-Discovery automatisch registriert. Sie dienen als logische Gruppierung von Sensoren.

### PostalCode (Postleitzahl)

Referenzdaten für Postleitzahlen mit Geokoordinaten.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| zipCode | String | Postleitzahl |
| city | String | Ortsname |
| state | String (optional) | Bundesland |
| lat | Float (optional) | Breitengrad |
| lng | Float (optional) | Längengrad |

**Beziehungen:** Wird von Villages referenziert (1:n).

**Verwendung:** Wird bei der Registrierung und bei der Ortssuche im Dashboard verwendet. Die Geokoordinaten werden für die Kartendarstellung genutzt.

### User (Benutzer einer Gemeinde)

Ein User ist ein Benutzer innerhalb einer Gemeinde mit einer bestimmten Rolle.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| villageId | Int | Fremdschlüssel auf Village |
| email | String | E-Mail-Adresse |
| passwordHash | String | Gehashtes Passwort |
| displayName | String (optional) | Anzeigename |
| role | UserRole | Rolle: ADMIN, TECH oder VIEWER |
| createdAt | DateTime | Erstellungszeitpunkt |

**Beziehungen:** Gehört zu einer Village (n:1).

**Anmerkung:** Dieses Modell existiert im Schema, scheint aber in der aktuellen Implementierung nicht aktiv genutzt zu werden. Vermutlich ist es für eine zukünftige Mehrbenutzerverwaltung pro Gemeinde vorgesehen.

### Message (Nachricht)

Nachrichten oder Mitteilungen für eine Gemeinde.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| villageId | Int | Fremdschlüssel auf Village |
| text | String | Nachrichtentext |
| priority | String (optional) | Priorität der Nachricht |
| createdAt | DateTime | Erstellungszeitpunkt |

**Beziehungen:** Gehört zu einer Village (n:1).

**Anmerkung:** Dieses Modell wird primär von der Mobile API verwendet, die in dieser Dokumentation nicht behandelt wird.

### RideShare (Mitfahrgelegenheit)

Informationen zu Mitfahrgelegenheiten in einer Gemeinde.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primärschlüssel |
| villageId | Int | Fremdschlüssel auf Village |
| name | String | Name oder Beschreibung |
| description | String (optional) | Detailbeschreibung |
| personCount | Int | Aktuelle Personenanzahl |
| maxCapacity | Int | Maximale Kapazität |
| status | String (optional) | Aktueller Status |
| createdAt | DateTime | Erstellungszeitpunkt |

**Beziehungen:** Gehört zu einer Village (n:1).

**Anmerkung:** Dieses Modell wird primär von der Mobile API verwendet, die in dieser Dokumentation nicht behandelt wird.

### VillageFeatures (Feature-Flags fuer die App)

Steuert, welche Module in der mobilen App fuer eine Gemeinde aktiviert sind.
Jede Gemeinde hat hoechstens einen VillageFeatures-Eintrag (1:1-Beziehung).

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | Int (Auto-Increment) | Primaerschluessel |
| villageId | Int (unique) | Fremdschluessel auf Village |
| enableSensorData | Boolean | Sensordaten in der App anzeigen (Standard: true) |
| enableWeather | Boolean | Wetterdaten in der App anzeigen (Standard: true) |
| enableMessages | Boolean | Nachrichten in der App anzeigen (Standard: true) |
| enableEvents | Boolean | Veranstaltungen in der App anzeigen (Standard: false) |
| enableMap | Boolean | Kartenansicht in der App aktivieren (Standard: true) |
| enableRideShare | Boolean | Mitfahrbank-Daten in der App anzeigen (Standard: true) |
| enableTextileContainers | Boolean | Altkleider-Container in der App anzeigen (Standard: false) |

**Beziehungen:** Gehoert zu genau einer Village (1:1).

**Verwendung:** Wird von der App-API ausgelesen, um zu steuern, welche Module in der App sichtbar sind. Siehe [App-API-Dokumentation](../backend/app-api.md).

## Enums

### ReadingStatus

Mögliche Status-Werte für einen Messwert:
- `OK` – Der Messwert ist gültig.
- `SUSPECT` – Der Messwert ist möglicherweise fehlerhaft.
- `ERROR` – Der Messwert ist fehlerhaft.

### SensorOrigin

Herkunft eines Sensors:
- `HARDWARE` – Physischer Sensor, der über ein Gerät angeschlossen ist.
- `AI_SERVICE` – Virtueller Sensor, der Daten von einem KI-Dienst erhält.

### UserRole

Rollen innerhalb einer Gemeinde:
- `ADMIN` – Vollzugriff auf die Gemeindeverwaltung.
- `TECH` – Technischer Zugriff (z. B. Sensorverwaltung).
- `VIEWER` – Nur lesender Zugriff.

## Beziehungsdiagramm

```
Account (Konto)
    |
    └── 1:n ── Village (Gemeinde)
                    |
                    ├── 1:n ── Sensor ── n:1 ── SensorType
                    |              |
                    |              ├── 1:n ── SensorReading (Messwert)
                    |              └── 1:1 ── SensorStatus
                    |
                    ├── 1:n ── Device (Gerät)
                    |              |
                    |              └── 1:n ── Sensor (optional)
                    |
                    ├── n:1 ── PostalCode (optional)
                    |
                    ├── 1:1 ── VillageFeatures (optional)
                    |
                    ├── 1:n ── User
                    ├── 1:n ── Message
                    └── 1:n ── RideShare
```

## Migrationen

Prisma verwaltet die Datenbankmigrationen.
Die Migrationsdateien befinden sich unter `backend/prisma/migrations/`.
Neue Migrationen werden mit `npm run prisma:migrate:dev` erstellt.
In der Produktionsumgebung werden Migrationen mit `npm run prisma:migrate:deploy` angewendet.

Nach Änderungen am Schema muss der Prisma-Client mit `npm run prisma:generate` neu generiert werden.
