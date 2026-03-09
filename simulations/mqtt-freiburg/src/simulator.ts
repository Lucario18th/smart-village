import mqtt from "mqtt";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

type SensorTypeId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9;

type SensorDefinition = {
  sensorId: number;
  sensorTypeId: SensorTypeId;
  name: string;
  unit: string;
};

type DeviceDefinition = {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  sensors: SensorDefinition[];
  kind: "gateway" | "mitfahrbank";
};

type SensorRuntimeState = {
  lastSentAt: dayjs.Dayjs | null;
  isFailed: boolean;
  stuck: boolean;
  stuckValue: number | null;
  soilMoisture?: number;
};

type DeviceRuntimeState = {
  device: DeviceDefinition;
  isOnline: boolean;
  offlineSince: dayjs.Dayjs | null;
  sensorStates: Record<number, SensorRuntimeState>;
};

type VillageKey = "freiburg" | "loerrach" | "buggingen";

type VillageConfig = {
  key: VillageKey;
  name: string;
  accountOffset: number;
  gatewayBases: { lat: number; lng: number; name: string }[];
  benches: { lat: number; lng: number; name: string }[];
};

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const ACCOUNT_ID = process.env.ACCOUNT_ID || "1";
const SCENARIO = Number.parseInt(process.env.SCENARIO || "2", 10);
const DEVICE_COUNT = Number.parseInt(process.env.DEVICE_COUNT || "2", 10);
const MITFAHRBANK_COUNT = Number.parseInt(
  process.env.MITFAHRBANK_COUNT || "3",
  10,
);
const VILLAGE = (process.env.VILLAGE || "freiburg") as VillageKey;

const SENSOR_INTERVAL_MS: Record<SensorTypeId, number> = {
  1: 5 * 60 * 1000, // Temperatur
  2: 5 * 60 * 1000, // Feuchte
  3: 10 * 60 * 1000, // Druck
  4: 5 * 60 * 1000, // Niederschlag
  5: 60 * 1000, // Wind
  6: 5 * 60 * 1000, // Solar
  7: 10 * 60 * 1000, // Bodenfeuchte
  8: 10 * 60 * 1000, // CO2
  9: 30 * 1000, // Mitfahrbank
};

const DEVICE_FAILURE_PROBABILITY = 0.0001;
const DEVICE_REVIVE_PROBABILITY = 0.0005;
const SENSOR_FAILURE_PROBABILITY = 0.0002;
const SENSOR_STUCK_PROBABILITY = 0.0002;
const SENSOR_RECOVER_PROBABILITY = 0.002;

const SIM_START = dayjs.utc("2026-01-01T00:00:00Z");
const PHASE2_START = dayjs.utc("2026-03-26T00:00:00Z");
const SPEED_PHASE1 = 1440;
const SPEED_PHASE2 = 1;
const REAL_START = dayjs.utc();
const PHASE1_REAL_DURATION_MS =
  PHASE2_START.diff(SIM_START, "millisecond") / SPEED_PHASE1;

function simNow(): dayjs.Dayjs {
  const elapsedRealMs = dayjs.utc().diff(REAL_START, "millisecond");
  if (elapsedRealMs < PHASE1_REAL_DURATION_MS) {
    return SIM_START.add(elapsedRealMs * SPEED_PHASE1, "millisecond");
  }
  const extraReal = elapsedRealMs - PHASE1_REAL_DURATION_MS;
  return PHASE2_START.add(extraReal * SPEED_PHASE2, "millisecond");
}

const villages: Record<VillageKey, VillageConfig> = {
  freiburg: {
    key: "freiburg",
    name: "Freiburg im Breisgau",
    accountOffset: 0,
    gatewayBases: [
      { lat: 47.9966, lng: 7.8524, name: "Altstadt" },
      { lat: 47.9991, lng: 7.8428, name: "Rathaus" },
      { lat: 47.9927, lng: 7.8489, name: "Stühlinger" },
    ],
    benches: [
      { lat: 47.9987, lng: 7.8518, name: "Bertoldsbrunnen" },
      { lat: 47.995, lng: 7.8453, name: "Siegesdenkmal" },
      { lat: 47.9998, lng: 7.8546, name: "Hauptbahnhof" },
    ],
  },
  loerrach: {
    key: "loerrach",
    name: "Lörrach",
    accountOffset: 100,
    gatewayBases: [
      { lat: 47.6152, lng: 7.6677, name: "Bahnhof" },
      { lat: 47.6103, lng: 7.6654, name: "Innenstadt" },
      { lat: 47.6047, lng: 7.6616, name: "Burghof" },
    ],
    benches: [
      { lat: 47.6159, lng: 7.6648, name: "Busbahnhof" },
      { lat: 47.6118, lng: 7.6703, name: "Marktplatz" },
      { lat: 47.6086, lng: 7.6594, name: "Stadtpark" },
    ],
  },
  buggingen: {
    key: "buggingen",
    name: "Buggingen",
    accountOffset: 200,
    gatewayBases: [
      { lat: 47.8763, lng: 7.6132, name: "Rathaus" },
      { lat: 47.8725, lng: 7.6089, name: "Schule" },
      { lat: 47.8791, lng: 7.6062, name: "Ortsmitte" },
    ],
    benches: [
      { lat: 47.8754, lng: 7.6105, name: "Rathausplatz" },
      { lat: 47.8733, lng: 7.6069, name: "Schulzentrum" },
      { lat: 47.8778, lng: 7.6041, name: "Bahnhofsstraße" },
    ],
  },
};

const village = villages[VILLAGE] ?? villages.freiburg;

function jitter(value: number, maxDelta = 0.003) {
  const delta = (Math.random() * 2 - 1) * maxDelta;
  return Math.round((value + delta) * 1e6) / 1e6;
}

function buildGateways(): DeviceDefinition[] {
  const gateways = village.gatewayBases
    .slice(0, DEVICE_COUNT)
    .map((base, idx) => {
      const idOffset = idx + 1;
      const latitude = jitter(base.lat, 0.004);
      const longitude = jitter(base.lng, 0.004);
      const sensorBase = (village.accountOffset + idOffset) * 1000;
      const sensors: SensorDefinition[] = [
        { sensorId: sensorBase + 1, sensorTypeId: 1, name: "Temperatur", unit: "°C" },
        { sensorId: sensorBase + 2, sensorTypeId: 2, name: "Luftfeuchte", unit: "%" },
        { sensorId: sensorBase + 3, sensorTypeId: 3, name: "Luftdruck", unit: "hPa" },
        { sensorId: sensorBase + 4, sensorTypeId: 4, name: "Niederschlag", unit: "mm/h" },
        { sensorId: sensorBase + 5, sensorTypeId: 5, name: "Windgeschwindigkeit", unit: "m/s" },
        { sensorId: sensorBase + 6, sensorTypeId: 6, name: "Solarstrahlung", unit: "W/m²" },
        { sensorId: sensorBase + 7, sensorTypeId: 7, name: "Bodenfeuchte", unit: "%" },
        { sensorId: sensorBase + 8, sensorTypeId: 8, name: "CO₂", unit: "ppm" },
      ];

      return {
        deviceId: `gw-${village.key}-${idOffset}`,
        name: `${village.name} Gateway ${idOffset}`,
        latitude,
        longitude,
        sensors,
        kind: "gateway" as const,
      };
    });

  return gateways.slice(0, Math.max(2, DEVICE_COUNT));
}

function buildBenches(): DeviceDefinition[] {
  if (SCENARIO === 1) return [];
  const benches = village.benches
    .slice(0, MITFAHRBANK_COUNT)
    .map((base, idx) => {
      const deviceIndex = idx + 1;
      const latitude = jitter(base.lat, 0.0025);
      const longitude = jitter(base.lng, 0.0025);
      const sensorId = (village.accountOffset + 100 + deviceIndex) * 1000 + 1;
      const sensor: SensorDefinition = {
        sensorId,
        sensorTypeId: 9,
        name: "Mitfahrbank",
        unit: "Personen",
      };

      return {
        deviceId: `bench-${village.key}-${deviceIndex}`,
        name: `${village.name} Mitfahrbank ${deviceIndex}`,
        latitude,
        longitude,
        sensors: [sensor],
        kind: "mitfahrbank" as const,
      };
    });

  return benches.slice(0, Math.max(3, MITFAHRBANK_COUNT));
}

function buildDevices(): DeviceRuntimeState[] {
  const devices = [...buildGateways(), ...buildBenches()];
  return devices.map((device) => ({
    device,
    isOnline: true,
    offlineSince: null,
    sensorStates: Object.fromEntries(
      device.sensors.map((sensor) => [
        sensor.sensorId,
        {
          lastSentAt: null,
          isFailed: false,
          stuck: false,
          stuckValue: null,
          soilMoisture: sensor.sensorTypeId === 7 ? 45 + Math.random() * 10 : undefined,
        } satisfies SensorRuntimeState,
      ]),
    ),
  }));
}

const deviceStates: DeviceRuntimeState[] = buildDevices();
const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log(
    `✅ MQTT connected ${MQTT_URL} (ACCOUNT_ID=${ACCOUNT_ID}, VILLAGE=${village.key}, SCENARIO=${SCENARIO}, DEVICES=${deviceStates.length})`,
  );
  publishDiscovery();
  setInterval(publishMeasurements, 1_000);
});

client.on("error", (err) => {
  console.error("MQTT error", err);
});

function publishDiscovery() {
  for (const state of deviceStates) {
    const { device } = state;
    const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/config`;
    const payload = {
      village: village.key,
      device: {
        name: device.name,
        latitude: device.latitude,
        longitude: device.longitude,
      },
      sensors: device.sensors.map((s) => ({
        sensorId: s.sensorId,
        sensorTypeId: s.sensorTypeId,
        name: s.name,
        latitude: device.latitude,
        longitude: device.longitude,
      })),
    };
    client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }
}

function maybeToggleDevice(state: DeviceRuntimeState) {
  if (state.isOnline) {
    if (Math.random() < DEVICE_FAILURE_PROBABILITY) {
      state.isOnline = false;
      state.offlineSince = simNow();
      console.warn(`⚠️ Device offline ${state.device.deviceId}`);
    }
  } else if (Math.random() < DEVICE_REVIVE_PROBABILITY) {
    state.isOnline = true;
    state.offlineSince = null;
    console.log(`✅ Device back ${state.device.deviceId}`);
    publishDiscoveryFor([state]);
  }
}

function publishDiscoveryFor(states: DeviceRuntimeState[]) {
  for (const state of states) {
    const { device } = state;
    const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/config`;
    const payload = {
      village: village.key,
      device: {
        name: device.name,
        latitude: device.latitude,
        longitude: device.longitude,
      },
      sensors: device.sensors.map((s) => ({
        sensorId: s.sensorId,
        sensorTypeId: s.sensorTypeId,
        name: s.name,
        latitude: device.latitude,
        longitude: device.longitude,
      })),
    };
    client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }
}

function maybeFailSensor(state: DeviceRuntimeState, sensorId: number) {
  const sensorState = state.sensorStates[sensorId];
  if (!sensorState) return;

  if (sensorState.isFailed) {
    if (Math.random() < SENSOR_RECOVER_PROBABILITY) {
      sensorState.isFailed = false;
      sensorState.stuck = false;
      sensorState.stuckValue = null;
    }
    return;
  }

  if (sensorState.stuck && Math.random() < SENSOR_RECOVER_PROBABILITY) {
    sensorState.stuck = false;
    sensorState.stuckValue = null;
    return;
  }

  if (!sensorState.stuck && Math.random() < SENSOR_STUCK_PROBABILITY) {
    sensorState.stuck = true;
    sensorState.stuckValue = null;
    return;
  }

  if (Math.random() < SENSOR_FAILURE_PROBABILITY) {
    sensorState.isFailed = true;
  }
}

function seasonBaseline(ts: dayjs.Dayjs, villageKey: VillageKey) {
  const month = ts.month(); // 0-11
  const baseTemp =
    villageKey === "buggingen"
      ? -2 + month * 1.8
      : villageKey === "loerrach"
        ? -1 + month * 1.6
        : 0 + month * 1.5;
  return baseTemp;
}

function rainEvents(ts: dayjs.Dayjs) {
  const date = ts.toDate().getTime();
  const events = [
    { start: dayjs.utc("2026-01-10T16:00:00Z"), end: dayjs.utc("2026-01-11T06:00:00Z"), intensity: 8 },
    { start: dayjs.utc("2026-02-05T14:00:00Z"), end: dayjs.utc("2026-02-05T22:00:00Z"), intensity: 18 },
    { start: dayjs.utc("2026-02-22T03:00:00Z"), end: dayjs.utc("2026-02-23T18:00:00Z"), intensity: 6 },
    { start: dayjs.utc("2026-03-12T00:00:00Z"), end: dayjs.utc("2026-03-14T23:59:00Z"), intensity: 3 },
  ];

  for (const ev of events) {
    if (date >= ev.start.valueOf() && date <= ev.end.valueOf()) {
      return ev.intensity;
    }
  }
  return 0;
}

function pressureAnomaly(ts: dayjs.Dayjs) {
  const ref = SIM_START.valueOf();
  const days = (ts.valueOf() - ref) / (1000 * 60 * 60 * 24);
  return Math.sin(days / 6) * 5 - Math.cos(days / 14) * 7;
}

function diurnalFactor(ts: dayjs.Dayjs, shiftHours = 0) {
  const hour = ts.utc().hour() + ts.utc().minute() / 60;
  return Math.sin(((hour - shiftHours) / 24) * 2 * Math.PI);
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function updateSoilMoisture(state: SensorRuntimeState, rain: number) {
  const current = state.soilMoisture ?? 45;
  const rainImpact = rain * 0.6;
  const evap = rain === 0 ? 0.05 : 0.02;
  const next = clamp(current + rainImpact - evap, 5, 90);
  state.soilMoisture = next;
  return next;
}

function valueFor(sensor: SensorDefinition, ts: dayjs.Dayjs, villageKey: VillageKey, state: SensorRuntimeState) {
  const rain = rainEvents(ts);
  switch (sensor.sensorTypeId) {
    case 1: {
      const base = seasonBaseline(ts, villageKey);
      const diurnal = diurnalFactor(ts, 4) * 6;
      const noise = (Math.random() - 0.5) * 1.5;
      const rainCooling = rain > 0 ? -2 : 0;
      return clamp(base + diurnal + rainCooling + noise, -10, 35);
    }
    case 2: {
      const base = 70 + diurnalFactor(ts, 3) * 10;
      const rainBoost = rain > 0 ? 20 : 0;
      const noise = (Math.random() - 0.5) * 5;
      return clamp(base + rainBoost + noise, 40, 100);
    }
    case 3: {
      const baseline = 1015 + pressureAnomaly(ts);
      const noise = (Math.random() - 0.5) * 1.5;
      const rainDip = rain > 0 ? -6 : 0;
      return clamp(baseline + rainDip + noise, 985, 1045);
    }
    case 4: {
      if (rain === 0) return 0;
      const variability = rain * (0.7 + Math.random() * 0.6);
      return Math.round(variability * 10) / 10;
    }
    case 5: {
      const base = 1 + Math.random() * 2;
      const rainWind = rain > 0 ? 3 + Math.random() * 4 : 0;
      const gust = Math.random() < 0.15 ? Math.random() * 4 : 0;
      return Math.round((base + rainWind + gust) * 10) / 10;
    }
    case 6: {
      const daylight = Math.max(0, diurnalFactor(ts, -6));
      const clearSky = 1200 * daylight ** 2;
      const rainFactor = rain > 0 ? 0.3 : 1;
      const noise = Math.random() * 60;
      return clamp(clearSky * rainFactor + noise, 0, 1200);
    }
    case 7: {
      return updateSoilMoisture(state, rain);
    }
    case 8: {
      const base = 420 + diurnalFactor(ts, 5) * 60;
      const noise = (Math.random() - 0.5) * 20;
      return clamp(base + noise, 380, 1500);
    }
    case 9: {
      const hour = ts.utc().hour() + ts.utc().minute() / 60;
      if (hour < 6 || hour > 22) return 0;
      const morningPeak = Math.exp(-((hour - 8) ** 2) / 1.5);
      const eveningPeak = Math.exp(-((hour - 17) ** 2) / 1.5);
      const base = 0.2 + morningPeak * 4 + eveningPeak * 3;
      const noise = Math.random() * 0.6;
      return Math.min(6, Math.max(0, base + noise));
    }
    default:
      return 0;
  }
}

function shouldSend(sensor: SensorDefinition, state: SensorRuntimeState, now: dayjs.Dayjs) {
  const interval = SENSOR_INTERVAL_MS[sensor.sensorTypeId];
  if (!state.lastSentAt) return true;
  const elapsed = now.diff(state.lastSentAt, "millisecond");
  return elapsed >= interval;
}

function publishMeasurements() {
  const ts = simNow();

  for (const state of deviceStates) {
    maybeToggleDevice(state);
    if (!state.isOnline) continue;

    for (const sensor of state.device.sensors) {
      const sensorState = state.sensorStates[sensor.sensorId];
      if (!shouldSend(sensor, sensorState, ts)) continue;

      maybeFailSensor(state, sensor.sensorId);
      const runtime = state.sensorStates[sensor.sensorId];

      let status: "OK" | "ERROR" = "OK";
      let value: number | null = null;

      if (runtime.isFailed) {
        status = "ERROR";
      } else if (runtime.stuck) {
        status = "ERROR";
        if (runtime.stuckValue == null) {
          runtime.stuckValue = valueFor(sensor, ts, village.key, runtime);
        }
        value = runtime.stuckValue;
      } else {
        value = valueFor(sensor, ts, village.key, runtime);
      }

      runtime.lastSentAt = ts;

      const topic = `sv/${ACCOUNT_ID}/${state.device.deviceId}/sensors/${sensor.sensorId}`;
      const payload: any = {
        value,
        ts: ts.toISOString(),
        status,
        unit: sensor.unit,
        extra: {
          source: "simulator",
        },
      };

      if (status !== "OK") {
        payload.extra.errorReason = runtime.isFailed
          ? "sensor_failure"
          : "sensor_stuck";
      }

      client.publish(topic, JSON.stringify(payload), { qos: 0 });
    }
  }
}

process.on("SIGINT", () => {
  console.log("Stopping simulator …");
  client.end(true, () => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("Stopping simulator …");
  client.end(true, () => process.exit(0));
});
