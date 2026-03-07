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

// optional: mehrere Devices pro Prozess
const DEVICE_COUNT = Number.parseInt(process.env.DEVICE_COUNT || "1", 10);

const DISCOVERY_INTERVAL_MS =
  Number.parseInt(process.env.DISCOVERY_INTERVAL_MS || "60000", 10) || 60_000;

const PUBLISH_INTERVAL_MS =
  Number.parseInt(process.env.PUBLISH_INTERVAL_MS || "5000", 10) || 5_000;

// Hilfsfunktion: baut ein Device mit allen Sensorarten
function buildDevice(index: number): DeviceDefinition {
  // leichte Offsets pro Device, damit die Marker nicht exakt übereinander liegen
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
      // 1: Temperature
      {
        sensorId: index * 1000 + 1,
        sensorTypeId: 1,
        name: "Temperatur",
        unit: "°C",
        min: -5,
        max: 35,
        infoText: "Außentemperatur",
      },
      // 2: Humidity
      {
        sensorId: index * 1000 + 2,
        sensorTypeId: 2,
        name: "Luftfeuchte",
        unit: "%",
        min: 20,
        max: 100,
        infoText: "Relative Luftfeuchtigkeit",
      },
      // 3: Pressure
      {
        sensorId: index * 1000 + 3,
        sensorTypeId: 3,
        name: "Luftdruck",
        unit: "hPa",
        min: 980,
        max: 1050,
        infoText: "Barometrischer Luftdruck",
      },
      // 4: Rainfall
      {
        sensorId: index * 1000 + 4,
        sensorTypeId: 4,
        name: "Niederschlag",
        unit: "mm/h",
        min: 0,
        max: 30,
        infoText: "Niederschlagsintensität",
      },
      // 5: Wind Speed
      {
        sensorId: index * 1000 + 5,
        sensorTypeId: 5,
        name: "Windgeschwindigkeit",
        unit: "m/s",
        min: 0,
        max: 20,
        infoText: "Windgeschwindigkeit in Bodennähe",
      },
      // 6: Solar Radiation
      {
        sensorId: index * 1000 + 6,
        sensorTypeId: 6,
        name: "Solarstrahlung",
        unit: "W/m²",
        min: 0,
        max: 1200,
        infoText: "Einstrahlung auf horizontaler Fläche",
      },
      // 7: Soil Moisture
      {
        sensorId: index * 1000 + 7,
        sensorTypeId: 7,
        name: "Bodenfeuchte",
        unit: "%",
        min: 5,
        max: 80,
        infoText: "Bodenfeuchtigkeit im Grünbereich",
      },
      // 8: CO2
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

// alle Devices für diesen Prozess
const devices: DeviceDefinition[] = Array.from(
  { length: DEVICE_COUNT },
  (_, i) => buildDevice(i + 1),
);

const client = mqtt.connect(MQTT_URL);
let discoveryInterval: NodeJS.Timeout | null = null;
let publishInterval: NodeJS.Timeout | null = null;

client.on("connect", () => {
  console.log(
    `✅ Connected to MQTT broker at ${MQTT_URL} (ACCOUNT_ID=${ACCOUNT_ID}, VILLAGE_ID=${VILLAGE_ID}, DEVICE_COUNT=${DEVICE_COUNT})`,
  );
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
  for (const device of devices) {
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

function randomValue(sensor: SensorDefinition) {
  const base = faker.number.float({
    min: sensor.min,
    max: sensor.max,
    fractionDigits: 1,
  });
  return Math.round(base * 10) / 10;
}

function publishMeasurements() {
  const ts = dayjs().toISOString();

  for (const device of devices) {
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
          console.error(
            `Failed to publish reading for ${sensor.name} (${device.deviceId})`,
            err,
          );
        } else {
          console.log(`→ ${topic} ${value} ${sensor.unit}`);
        }
      });
    }
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
