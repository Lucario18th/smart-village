import mqtt from "mqtt";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";

// ---- Typen -----------------------------------------------------------------

type SensorDefinition = {
  sensorId: number;
  sensorTypeId: number;
  name: string;
  unit: string;
  min: number;
  max: number;
  infoText?: string;
};

type DeviceDefinition = {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  sensors: SensorDefinition[];
};

type SensorRuntimeState = {
  isFailed: boolean;
  stuck: boolean;
  stuckValue: number | null;
};

type DeviceRuntimeState = {
  device: DeviceDefinition;
  isOnline: boolean;
  offlineSince: string | null;
  sensorStates: Record<number, SensorRuntimeState>;
};

// ---- Umgebungsvariablen / Konfiguration ------------------------------------

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const ACCOUNT_ID = process.env.ACCOUNT_ID || "1";
const VILLAGE_ID = Number.parseInt(process.env.VILLAGE_ID || "1", 10);

// 1 = nur Gateways, 2 = Gateways + Mitfahrbänke
const SCENARIO = Number.parseInt(process.env.SCENARIO || "1", 10);

// Anzahl Gateways
const DEVICE_COUNT = Number.parseInt(process.env.DEVICE_COUNT || "1", 10);

// Discovery-Verhalten
// Discovery bei (Re-)Connect, wenn DISCOVERY_ON_CONNECT=1
const DISCOVERY_ON_CONNECT = process.env.DISCOVERY_ON_CONNECT === "1";
// Optionale periodische Discovery, z.B. DISCOVERY_INTERVAL_MS=600000 (10 min)
const DISCOVERY_INTERVAL_MS =
  Number.parseInt(process.env.DISCOVERY_INTERVAL_MS || "0", 10) || 0;

// Messintervall
const PUBLISH_INTERVAL_MS =
  Number.parseInt(process.env.PUBLISH_INTERVAL_MS || "5000", 10) || 5_000;

// Fehler-Simulation
const DEVICE_FAILURE_PROBABILITY = Number.parseFloat(
  process.env.DEVICE_FAILURE_PROBABILITY || "0.001", // 0.1% pro Tick
);
const DEVICE_REVIVE_PROBABILITY = Number.parseFloat(
  process.env.DEVICE_REVIVE_PROBABILITY || "0.001", // 0.1% pro Tick
);
const SENSOR_FAILURE_PROBABILITY = Number.parseFloat(
  process.env.SENSOR_FAILURE_PROBABILITY || "0.002", // 0.2% pro Tick
);
const SENSOR_STUCK_PROBABILITY = Number.parseFloat(
  process.env.SENSOR_STUCK_PROBABILITY || "0.002",
);

// Mitfahrbank-Konfiguration
const MITFAHRBANK_SENSOR_TYPE_ID = 9;
const MITFAHRBANK_BASE_LAT = 47.864;
const MITFAHRBANK_BASE_LNG = 7.64;
const MITFAHRBANK_COUNT = Number.parseInt(
  process.env.MITFAHRBANK_COUNT || "3",
  10,
);

// ---- Device-/Sensor-Definitionen -------------------------------------------

function buildGatewayDevice(index: number): DeviceDefinition {
  const baseLat = 47.9959;
  const baseLng = 7.8522;
  const latOffset = (index - 1) * 0.002;
  const lngOffset = (index - 1) * 0.002;

  return {
    deviceId: `gw-v${VILLAGE_ID}-dev-${index}`,
    name: `Village ${VILLAGE_ID} Gateway ${index}`,
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
    sensors: [
      {
        sensorId: index * 1000 + 1,
        sensorTypeId: 1,
        name: "Temperatur",
        unit: "°C",
        min: -5,
        max: 35,
        infoText: "Außentemperatur",
      },
      {
        sensorId: index * 1000 + 2,
        sensorTypeId: 2,
        name: "Luftfeuchte",
        unit: "%",
        min: 20,
        max: 100,
        infoText: "Relative Luftfeuchtigkeit",
      },
      {
        sensorId: index * 1000 + 3,
        sensorTypeId: 3,
        name: "Luftdruck",
        unit: "hPa",
        min: 980,
        max: 1050,
        infoText: "Barometrischer Luftdruck",
      },
      {
        sensorId: index * 1000 + 4,
        sensorTypeId: 4,
        name: "Niederschlag",
        unit: "mm/h",
        min: 0,
        max: 30,
        infoText: "Niederschlagsintensität",
      },
      {
        sensorId: index * 1000 + 5,
        sensorTypeId: 5,
        name: "Windgeschwindigkeit",
        unit: "m/s",
        min: 0,
        max: 20,
        infoText: "Windgeschwindigkeit in Bodennähe",
      },
      {
        sensorId: index * 1000 + 6,
        sensorTypeId: 6,
        name: "Solarstrahlung",
        unit: "W/m²",
        min: 0,
        max: 1200,
        infoText: "Einstrahlung auf horizontaler Fläche",
      },
      {
        sensorId: index * 1000 + 7,
        sensorTypeId: 7,
        name: "Bodenfeuchte",
        unit: "%",
        min: 5,
        max: 80,
        infoText: "Bodenfeuchtigkeit im Grünbereich",
      },
      {
        sensorId: index * 1000 + 8,
        sensorTypeId: 8,
        name: "CO₂",
        unit: "ppm",
        min: 380,
        max: 1500,
        infoText: "CO₂ Konzentration",
      },
    ],
  };
}

function buildMitfahrbankDevice(index: number): DeviceDefinition {
  const deviceIndex = index + 100;

  return {
    deviceId: `gw-v${VILLAGE_ID}-mitfahrbank-${deviceIndex}`,
    name: `Mitfahrbank ${VILLAGE_ID} #${index}`,
    latitude: MITFAHRBANK_BASE_LAT + (index - 1) * 0.0015,
    longitude: MITFAHRBANK_BASE_LNG + (index - 1) * 0.0015,
    sensors: [
      {
        sensorId: deviceIndex * 1000 + 1,
        sensorTypeId: MITFAHRBANK_SENSOR_TYPE_ID,
        name: "Mitfahrbank",
        unit: "Personen",
        min: 0,
        max: 5,
        infoText:
          "Anzahl wartender Personen an der Mitfahrbank (AI-Erkennung)",
      },
    ],
  };
}

// ---- Initialisierung der Devices -------------------------------------------

let deviceStates: DeviceRuntimeState[] = initDevices();

function initDevices(): DeviceRuntimeState[] {
  let devices: DeviceDefinition[];

  if (SCENARIO === 1) {
    devices = Array.from({ length: DEVICE_COUNT }, (_, i) =>
      buildGatewayDevice(i + 1),
    );
  } else if (SCENARIO === 2) {
    const gateways = Array.from({ length: DEVICE_COUNT }, (_, i) =>
      buildGatewayDevice(i + 1),
    );
    const mitfahrbanken = Array.from(
      { length: MITFAHRBANK_COUNT },
      (_, i) => buildMitfahrbankDevice(i + 1),
    );
    devices = [...gateways, ...mitfahrbanken];
  } else {
    devices = Array.from({ length: DEVICE_COUNT }, (_, i) =>
      buildGatewayDevice(i + 1),
    );
  }

  return devices.map((device) => ({
    device,
    isOnline: true,
    offlineSince: null,
    sensorStates: Object.fromEntries(
      device.sensors.map((s) => [
        s.sensorId,
        {
          isFailed: false,
          stuck: false,
          stuckValue: null,
        } satisfies SensorRuntimeState,
      ]),
    ),
  }));
}

// ---- MQTT Client -----------------------------------------------------------

const client = mqtt.connect(MQTT_URL);
let discoveryInterval: NodeJS.Timeout | null = null;
let publishInterval: NodeJS.Timeout | null = null;

client.on("connect", () => {
  console.log(
    `✅ Connected to MQTT broker at ${MQTT_URL} (ACCOUNT_ID=${ACCOUNT_ID}, VILLAGE_ID=${VILLAGE_ID}, SCENARIO=${SCENARIO}, DEVICE_COUNT=${DEVICE_COUNT}, MITFAHRBANK_COUNT=${SCENARIO === 2 ? MITFAHRBANK_COUNT : 0})`,
  );

  if (DISCOVERY_ON_CONNECT) {
    publishDiscovery();
  }

  if (DISCOVERY_INTERVAL_MS > 0) {
    discoveryInterval = setInterval(
      publishDiscovery,
      DISCOVERY_INTERVAL_MS,
    );
  }

  publishInterval = setInterval(publishMeasurements, PUBLISH_INTERVAL_MS);
});

client.on("error", (err) => {
  console.error("MQTT connection error", err);
});

client.on("close", () => {
  console.log("MQTT connection closed");
});

// ---- Discovery -------------------------------------------------------------

function publishDiscovery() {
  for (const state of deviceStates) {
    const { device } = state;
    const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/config`;

    const payload = {
      villageId: VILLAGE_ID,
      device: {
        name: device.name,
        latitude: device.latitude,
        longitude: device.longitude,
      },
      sensors: device.sensors.map((s) => ({
        sensorId: s.sensorId,
        sensorTypeId: s.sensorTypeId,
        name: s.name,
        infoText: s.infoText,
        latitude: device.latitude,
        longitude: device.longitude,
      })),
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error("Failed to publish discovery payload", err);
      } else {
        console.log(`📣 Discovery published to ${topic}`);
      }
    });
  }
}

// ---- Fehler-Simulation ----------------------------------------------------

function maybeFailDevice(state: DeviceRuntimeState) {
  if (!state.isOnline) {
    // Chance, dass Device wieder online kommt
    if (Math.random() < DEVICE_REVIVE_PROBABILITY) {
      state.isOnline = true;
      state.offlineSince = null;
      console.log(`✅ Device back online: ${state.device.deviceId}`);

      // Beim "Reboot" nochmal Discovery schicken, falls gewünscht
      if (DISCOVERY_ON_CONNECT) {
        const singleDeviceStates = [state];
        publishDiscoveryFor(singleDeviceStates);
      }
    }
    return;
  }

  if (Math.random() < DEVICE_FAILURE_PROBABILITY) {
    state.isOnline = false;
    state.offlineSince = dayjs().toISOString();
    console.log(`⚠️ Device went OFFLINE: ${state.device.deviceId}`);
  }
}

function publishDiscoveryFor(states: DeviceRuntimeState[]) {
  for (const state of states) {
    const { device } = state;
    const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/config`;

    const payload = {
      villageId: VILLAGE_ID,
      device: {
        name: device.name,
        latitude: device.latitude,
        longitude: device.longitude,
      },
      sensors: device.sensors.map((s) => ({
        sensorId: s.sensorId,
        sensorTypeId: s.sensorTypeId,
        name: s.name,
        infoText: s.infoText,
        latitude: device.latitude,
        longitude: device.longitude,
      })),
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error(
          "Failed to publish discovery payload for device",
          device.deviceId,
          err,
        );
      } else {
        console.log(`📣 Discovery (re)published to ${topic}`);
      }
    });
  }
}

function maybeFailSensor(state: DeviceRuntimeState, sensorId: number) {
  const sensorState = state.sensorStates[sensorId];

  if (!sensorState) return;

  // Bereits failed → bleibt es
  if (sensorState.isFailed) {
    return;
  }

  // Chance, dass Sensor stuck wird
  if (!sensorState.stuck && Math.random() < SENSOR_STUCK_PROBABILITY) {
    sensorState.stuck = true;
    console.log(
      `⚠️ Sensor stuck: device=${state.device.deviceId} sensor=${sensorId}`,
    );
  }

  // Chance, dass Sensor komplett ausfällt
  if (Math.random() < SENSOR_FAILURE_PROBABILITY) {
    sensorState.isFailed = true;
    console.log(
      `❌ Sensor failed: device=${state.device.deviceId} sensor=${sensorId}`,
    );
  }
}

// ---- Werte-Generierung -----------------------------------------------------

function randomValue(sensor: SensorDefinition): number {
  if (sensor.unit === "Personen") {
    const min = Math.max(0, Math.round(sensor.min));
    const max = Math.round(sensor.max);
    return faker.number.int({ min, max });
  }

  const base = faker.number.float({
    min: sensor.min,
    max: sensor.max,
    fractionDigits: 1,
  });
  return Math.round(base * 10) / 10;
}

// ---- Hauptloop für Messwerte ----------------------------------------------

function publishMeasurements() {
  const ts = dayjs().toISOString();

  for (const state of deviceStates) {
    // Device online/offline simulieren
    maybeFailDevice(state);

    if (!state.isOnline) {
      // Device komplett offline → keine Werte
      continue;
    }

    const { device } = state;

    for (const sensor of device.sensors) {
      maybeFailSensor(state, sensor.sensorId);
      const sensorState = state.sensorStates[sensor.sensorId];

      let status: "OK" | "ERROR" = "OK";
      let value: number | null;

      if (sensorState.isFailed) {
        status = "ERROR";
        value = null;
      } else if (sensorState.stuck) {
        if (sensorState.stuckValue == null) {
          sensorState.stuckValue = randomValue(sensor);
        }
        value = sensorState.stuckValue;
      } else {
        value = randomValue(sensor);
      }

      const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/sensors/${sensor.sensorId}`;
      const payload: any = {
        value,
        ts,
        status,
        unit: sensor.unit,
        extra: {
          source: "simulator",
        },
      };

      if (status !== "OK") {
        payload.extra.errorReason = sensorState.isFailed
          ? "sensor_failure"
          : "sensor_stuck";
      }

      client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
        if (err) {
          console.error(
            `Failed to publish reading for ${sensor.name} (${device.deviceId})`,
            err,
          );
        } else {
          console.log(
            `→ ${topic} ${value ?? "null"} ${sensor.unit} [${status}]`,
          );
        }
      });
    }
  }
}

// ---- Shutdown-Handling -----------------------------------------------------

function shutdown() {
  console.log("Shutting down simulator...");
  if (discoveryInterval) {
    clearInterval(discoveryInterval);
  }
  if (publishInterval) {
    clearInterval(publishInterval);
  }
  client.end(false, () => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
