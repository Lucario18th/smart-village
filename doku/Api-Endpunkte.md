# Liste aller API-Endpunkte

**Base-URL:** @Leon ????

## Sensoren

### Senosren-Endpunkte

- `GET /sensors`: Alle Sensoren abrufen
- `GET /sensors/{id}`: Details zu einem Sensor abrufen
- `POST /sensors`: Neuen Sensor anlegen (nur Web)
- `PUT /sensors/{id}`: Sensor aktualisieren (nur Web)
- `DELETE /sensors/{id}`: Sensor löschen (nur Web)

### Sensor-JSON-Objekt

```json

{
    "id": "c2f7b3a1-8a6d-4b0e-9b1f-6a4e3b2c1d9a",
    "name": "Altglascontainer Stadtmitte",
    "type": "ALTGLAS",
    "coordinates": { "lat": 47.6020404, "lon": 7.6625086 },
    "description": "Einwurfzeiten: werktags 07:00-20:00, sonn- und feiertags geschlossen."
    "last_update": "2024-06-01T12:34:56Z",
    "status": "OK",
    "latest_reading": {
        "timestamp": "2024-06-01T12:30:00Z",
        "fill_level": 75,
    }
  }
```

## Mitfahrbank

### Mitfahrbank-Endpunkte

- `GET /mitfahrbank`: Alle Mitfahrangebote abrufen
- `GET /mitfahrbank/{id}`: Details zu einem Mitfahrangebot abrufen
- `POST /mitfahrbank`: Neues Mitfahrangebot anlegen
- `PUT /mitfahrbank/{id}`: Mitfahrangebot aktualisieren
- `DELETE /mitfahrbank/{id}`: Mitfahrangebot löschen
- `GET /mitfahrbank/{id}/requests`: Alle Anfragen zu einem Mitfahrangebot abrufen
- `POST /mitfahrbank/{id}/requests`: Neue Anfrage zu einem Mitfahrangebot stellen
- `PUT /mitfahrbank/{id}/requests/{request_id}`: Anfrage zu einem Mitfahrangebot aktualisieren (z.B. Status ändern)
- `DELETE /mitfahrbank/{id}/requests/{request_id}`: Anfrage zu einem Mitfahrangebot löschen

### Mitfahrbank-JSON-Objekt

#### Mitfahrangebot

```json
{
    "id": "d4e5f6a7-8b9c-0d1e-2f3g-4h5i6j7k8l9m",
    "user_id": "u123456",
    "start": { "lat": 47.6030404, "lon": 7.6635086 },
    "end": { "lat": 47.6040404, "lon": 7.6645086 },
    "leave_time": "2024-06-01T15:00:00Z",
    "title": "Nach Freiburg, Ikea",
    "description": "Abfahrt um 15:00 Uhr, Rückfahrt flexibel. Platz für 3 Personen.",
    "available_seats": 3,
}
```

#### Mitfahranfrage

```json
{
    "id": "e5f6g7h8-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
    "mitfahrbank_id": "d4e5f6a7-8b9c-0d1e-2f3g-4h5i6j7k8l9m",
    "user_id": "u123456",
    "status": "PENDING", // PENDING, ACCEPTED, REJECTED
    "timestamp": "2024-06-01T14:00:00Z",
    "description": "Ich hätte Interesse an einer Mitfahrt. Gibt es noch Platz?"
}
```

## Authentifizierung @Leon?
