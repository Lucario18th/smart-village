#!/usr/bin/env node

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  nginxBaseUrl: process.env.NGINX_BASE_URL || "https://localhost",
  backendBaseUrl: process.env.BACKEND_BASE_URL || "http://localhost:8000",
  durationSec: Number(process.env.SOAK_DURATION_SEC || 900),
  workers: Number(process.env.SOAK_WORKERS || 35),
  reportEverySec: Number(process.env.SOAK_REPORT_EVERY_SEC || 30),
  testUserEmail: process.env.TEST_USER_EMAIL || "freiburg@smart-village.local",
  testUserPassword: process.env.TEST_USER_PASSWORD || "test1234",
  sloP95Ms: Number(process.env.SLO_P95_MS || 500),
  sloErrorRatePercent: Number(process.env.SLO_ERROR_RATE_PERCENT || 1),
};

const tlsAgent = new https.Agent({ rejectUnauthorized: false });
let authHeader = null;
let sensorId = null;
let villageId = null;

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
  return sortedValues[idx];
}

function summarize(latencies) {
  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    avg: sum / latencies.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

async function requestOnce({ url, method = "GET", headers = {}, body = null, timeoutMs = 10000 }) {
  const started = process.hrtime.bigint();
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const client = isHttps ? https : http;

  const requestHeaders = { ...headers };
  const payload = body ? Buffer.from(typeof body === "string" ? body : JSON.stringify(body)) : null;

  if (payload) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    requestHeaders["Content-Length"] = payload.byteLength;
  }

  return new Promise((resolve) => {
    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers: requestHeaders,
        agent: isHttps ? tlsAgent : undefined,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          const ended = process.hrtime.bigint();
          const latencyMs = Number(ended - started) / 1_000_000;
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = null;
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            latencyMs,
            json,
          });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", () => {
      const ended = process.hrtime.bigint();
      const latencyMs = Number(ended - started) / 1_000_000;
      resolve({ ok: false, statusCode: 0, latencyMs, json: null });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function bootstrap() {
  const login = await requestOnce({
    url: `${CONFIG.backendBaseUrl}/api/auth/login`,
    method: "POST",
    body: { email: CONFIG.testUserEmail, password: CONFIG.testUserPassword },
  });

  if (!login.ok || !login.json?.accessToken) {
    throw new Error(`Bootstrap login failed with status ${login.statusCode}`);
  }

  authHeader = { Authorization: `Bearer ${login.json.accessToken}` };

  const me = await requestOnce({
    url: `${CONFIG.backendBaseUrl}/api/auth/me`,
    headers: authHeader,
  });

  if (!me.ok || !Array.isArray(me.json?.villages) || me.json.villages.length === 0) {
    throw new Error("Bootstrap /api/auth/me failed or no villages available");
  }

  villageId = me.json.villages[0].id;

  const createSensor = await requestOnce({
    url: `${CONFIG.backendBaseUrl}/api/sensors/village/${villageId}`,
    method: "POST",
    headers: authHeader,
    body: {
      sensorTypeId: 1,
      name: `Soak Sensor ${Date.now()}`,
      infoText: "Temporary soak sensor",
    },
  });

  if (!createSensor.ok || !createSensor.json?.id) {
    throw new Error(`Could not create temporary sensor (status ${createSensor.statusCode})`);
  }

  sensorId = createSensor.json.id;
}

function pickScenario() {
  const r = Math.random();

  // Weighted mix of realistic user and operational traffic.
  if (r < 0.25) {
    return {
      key: "health",
      req: { url: `${CONFIG.nginxBaseUrl}/api/health` },
    };
  }
  if (r < 0.45) {
    return {
      key: "app-villages",
      req: { url: `${CONFIG.nginxBaseUrl}/api/app/villages` },
    };
  }
  if (r < 0.60) {
    return {
      key: "mobile-villages",
      req: { url: `${CONFIG.nginxBaseUrl}/api/mobile-api/villages` },
    };
  }
  if (r < 0.70) {
    return {
      key: "auth-login",
      req: {
        url: `${CONFIG.nginxBaseUrl}/api/auth/login`,
        method: "POST",
        body: { email: CONFIG.testUserEmail, password: CONFIG.testUserPassword },
      },
    };
  }
  if (r < 0.82) {
    return {
      key: "auth-me",
      req: {
        url: `${CONFIG.backendBaseUrl}/api/auth/me`,
        headers: authHeader,
      },
    };
  }
  if (r < 0.93) {
    return {
      key: "sensor-list",
      req: {
        url: `${CONFIG.backendBaseUrl}/api/sensors/village/${villageId}`,
        headers: authHeader,
      },
    };
  }
  return {
    key: "sensor-write",
    req: {
      url: `${CONFIG.backendBaseUrl}/api/sensor-readings/${sensorId}`,
      method: "POST",
      headers: authHeader,
      body: {
        ts: new Date().toISOString(),
        value: 15 + Math.random() * 20,
      },
    },
  };
}

async function runSoak() {
  const stopAt = Date.now() + CONFIG.durationSec * 1000;

  const totalLatencies = [];
  const perRoute = new Map();
  const perMinute = new Map();
  const statusCounts = new Map();

  let total = 0;
  let failed = 0;
  let tooManyRequests = 0;
  let serverErrors = 0;

  function ensureRoute(routeKey) {
    if (!perRoute.has(routeKey)) {
      perRoute.set(routeKey, {
        total: 0,
        failed: 0,
        latencies: [],
        statusCounts: new Map(),
      });
    }
    return perRoute.get(routeKey);
  }

  function ensureMinute(minuteKey) {
    if (!perMinute.has(minuteKey)) {
      perMinute.set(minuteKey, {
        total: 0,
        failed: 0,
        statusCounts: new Map(),
      });
    }
    return perMinute.get(minuteKey);
  }

  async function worker() {
    while (Date.now() < stopAt) {
      const scenario = pickScenario();
      const result = await requestOnce(scenario.req);

      total += 1;
      totalLatencies.push(result.latencyMs);

      const statusKey = String(result.statusCode);
      statusCounts.set(statusKey, (statusCounts.get(statusKey) || 0) + 1);
      if (result.statusCode === 429) tooManyRequests += 1;
      if (result.statusCode >= 500) serverErrors += 1;
      if (!result.ok) failed += 1;

      const route = ensureRoute(scenario.key);
      route.total += 1;
      route.latencies.push(result.latencyMs);
      route.statusCounts.set(statusKey, (route.statusCounts.get(statusKey) || 0) + 1);
      if (!result.ok) route.failed += 1;

      const minuteKey = Math.floor((Date.now() - (stopAt - CONFIG.durationSec * 1000)) / 60000);
      const minute = ensureMinute(minuteKey);
      minute.total += 1;
      if (!result.ok) minute.failed += 1;
      minute.statusCounts.set(statusKey, (minute.statusCounts.get(statusKey) || 0) + 1);
    }
  }

  const progressTimer = setInterval(() => {
    const elapsedSec = Math.max(1, CONFIG.durationSec - Math.ceil((stopAt - Date.now()) / 1000));
    const rps = total / elapsedSec;
    const errRate = total > 0 ? (failed / total) * 100 : 0;
    const p95 = summarize(totalLatencies).p95;
    process.stdout.write(
      `[soak] elapsed=${elapsedSec}s total=${total} rps=${rps.toFixed(1)} err=${errRate.toFixed(2)}% p95=${p95.toFixed(1)}ms 429=${tooManyRequests} 5xx=${serverErrors}\n`,
    );
  }, CONFIG.reportEverySec * 1000);

  await Promise.all(Array.from({ length: CONFIG.workers }, () => worker()));
  clearInterval(progressTimer);

  const overallLatency = summarize(totalLatencies);
  const errorRate = total > 0 ? (failed / total) * 100 : 0;
  const rps = total / CONFIG.durationSec;

  const routeSummary = {};
  for (const [routeKey, value] of perRoute.entries()) {
    routeSummary[routeKey] = {
      total: value.total,
      failed: value.failed,
      errorRate: value.total > 0 ? (value.failed / value.total) * 100 : 0,
      latencyMs: summarize(value.latencies),
      statusCounts: Object.fromEntries([...value.statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
    };
  }

  const minuteSummary = [...perMinute.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, value]) => ({
      minute,
      total: value.total,
      failed: value.failed,
      errorRate: value.total > 0 ? (value.failed / value.total) * 100 : 0,
      statusCounts: Object.fromEntries([...value.statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
    }));

  return {
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    overall: {
      total,
      failed,
      errorRate,
      rps,
      tooManyRequests,
      serverErrors,
      latencyMs: overallLatency,
      statusCounts: Object.fromEntries([...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
      slo: {
        p95MsThreshold: CONFIG.sloP95Ms,
        errorRatePercentThreshold: CONFIG.sloErrorRatePercent,
        pass: overallLatency.p95 <= CONFIG.sloP95Ms && errorRate <= CONFIG.sloErrorRatePercent,
      },
    },
    routes: routeSummary,
    perMinute: minuteSummary,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Soak Test Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Overall");
  lines.push("");
  lines.push(`- Duration: ${report.config.durationSec}s`);
  lines.push(`- Workers: ${report.config.workers}`);
  lines.push(`- Total requests: ${report.overall.total}`);
  lines.push(`- Throughput: ${report.overall.rps.toFixed(1)} req/s`);
  lines.push(`- Error rate: ${report.overall.errorRate.toFixed(2)}%`);
  lines.push(`- HTTP 429: ${report.overall.tooManyRequests}`);
  lines.push(`- HTTP 5xx: ${report.overall.serverErrors}`);
  lines.push(`- Latency: p50=${report.overall.latencyMs.p50.toFixed(1)}ms, p95=${report.overall.latencyMs.p95.toFixed(1)}ms, p99=${report.overall.latencyMs.p99.toFixed(1)}ms`);
  lines.push(`- SLO pass: ${report.overall.slo.pass ? "yes" : "no"} (p95<=${report.overall.slo.p95MsThreshold}ms and error<=${report.overall.slo.errorRatePercentThreshold}%)`);
  lines.push("");

  lines.push("## Route Breakdown");
  lines.push("");
  lines.push("| Route | Requests | Error % | P50 ms | P95 ms | P99 ms | Status Codes |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");

  for (const [route, stats] of Object.entries(report.routes)) {
    const statusSummary = Object.entries(stats.statusCounts)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
    lines.push(
      `| ${route} | ${stats.total} | ${stats.errorRate.toFixed(2)} | ${stats.latencyMs.p50.toFixed(1)} | ${stats.latencyMs.p95.toFixed(1)} | ${stats.latencyMs.p99.toFixed(1)} | ${statusSummary} |`,
    );
  }

  lines.push("");
  lines.push("## Minute Timeline");
  lines.push("");
  lines.push("| Minute | Requests | Error % | Status Codes |");
  lines.push("|---:|---:|---:|---|");

  for (const minute of report.perMinute) {
    const statusSummary = Object.entries(minute.statusCounts)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
    lines.push(`| ${minute.minute} | ${minute.total} | ${minute.errorRate.toFixed(2)} | ${statusSummary} |`);
  }

  lines.push("");
  return lines.join("\n");
}

async function cleanup() {
  if (!sensorId || !authHeader) return;
  await requestOnce({
    url: `${CONFIG.backendBaseUrl}/api/sensors/${sensorId}`,
    method: "DELETE",
    headers: authHeader,
  });
}

async function main() {
  console.log("Bootstrapping soak test context...");
  await bootstrap();

  console.log(`Starting soak test: duration=${CONFIG.durationSec}s workers=${CONFIG.workers}`);
  const report = await runSoak();

  await cleanup();

  const reportsDir = path.join(__dirname, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const jsonPath = path.join(reportsDir, `soak-mixed-${stamp}.json`);
  const mdPath = path.join(reportsDir, `soak-mixed-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, renderMarkdown(report), "utf8");

  console.log(`Soak JSON report: ${jsonPath}`);
  console.log(`Soak Markdown report: ${mdPath}`);

  if (!report.overall.slo.pass) {
    process.exitCode = 2;
  }
}

main().catch(async (error) => {
  console.error("Soak test failed:", error);
  try {
    await cleanup();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
