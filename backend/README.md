## Postal Codes (Deutschland)

1. **CSV besorgen:** Open-Data-PLZ/Ort CSV (Format: `plz;ort;bundesland;lat;lon`), z. B. von https://www.suche-postleitzahl.org/downloads oder amtliche Open-Data-Quellen.
2. **Import starten:**  
   ```bash
   npm run seed:postal-codes -- ./path/to/plz_ort.csv
   ```
   Der Import ist idempotent (upsert auf `postalCode + city`) und kann im Backend-Container ausgeführt werden.

## API-Erweiterungen

- **Suche:** `GET /api/locations/search?query=<plz|ort>` liefert bis zu 15 Treffer `{ id, postalCode, city, state, lat, lng }`.
- **Registration:** `POST /api/auth/register` erfordert jetzt `postalCodeId` (ID aus obiger Suche). Accounts werden Gemeinden zugeordnet, die an eine gültige deutsche PLZ gebunden sind. Die `villageId` wird backend-intern gesetzt (kein freier Text oder Client-Input).
- **Villages:** Village-Antworten enthalten `postalCode` Relation (inkl. Koordinaten) für Map-Zentrierung; `PUT /api/villages/:id` akzeptiert `postalCodeId` zum Aktualisieren.
