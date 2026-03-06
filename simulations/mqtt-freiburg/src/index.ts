import mqtt from "mqtt";
import dayjs from "dayjs";
import { faker } from "@faker-js/faker";

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

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const ACCOUNT_ID = process.env.ACCOUNT_ID || "1";
const VILLAGE_ID = Number.parseInt(process.env.VILLAGE_ID || "1", 10);
const DISCOVERY_INTERVAL_MS =
  Number.parseInt(process.env.DISCOVERY_INTERVAL_MS || "60000", 10) || 60_000; // re-announce config every minute
const PUBLISH_INTERVAL_MS =
  Number.parseInt(process.env.PUBLISH_INTERVAL_MS || "5000", 10) || 5_000;

const device: DeviceDefinition = {
  deviceId: "freiburg-gw-1",
  name: "Freiburg Rathaus Gateway",
  latitude: 47.9990,
  longitude: 7.8421,
  sensors: [
    {
      sensorId: 1001,
      sensorTypeId: 1, // Temperature
      name: "Freiburg Temperatur",
      unit: "°C",
      min: 8,
      max: 28,
      infoText: "Außentemperatur Innenstadt",
    },
    {
      sensorId: 1002,
      sensorTypeId: 2, // Humidity
      name: "Freiburg Luftfeuchte",
      unit: "%",
      min: 40,
      max: 90,
      infoText: "Relative Luftfeuchtigkeit",
    },
    {
      sensorId: 1003,
      sensorTypeId: 8, // CO2
      name: "Freiburg CO2",
      unit: "ppm",
      min: 380,
      max: 1200,
      infoText: "Innenstadt CO₂ Konzentration",
    },
  ],
};

const client = mqtt.connect(MQTT_URL);
let discoveryInterval: NodeJS.Timeout | null = null;
let publishInterval: NodeJS.Timeout | null = null;

client.on("connect", () => {
  console.log(`✅ Connected to MQTT broker at ${MQTT_URL}`);
  publishDiscovery();
  discoveryInterval = setInterval(publishDiscovery, DISCOVERY_INTERVAL_MS);
  publishInterval = setInterval(publishMeasurements, PUBLISH_INTERVAL_MS);
});

client.on("error", (err) => {
  console.error("MQTT connection error", err);
});

client.on("close", () => {
  console.log("MQTT connection closed");
});

function publishDiscovery() {
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

function randomValue(sensor: SensorDefinition) {
  const base = faker.number.float({ min: sensor.min, max: sensor.max, precision: 0.1 });
  return Math.round(base * 10) / 10;
}

function publishMeasurements() {
  const ts = dayjs().toISOString();
  for (const sensor of device.sensors) {
    const value = randomValue(sensor);
    const topic = `sv/${ACCOUNT_ID}/${device.deviceId}/sensors/${sensor.sensorId}`;
    const payload = {
      value,
      ts,
      status: "OK",
      unit: sensor.unit,
      extra: {
        source: "simulator",
      },
    };

    client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
      if (err) {
        console.error(`Failed to publish reading for ${sensor.name}`, err);
      } else {
        console.log(`→ ${topic} ${value} ${sensor.unit}`);
      }
    });
  }
}

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
