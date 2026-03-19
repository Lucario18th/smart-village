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

## Lokaler KI-Assistent

- **Public Ask:** `POST /api/assistant/public/ask`
- **Admin Ask:** `POST /api/assistant/admin/ask` (nur mit gueltigem Admin-Token)
- Der Assistant nutzt nur den uebergebenen API-Kontext (`contextData`) und gibt keine erfundenen Daten aus.

### Lokales LLM (Ollama-kompatibel)

Folgende Env-Variablen werden unterstuetzt:

- `LOCAL_LLM_ENABLED=true`
- `LOCAL_LLM_BASE_URL=http://ollama:11434`
- `LOCAL_LLM_MODEL=llama3.2:1b`
- `LOCAL_LLM_TIMEOUT_MS=12000`

Docker Compose Beispiel:

1. Stack starten: `docker compose up -d --build`
2. Modell einmalig im Ollama-Container ziehen:
   - `docker exec smartvillage-ollama ollama pull llama3.2:1b`
3. Optional pruefen:
   - `docker exec smartvillage-ollama ollama list`

Fallback-Verhalten:

- Falls das Modell nicht erreichbar ist oder keine gueltige Antwort liefert, nutzt der Assistant automatisch eine lokale regelbasierte Antwort aus dem freigegebenen API-Kontext.
- Dadurch bleibt die KI-Hilfe funktional, auch wenn das lokale LLM temporaer nicht verfuegbar ist.
