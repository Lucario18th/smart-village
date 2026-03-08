# Geräteverwaltung

## Überblick

Das DeviceModule verwaltet IoT-Geräte (auch Controller genannt).
Ein Gerät ist ein physisches Objekt, an das mehrere Sensoren angeschlossen sein können.
Die Implementierung befindet sich unter `backend/src/device/`.

## Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/devices/village/:villageId` | Nein | Alle Geräte einer Gemeinde auflisten |
| POST | `/api/devices/village/:villageId` | Ja (JWT) | Neues Gerät anlegen |
| PATCH | `/api/devices/:id` | Ja (JWT) | Gerät aktualisieren |

## Geräte auflisten

`GET /api/devices/village/:villageId`

Gibt alle Geräte einer Gemeinde zurück.
Jedes Gerät enthält die zugehörigen Sensoren als verschachtelte Liste.

## Gerät anlegen

`POST /api/devices/village/:villageId` (JWT erforderlich)

Erstellt ein neues Gerät für die angegebene Gemeinde.

**Eingabe:**
- `deviceId` (String, erforderlich) – Eindeutige Geräte-ID (z. B. Seriennummer)
- `name` (String, erforderlich) – Name des Geräts
- `latitude` (Float, optional) – Breitengrad
- `longitude` (Float, optional) – Längengrad

Die `deviceId` muss global eindeutig sein.
Vermutlich wurde dies so gelöst, damit Hardware-Geräte über ihre Seriennummer oder MAC-Adresse identifiziert werden können.

**Rückgabe:** Das erstellte Gerät.

## Gerät aktualisieren

`PATCH /api/devices/:id` (JWT erforderlich)

Aktualisiert Name und/oder Standort eines bestehenden Geräts.

**Eingabe (alle optional):**
- `name` (String) – Neuer Name
- `latitude` (Float) – Neuer Breitengrad
- `longitude` (Float) – Neuer Längengrad

**Rückgabe:** Das aktualisierte Gerät mit zugehörigen Sensoren.

## Zusammenspiel mit Sensoren

Geräte und Sensoren sind über eine optionale Beziehung verknüpft.
Ein Sensor kann einem Gerät zugeordnet sein, muss es aber nicht.
Im Frontend werden Sensoren unter ihrem zugehörigen Gerät gruppiert angezeigt.

Wenn ein Gerät über MQTT entdeckt wird, werden die zugehörigen Sensoren automatisch angelegt oder aktualisiert. Dieser Prozess wird im Dokument [MQTT-Integration](mqtt-integration.md) beschrieben.

## Entwurfsentscheidung

Es gibt keinen Endpunkt zum Löschen von Geräten über die REST-API.
Vermutlich wurde dies weggelassen, weil das Löschen eines Geräts auch die zugehörigen Sensoren und deren Messwerte betreffen würde. Im Rahmen der Kontolöschung durch einen Administrator werden Geräte implizit über die kaskadierende Löschung entfernt.

## Abhängigkeiten

Das DeviceModule enthält:
- DeviceService – CRUD-Operationen für Geräte
- DeviceController – HTTP-Endpunkte

Abhängigkeit auf PrismaService für den Datenbankzugriff.
