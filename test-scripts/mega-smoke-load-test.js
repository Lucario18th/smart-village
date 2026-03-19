#!/usr/bin/env node

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const VALID_USER_EMAIL = process.env.TEST_USER_EMAIL || "freiburg@smart-village.local";
const VALID_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "test1234";

const CONFIG = {
  nginxBaseUrl: process.env.NGINX_BASE_URL || "https://localhost",
  backendBaseUrl: process.env.BACKEND_BASE_URL || "http://localhost:8000",
  readDurationSec: Number(process.env.READ_DURATION_SEC || 12),
  writeDurationSec: Number(process.env.WRITE_DURATION_SEC || 12),
  loginDurationSec: Number(process.env.LOGIN_DURATION_SEC || 10),
  readConcurrency: (process.env.READ_CONCURRENCY || "10,30,60,100,150")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v > 0),
  writeConcurrency: (process.env.WRITE_CONCURRENCY || "5,15,30,50")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v > 0),
  loginConcurrency: (process.env.LOGIN_CONCURRENCY || "10,30,60,100")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v > 0),
  p95DegradedMs: Number(process.env.P95_DEGRADED_MS || 1000),
  errorRateDegradedPercent: Number(process.env.ERROR_RATE_DEGRADED_PERCENT || 1),
};

const tlsAgent = new https.Agent({ rejectUnauthorized: false });

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
  return sortedValues[index];
}

function summarizeLatencies(latenciesMs) {
  if (latenciesMs.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const total = latenciesMs.reduce((acc, v) => acc + v, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: total / latenciesMs.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function requestOnce({ url, method = "GET", headers = {}, body = null, timeoutMs = 10000 }) {
  return new Promise((resolve) => {
    const startedAt = process.hrtime.bigint();
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const requestHeaders = { ...headers };
    const payload = body ? Buffer.from(typeof body === "string" ? body : JSON.stringify(body)) : null;
    if (payload) {
      requestHeaders["Content-Length"] = payload.byteLength;
      if (!requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }
    }

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
        res.on("data", () => {});
        res.on("end", () => {
          const endedAt = process.hrtime.bigint();
          const latencyMs = Number(endedAt - startedAt) / 1_000_000;
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode, latencyMs });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", () => {
      const endedAt = process.hrtime.bigint();
      const latencyMs = Number(endedAt - startedAt) / 1_000_000;
      resolve({ ok: false, statusCode: 0, latencyMs });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function loginAndPrepareSensor() {
  const loginUrl = `${CONFIG.backendBaseUrl}/api/auth/login`;
  const loginRes = await requestOnce({
    url: loginUrl,
    method: "POST",
    body: { email: VALID_USER_EMAIL, password: VALID_USER_PASSWORD },
  });

  if (!loginRes.ok) {
    throw new Error(`Seed login failed with status ${loginRes.statusCode}`);
  }

  const me = await requestJson({
    url: `${CONFIG.backendBaseUrl}/api/auth/me`,
    method: "GET",
    headers: await getAuthHeader(),
  });

  if (!me?.villages?.length) {
    throw new Error("Authenticated account has no village for write tests");
  }

  const villageId = me.villages[0].id;
  const created = await requestJson({
    url: `${CONFIG.backendBaseUrl}/api/sensors/village/${villageId}`,
    method: "POST",
    headers: await getAuthHeader(),
    body: {
      sensorTypeId: 1,
      name: `Load Sensor ${Date.now()}`,
      infoText: "Temporary sensor for load testing",
    },
  });

  if (!created?.id) {
    throw new Error("Failed to create temporary sensor for write test");
  }

  return { villageId, sensorId: created.id };
}

let cachedAuthHeader = null;
async function getAuthHeader() {
  if (cachedAuthHeader) return cachedAuthHeader;

  const parsed = new URL(`${CONFIG.backendBaseUrl}/api/auth/login`);
  const client = parsed.protocol === "https:" ? https : http;
  const payload = JSON.stringify({ email: VALID_USER_EMAIL, password: VALID_USER_PASSWORD });

  const data = await new Promise((resolve, reject) => {
    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        agent: parsed.protocol === "https:" ? tlsAgent : undefined,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, json: body ? JSON.parse(body) : {} });
          } catch {
            resolve({ statusCode: res.statusCode, json: {} });
          }
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });

  if (!data?.json?.accessToken) {
    throw new Error(`Unable to obtain auth token (status ${data?.statusCode ?? "unknown"})`);
  }

  cachedAuthHeader = {
    Authorization: `Bearer ${data.json.accessToken}`,
  };
  return cachedAuthHeader;
}

async function requestJson({ url, method = "GET", headers = {}, body = null }) {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const client = isHttps ? https : http;

  const requestHeaders = { ...headers };
  const payload = body ? Buffer.from(typeof body === "string" ? body : JSON.stringify(body)) : null;
  if (payload) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
    requestHeaders["Content-Length"] = payload.byteLength;
  }

  return new Promise((resolve, reject) => {
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
          try {
            const parsedJson = raw ? JSON.parse(raw) : {};
            if (res.statusCode >= 200 && res.statusCode < 400) {
              resolve(parsedJson);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
            }
          } catch {
            reject(new Error(`Non-JSON response with status ${res.statusCode}`));
          }
        });
      },
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runStage({ scenarioName, stageName, requestFactory, concurrency, durationSec }) {
  const deadline = Date.now() + durationSec * 1000;
  const latencies = [];
  const statusCounts = new Map();
  let totalRequests = 0;
  let failedRequests = 0;

  async function worker() {
    while (Date.now() < deadline) {
      const request = await requestFactory();
      const result = await requestOnce(request);
      totalRequests += 1;
      latencies.push(result.latencyMs);
      const key = String(result.statusCode);
      statusCounts.set(key, (statusCounts.get(key) || 0) + 1);
      if (!result.ok) {
        failedRequests += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const latencyStats = summarizeLatencies(latencies);
  const elapsedSec = durationSec;
  const rps = elapsedSec > 0 ? totalRequests / elapsedSec : 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  return {
    scenarioName,
    stageName,
    concurrency,
    durationSec,
    totalRequests,
    failedRequests,
    errorRate,
    rps,
    latencyMs: latencyStats,
    statusCounts: Object.fromEntries([...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
    degraded:
      errorRate >= CONFIG.errorRateDegradedPercent || latencyStats.p95 >= CONFIG.p95DegradedMs,
  };
}

function findBreakpoint(results) {
  const degraded = results.find((r) => r.degraded);
  if (!degraded) {
    return {
      found: false,
      message: "No degradation breakpoint reached in tested concurrency range.",
    };
  }

  return {
    found: true,
    atConcurrency: degraded.concurrency,
    reason: `p95=${degraded.latencyMs.p95.toFixed(1)}ms, errorRate=${degraded.errorRate.toFixed(2)}%`,
  };
}

function printStage(stage) {
  const statusSummary = Object.entries(stage.statusCounts)
    .map(([code, count]) => `${code}:${count}`)
    .join(", ");

  console.log(
    [
      `[${stage.scenarioName}] ${stage.stageName}`,
      `c=${stage.concurrency}`,
      `rps=${stage.rps.toFixed(1)}`,
      `err=${stage.errorRate.toFixed(2)}%`,
      `p50=${stage.latencyMs.p50.toFixed(1)}ms`,
      `p95=${stage.latencyMs.p95.toFixed(1)}ms`,
      `p99=${stage.latencyMs.p99.toFixed(1)}ms`,
      `status={${statusSummary}}`,
      stage.degraded ? "DEGRADED" : "OK",
    ].join(" | "),
  );
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# Mega Smoke/Load Report");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Thresholds");
  lines.push("");
  lines.push(`- Degraded if error rate >= ${CONFIG.errorRateDegradedPercent}%`);
  lines.push(`- Degraded if p95 latency >= ${CONFIG.p95DegradedMs}ms`);
  lines.push("");

  for (const scenario of report.scenarios) {
    lines.push(`## ${scenario.name}`);
    lines.push("");
    lines.push("| Stage | Concurrency | RPS | Error % | P50 ms | P95 ms | P99 ms | Status Codes | Degraded |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|---|---|");

    for (const stage of scenario.results) {
      const statusSummary = Object.entries(stage.statusCounts)
        .map(([code, count]) => `${code}:${count}`)
        .join(", ");
      lines.push(
        `| ${stage.stageName} | ${stage.concurrency} | ${stage.rps.toFixed(1)} | ${stage.errorRate.toFixed(2)} | ${stage.latencyMs.p50.toFixed(1)} | ${stage.latencyMs.p95.toFixed(1)} | ${stage.latencyMs.p99.toFixed(1)} | ${statusSummary} | ${stage.degraded ? "yes" : "no"} |`,
      );
    }

    lines.push("");
    if (scenario.breakpoint.found) {
      lines.push(`Breakpoint at concurrency ${scenario.breakpoint.atConcurrency} (${scenario.breakpoint.reason}).`);
    } else {
      lines.push(scenario.breakpoint.message);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function run() {
  console.log("Starting mega smoke/load test...");
  console.log(`Nginx base: ${CONFIG.nginxBaseUrl}`);
  console.log(`Backend base: ${CONFIG.backendBaseUrl}`);

  const { sensorId } = await loginAndPrepareSensor();
  const authHeaders = await getAuthHeader();

  const scenarios = [
    {
      name: "Read: Health endpoint through Nginx",
      durationSec: CONFIG.readDurationSec,
      concurrencyLevels: CONFIG.readConcurrency,
      requestFactory: async () => ({
        url: `${CONFIG.nginxBaseUrl}/api/health`,
        method: "GET",
      }),
    },
    {
      name: "Read: App villages through Nginx",
      durationSec: CONFIG.readDurationSec,
      concurrencyLevels: CONFIG.readConcurrency,
      requestFactory: async () => ({
        url: `${CONFIG.nginxBaseUrl}/api/app/villages`,
        method: "GET",
      }),
    },
    {
      name: "Auth flood simulation: Login through Nginx",
      durationSec: CONFIG.loginDurationSec,
      concurrencyLevels: CONFIG.loginConcurrency,
      requestFactory: async () => ({
        url: `${CONFIG.nginxBaseUrl}/api/auth/login`,
        method: "POST",
        body: { email: VALID_USER_EMAIL, password: VALID_USER_PASSWORD },
      }),
    },
    {
      name: "DB write path: Sensor readings",
      durationSec: CONFIG.writeDurationSec,
      concurrencyLevels: CONFIG.writeConcurrency,
      requestFactory: async () => ({
        url: `${CONFIG.backendBaseUrl}/api/sensor-readings/${sensorId}`,
        method: "POST",
        headers: authHeaders,
        body: { ts: new Date().toISOString(), value: 20 + Math.random() * 10 },
      }),
    },
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    scenarios: [],
  };

  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.name} ===`);
    const scenarioResults = [];

    for (const concurrency of scenario.concurrencyLevels) {
      const stageName = `load-c${concurrency}`;
      const stageResult = await runStage({
        scenarioName: scenario.name,
        stageName,
        requestFactory: scenario.requestFactory,
        concurrency,
        durationSec: scenario.durationSec,
      });
      scenarioResults.push(stageResult);
      printStage(stageResult);
    }

    report.scenarios.push({
      name: scenario.name,
      results: scenarioResults,
      breakpoint: findBreakpoint(scenarioResults),
    });
  }

  try {
    await requestJson({
      url: `${CONFIG.backendBaseUrl}/api/sensors/${sensorId}`,
      method: "DELETE",
      headers: authHeaders,
    });
  } catch (error) {
    console.warn(`Cleanup warning (sensor ${sensorId}): ${error.message}`);
  }

  const reportsDir = path.join(__dirname, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(reportsDir, `mega-smoke-load-${stamp}.json`);
  const mdPath = path.join(reportsDir, `mega-smoke-load-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, toMarkdown(report), "utf8");

  console.log("\nLoad test finished.");
  console.log(`JSON report: ${jsonPath}`);
  console.log(`Markdown report: ${mdPath}`);
}

run().catch((error) => {
  console.error("Mega smoke/load test failed:", error);
  process.exit(1);
});
