## Freiburg MQTT Simulator

Stand‑alone MQTT simulator for Smart Village auto‑discovery. Publishes a gateway plus Freiburg sensors for `Account.id = 1` (default) to the backend MQTT ingestion.

### Usage

```bash
cd simulations/mqtt-freiburg
npm install
npm run simulate
```

Environment variables (all optional):

- `MQTT_URL` (default `mqtt://localhost:1883`)
- `ACCOUNT_ID` (default `1`)
- `VILLAGE_ID` (default `1`)
- `DISCOVERY_INTERVAL_MS` (default `60000`)
- `PUBLISH_INTERVAL_MS` (default `5000`)

### Topics & payloads

- Discovery: `sv/{ACCOUNT_ID}/{deviceId}/config`
  - Payload includes `villageId`, device meta, and sensors with fixed `sensorId` to allow telemetry publishing.
- Data: `sv/{ACCOUNT_ID}/{deviceId}/sensors/{sensorId}`
  - Payload: `{ value, ts, status, unit, extra }`

### Notes

- The simulator never starts automatically and is not part of Docker Compose.
- Re-announces discovery every minute and emits readings every 5s with realistic random values for Freiburg.
