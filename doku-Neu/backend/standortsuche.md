# Standortsuche

## Überblick

Das LocationModule stellt eine Suche für Postleitzahlen und Ortsnamen bereit.
Es wird bei der Registrierung und im Dashboard verwendet, um den Standort einer Gemeinde festzulegen.

Die Implementierung befindet sich unter `backend/src/location/`.

## Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| GET | `/api/locations/search` | Nein | Postleitzahlen und Orte suchen |

## Suche

`GET /api/locations/search?query=<suchbegriff>`

Sucht in der PostalCode-Tabelle nach Einträgen, die zur Suchanfrage passen.
Die Suche funktioniert sowohl für Postleitzahlen als auch für Ortsnamen.
Die Suche ist nicht zwischen Groß- und Kleinschreibung unterscheidend (case-insensitive).

Es werden maximal 15 Ergebnisse zurückgegeben.

**Beispiele:**
- `GET /api/locations/search?query=79100` – Sucht nach PLZ 79100
- `GET /api/locations/search?query=Freiburg` – Sucht nach Orten mit "Freiburg"

**Rückgabe:**
```json
[
  {
    "id": 42,
    "zipCode": "79100",
    "city": "Freiburg im Breisgau",
    "state": "Baden-Württemberg"
  }
]
```

## Verwendung

### Bei der Registrierung

Während der Registrierung wählt der Benutzer seinen Standort über eine Autovervollständigung (LocationAutocomplete-Komponente im Frontend).
Die ausgewählte `postalCodeId` wird zusammen mit den Kontodaten an den Registrierungsendpunkt gesendet.

### Im Dashboard

Im Dashboard kann die Postleitzahl der Gemeinde über die allgemeinen Einstellungen geändert werden.
Auch hier wird die LocationAutocomplete-Komponente verwendet.
Die ausgewählte `postalCodeId` wird beim Speichern der Gemeindedaten an den Update-Endpunkt gesendet.

Die Geokoordinaten (`lat`, `lng`) aus der PostalCode-Tabelle werden für die Kartendarstellung verwendet, um den Mittelpunkt der Gemeinde zu bestimmen.

## Entwurfsentscheidung

Die Postleitzahldaten sind als Referenzdaten in der Datenbank gespeichert und nicht über eine externe API abgefragt.
Vermutlich wurde dies so gelöst, um die Verfügbarkeit der Suche unabhängig von externen Diensten zu gewährleisten und die Antwortzeiten gering zu halten.

## Abhängigkeiten

Das LocationModule enthält:
- LocationController – HTTP-Endpunkt für die Suche

Abhängigkeit auf PrismaService für den Datenbankzugriff.
