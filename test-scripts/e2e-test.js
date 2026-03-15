#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.bright}${msg}${colors.reset}\n`),
};

// Configuration
const CONFIG = {
  // Use HTTP_MODE env var to switch between HTTPS and HTTP for testing
  API_URL: process.env.HTTP_MODE === 'true' ? 'http://localhost:8000' : 'https://localhost:8000',
  TEST_USER: {
    email: 'e2etest@test.de',
    password: 'test1234',
  },
};

let authToken = null;
let accountData = null;

// HTTPS Request Helper
function httpsRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.API_URL);
    const isHttps = CONFIG.API_URL.startsWith('https');
    const protocol = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Only reject unauthorized for HTTPS
    if (isHttps) {
      options.rejectUnauthorized = false;
    }

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// TEST 1: Health Check
async function testHealth() {
  log.header('Test 1: Health Check');
  try {
    const res = await httpsRequest('GET', '/api/health');
    if (res.status === 200 && res.data.status === 'ok') {
      log.success('Health check successful');
      return true;
    } else {
      log.error(`Health check failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    return false;
  }
}

// TEST 2: Login
async function testLogin() {
  log.header('Test 2: Login');
  try {
    const res = await httpsRequest('POST', '/api/auth/login', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password,
    });

    if (res.status === 200 && res.data.accessToken) {
      authToken = res.data.accessToken;
      log.success(`Login successful for ${CONFIG.TEST_USER.email}`);
      log.info(`Token: ${authToken.substring(0, 50)}...`);
      return true;
    } else {
      log.error(`Login failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Login error: ${error.message}`);
    return false;
  }
}

// TEST 3: Get Account Info
async function testGetAccount() {
  log.header('Test 3: Get Account Info');
  try {
    const res = await httpsRequest('GET', '/api/auth/me');

    if (res.status === 200) {
      accountData = res.data; // Store account data for later use
      log.success('Account info retrieved');
      log.info(`Email: ${res.data.email}`);
      log.info(`ID: ${res.data.id}`);
      return true;
    } else {
      log.error(`Get account failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Get account error: ${error.message}`);
    return false;
  }
}

// TEST 4: Get Sensors
async function testGetSensors() {
  log.header('Test 4: Get Sensors');
  try {
    if (!accountData || !accountData.villages || accountData.villages.length === 0) {
      log.error('No village data available');
      return false;
    }
    
    const villageId = accountData.villages[0].id;
    const res = await httpsRequest('GET', `/api/sensors/village/${villageId}`);

    if (res.status === 200 && Array.isArray(res.data)) {
      log.success(`Retrieved ${res.data.length} sensors`);
      res.data.slice(0, 3).forEach((sensor) => {
        log.info(`  - ${sensor.name} (ID: ${sensor.id}, Type: ${sensor.sensorTypeId})`);
      });
      return true;
    } else {
      log.error(`Get sensors failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Get sensors error: ${error.message}`);
    return false;
  }
}

// TEST 5: Create Sensor
async function testCreateSensor() {
  log.header('Test 5: Create Sensor');
  try {
    if (!accountData || !accountData.villages || accountData.villages.length === 0) {
      log.error('No village data available');
      return null;
    }
    
    const villageId = accountData.villages[0].id;
    const sensorData = {
      sensorTypeId: 1, // Temperature
      name: `Test Sensor ${Date.now()}`,
      infoText: 'Test Location',
    };

    const res = await httpsRequest('POST', `/api/sensors/village/${villageId}`, sensorData);

    if (res.status === 201 || res.status === 200) {
      log.success(`Sensor created: ${res.data.name} (ID: ${res.data.id})`);
      return res.data.id;
    } else {
      log.error(`Create sensor failed: ${res.status}`);
      return null;
    }
  } catch (error) {
    log.error(`Create sensor error: ${error.message}`);
    return null;
  }
}

// TEST 6: Send Sensor Reading
async function testSendReading(sensorId) {
  log.header('Test 6: Send Sensor Reading');
  try {
    const readingData = {
      ts: new Date().toISOString(),
      value: Math.random() * 30 + 10, // Random temp between 10-40°C
    };

    const res = await httpsRequest('POST', `/api/sensor-readings/${sensorId}`, readingData);

    if (res.status === 201 || res.status === 200) {
      log.success(`Reading sent: ${readingData.value.toFixed(2)}°C`);
      return true;
    } else {
      log.error(`Send reading failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Send reading error: ${error.message}`);
    return false;
  }
}

// TEST 7: Multiple Readings
async function testMultipleReadings(sensorId) {
  log.header('Test 7: Send Multiple Readings');
  let successCount = 0;

  for (let i = 0; i < 5; i++) {
    try {
      const readingData = {
        ts: new Date().toISOString(),
        value: Math.random() * 30 + 10,
      };

      const res = await httpsRequest('POST', `/api/sensor-readings/${sensorId}`, readingData);

      if (res.status === 201 || res.status === 200) {
        log.info(`  Reading ${i + 1}: ${readingData.value.toFixed(2)}°C`);
        successCount++;
      }
    } catch (error) {
      log.warn(`  Reading ${i + 1} failed: ${error.message}`);
    }
  }

  if (successCount === 5) {
    log.success(`All 5 readings sent successfully`);
    return true;
  } else {
    log.warn(`Only ${successCount}/5 readings successful`);
    return false;
  }
}

// TEST 8: Get Sensor Readings
async function testGetReadings(sensorId) {
  log.header('Test 8: Get Sensor Readings');
  try {
    const res = await httpsRequest('GET', `/api/sensor-readings/${sensorId}`);

    if (res.status === 200 && Array.isArray(res.data)) {
      log.success(`Retrieved ${res.data.length} readings`);
      res.data.slice(0, 3).forEach((reading) => {
        log.info(`  - Value: ${reading.value}`);
      });
      return true;
    } else {
      log.error(`Get readings failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Get readings error: ${error.message}`);
    return false;
  }
}

// TEST 9: Delete Sensor
async function testDeleteSensor(sensorId) {
  log.header('Test 9: Delete Sensor');
  try {
    const res = await httpsRequest('DELETE', `/api/sensors/${sensorId}`);

    if (res.status === 200 || res.status === 204) {
      log.success(`Sensor ${sensorId} deleted`);
      return true;
    } else {
      log.error(`Delete sensor failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Delete sensor error: ${error.message}`);
    return false;
  }
}

// Main Test Suite
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════╗
║     Smart Village E2E Test Suite                ║
║     Testing HTTPS with Self-Signed Certs       ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  log.info(`API URL: ${CONFIG.API_URL}`);
  log.info(`Test User: ${CONFIG.TEST_USER.email}`);
  log.warn(`SSL Verification: DISABLED (self-signed certs)`);

  const results = [];

  // Run tests
  results.push({ name: 'Health Check', passed: await testHealth() });
  results.push({ name: 'Login', passed: await testLogin() });

  if (!authToken) {
    log.error('Login failed, cannot continue with authenticated tests');
    printSummary(results);
    process.exit(1);
  }

  results.push({ name: 'Get Account Info', passed: await testGetAccount() });
  results.push({ name: 'Get Sensors', passed: await testGetSensors() });

  const sensorId = await testCreateSensor();
  results.push({ name: 'Create Sensor', passed: !!sensorId });

  if (sensorId) {
    results.push({ name: 'Send Single Reading', passed: await testSendReading(sensorId) });
    results.push({ name: 'Send Multiple Readings', passed: await testMultipleReadings(sensorId) });
    results.push({ name: 'Get Readings', passed: await testGetReadings(sensorId) });
    results.push({ name: 'Delete Sensor', passed: await testDeleteSensor(sensorId) });
  }

  printSummary(results);
}

function printSummary(results) {
  log.header('Test Summary');

  results.forEach((r) => {
    if (r.passed) {
      log.success(r.name);
    } else {
      log.error(r.name);
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n${colors.bright}Result: ${passed}/${total} tests passed${colors.reset}\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Run the test suite
runTests().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
