# Gemeindeverwaltung

## Überblick

Das VillageModule verwaltet die Daten einer Gemeinde.
Eine Gemeinde (Village) ist die zentrale Organisationseinheit im System.
Jede Gemeinde gehört zu einem Account und enthält Sensoren, Geräte und Metadaten.

Die Implementierung befindet sich unter `backend/src/village/`.

## Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/villages/:villageId` | Ja (JWT) | Gemeindedaten mit Sensoren und Geräten abrufen |
| PUT | `/api/villages/:villageId` | Ja (JWT) | Gemeindedaten aktualisieren |

## Gemeinde abrufen

`GET /api/villages/:villageId` (JWT erforderlich)

Gibt die vollständigen Daten einer Gemeinde zurück.
Die Antwort enthält neben den Metadaten auch die zugehörige Postleitzahl, alle Geräte und alle Sensoren mit ihrem letzten Messwert.

Die Sensoren werden über den SensorService geladen, der automatisch den letzten Messwert und Status anfügt.

**Rückgabe (vereinfacht):**
```json
{
  "id": 1,
  "name": "Musterdorf",
  "locationName": "Musterdorf am See",
  "contactEmail": "info@musterdorf.de",
  "contactPhone": "0761 12345",
  "municipalityCode": "08315123",
  "postalCode": {
    "zipCode": "79100",
    "city": "Freiburg",
    "lat": 47.99,
    "lng": 7.85
  },
  "devices": [...],
  "sensors": [
    {
      "id": 1,
      "name": "Temperatur Rathaus",
      "sensorType": { "name": "Temperatur", "unit": "°C" },
      "lastTs": "2025-01-15T10:30:00Z",
      "lastValue": 23.5,
      "lastStatus": "OK"
    }
  ]
}
```

## Gemeinde aktualisieren

`PUT /api/villages/:villageId` (JWT erforderlich)

Aktualisiert die Metadaten einer Gemeinde.

**Eingabe (alle optional):**
- `name` (String) – Name der Gemeinde
- `locationName` (String) – Ortsbezeichnung
- `phone` (String) – Telefonnummer
- `infoText` (String) – Informationstext
- `contactEmail` (String) – Kontakt-E-Mail
- `contactPhone` (String) – Kontakttelefon
- `municipalityCode` (String) – Gemeindekennziffer
- `postalCodeId` (Int) – ID der neuen Postleitzahl

Wenn eine `postalCodeId` angegeben wird, wird geprüft, ob diese in der Datenbank existiert.

**Rückgabe:** Die aktualisierte Gemeinde mit Postleitzahl.

## Zusammenhang mit dem Frontend

Im Frontend wird beim Laden des Dashboards die Gemeinde des angemeldeten Benutzers abgerufen.
Die Account-ID entspricht dabei der Village-ID.
Das bedeutet, dass jeder Account genau eine primäre Gemeinde hat.

Der Hook `useVillageConfig` im Frontend ruft `GET /api/villages/:villageId` auf und transformiert die Antwort in das interne Konfigurationsformat.
Beim Speichern werden die geänderten Daten über `PUT /api/villages/:villageId` zurückgeschrieben.

## Entwurfsentscheidung

Es gibt keinen Endpunkt zum Erstellen von Gemeinden über die REST-API.
Gemeinden werden ausschließlich bei der Registrierung zusammen mit dem Account angelegt.
Vermutlich wurde diese Entscheidung getroffen, weil die Registrierung der einzige kontrollierte Einstiegspunkt für neue Gemeinden sein soll.

## Abhängigkeiten

Das VillageModule enthält:
- VillageController – HTTP-Endpunkte
- Es nutzt den SensorService aus dem SensorModule, um Sensoren mit letztem Messwert zu laden.

Abhängigkeit auf PrismaService für den Datenbankzugriff.
