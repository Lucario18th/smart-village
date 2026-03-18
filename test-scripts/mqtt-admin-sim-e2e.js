#!/usr/bin/env node

const { spawnSync } = require("child_process");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_BASE = process.env.API_BASE_URL || "https://localhost/api";
const ADMIN_EMAIL = process.env.TEST_USER_EMAIL || "freiburg@smart-village.local";
const ADMIN_PASSWORD = process.env.TEST_USER_PASSWORD || "test1234";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    error.response = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

function publishViaMosquitto(topic, payloadJson) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "smartvillage-mosquitto",
      "mosquitto_pub",
      "-h",
      "localhost",
      "-p",
      "1883",
      "-t",
      topic,
      "-m",
      payloadJson,
    ],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "mosquitto_pub failed");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const login = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const token = login.accessToken;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const me = await request("/auth/me", { headers });
  const villageId = me?.villages?.[0]?.id;
  const accountId = me?.id;

  if (!villageId || !accountId) {
    throw new Error("Missing villageId/accountId from /auth/me");
  }

  const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const deviceCode = `simlab-mqtt-${suffix}`;

  const device = await request(`/devices/village/${villageId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      deviceId: deviceCode,
      name: "SimLab MQTT Device",
    }),
  });

  const sensor = await request(`/sensors/village/${villageId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      sensorTypeId: 1,
      name: `SimLab MQTT Sensor ${suffix}`,
      infoText: "mqtt-admin-sim-e2e",
      deviceId: device.id,
    }),
  });

  const value = Number((Math.random() * 50 + 10).toFixed(2));
  const ts = new Date().toISOString();
  const topic = `sv/${accountId}/${deviceCode}/sensors/${sensor.id}`;
  const payload = JSON.stringify({ value, ts, status: "OK" });

  publishViaMosquitto(topic, payload);
  await sleep(2500);

  const readings = await request(`/sensor-readings/${sensor.id}?limit=5&order=desc`, {
    headers,
  });

  const latest = Array.isArray(readings) ? readings[0] : null;
  if (!latest) {
    throw new Error("No reading returned by /sensor-readings after MQTT publish");
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        topic,
        publishedValue: value,
        latestReading: latest,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
