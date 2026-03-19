#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.HTTP_MODE
  ? 'http://localhost:8000'
  : 'https://localhost';
const API_PREFIX = '/api/mobile-api';

const useHttp = process.env.HTTP_MODE === 'true';
const client = useHttp ? http : https;

// Utilities
const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(useHttp ? {} : { rejectUnauthorized: false }),
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Test utilities
let testCount = 0;
let passedCount = 0;

const test = (name, condition, details = '') => {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
};

const separator = () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Main test suite
const runTests = async () => {
  console.log('🚀 Smart Village Mobile API E2E Test Suite\n');

  let villageId = null;
  let sensorData = null;
  let messageData = null;
  let rideshareData = null;

  try {
    // Test 1: Get Villages List
    console.log('Test 1: Get Villages List');
    const villagesRes = await makeRequest('GET', `${API_PREFIX}/villages`);
    test(
      'Get villages endpoint returns 200',
      villagesRes.status === 200,
      `Got: ${villagesRes.status}`
    );
    test(
      'Response has success flag',
      villagesRes.body?.success === true,
      `Got: ${villagesRes.body?.success}`
    );
    test(
      'Response contains data array',
      Array.isArray(villagesRes.body?.data),
      `Got: ${typeof villagesRes.body?.data}`
    );

    if (villagesRes.body?.data?.length > 0) {
      villageId = villagesRes.body.data[0].id;
      console.log(`ℹ️    Found village ID: ${villageId}`);
      test('Villages list contains id', !!villageId);
      test(
        'Village has name',
        !!villagesRes.body.data[0].name,
        `Name: ${villagesRes.body.data[0].name}`
      );
      test(
        'Village has sensorCount',
        typeof villagesRes.body.data[0].sensorCount === 'number'
      );
    }
    separator();

    if (!villageId) {
      console.log('⚠️    No villages found, skipping detailed tests');
      return;
    }

    // Test 2: Get Village Detail
    console.log('Test 2: Get Village Detail');
    const villageRes = await makeRequest('GET', `${API_PREFIX}/villages/${villageId}`);
    test('Get village detail returns 200', villageRes.status === 200);
    test('Village detail has id', villageRes.body?.data?.id === villageId);
    test('Village detail has name', !!villageRes.body?.data?.name);
    test('Village detail has sensorCount', typeof villageRes.body?.data?.sensorCount === 'number');
    separator();

    // Test 3: Get Sensors
    console.log('Test 3: Get Sensors');
    const sensorsRes = await makeRequest('GET', `${API_PREFIX}/villages/${villageId}/sensors`);
    test('Get sensors returns 200', sensorsRes.status === 200);
    test('Sensors response has success', sensorsRes.body?.success === true);
    test('Sensors is array', Array.isArray(sensorsRes.body?.data));
    test('Sensors have timestamp', !!sensorsRes.body?.timestamp);

    if (sensorsRes.body?.data?.length > 0) {
      sensorData = sensorsRes.body.data[0];
      console.log(`ℹ️    Found ${sensorsRes.body.data.length} sensor(s)`);
      console.log(`ℹ️    First sensor: ${sensorData.name} (Type: ${sensorData.type})`);
      test('Sensor has id', !!sensorData.id);
      test('Sensor has name', !!sensorData.name);
      test('Sensor has type', !!sensorData.type);
      test('Sensor has value', sensorData.value !== undefined);
      test('Sensor has unit', !!sensorData.unit);
      test('Sensor has latitude (geo)', typeof sensorData.latitude === 'number');
      test('Sensor has longitude (geo)', typeof sensorData.longitude === 'number');
      test('Sensor has lastUpdated', !!sensorData.lastUpdated);
      console.log(`ℹ️    Sensor location: (${sensorData.latitude.toFixed(4)}, ${sensorData.longitude.toFixed(4)})`);
    } else {
      console.log('ℹ️    No sensors available');
    }
    separator();

    // Test 4: Get Messages
    console.log('Test 4: Get Messages');
    const messagesRes = await makeRequest('GET', `${API_PREFIX}/villages/${villageId}/messages`);
    test('Get messages returns 200', messagesRes.status === 200);
    test('Messages response has success', messagesRes.body?.success === true);
    test('Messages is array', Array.isArray(messagesRes.body?.data));

    if (messagesRes.body?.data?.length > 0) {
      messageData = messagesRes.body.data[0];
      console.log(`ℹ️    Found ${messagesRes.body.data.length} message(s)`);
      test('Message has id', !!messageData.id);
      test('Message has text', !!messageData.text);
      test('Message has priority', !!messageData.priority);
      test('Message has timestamp', !!messageData.timestamp);
      console.log(`ℹ️    First message: "${messageData.text.substring(0, 50)}..."`);
    } else {
      console.log('ℹ️    No messages available');
    }
    separator();

    // Test 5: Get RideShares
    console.log('Test 5: Get RideShares');
    const ridesharesRes = await makeRequest('GET', `${API_PREFIX}/villages/${villageId}/rideshares`);
    test('Get rideshares returns 200', ridesharesRes.status === 200);
    test('Rideshares response has success', ridesharesRes.body?.success === true);
    test('Rideshares is array', Array.isArray(ridesharesRes.body?.data));

    if (ridesharesRes.body?.data?.length > 0) {
      rideshareData = ridesharesRes.body.data[0];
      console.log(`ℹ️    Found ${ridesharesRes.body.data.length} rideshare(s)`);
      test('RideShare has id', !!rideshareData.id);
      test('RideShare has name', !!rideshareData.name);
      test('RideShare has personCount', typeof rideshareData.personCount === 'number');
      test('RideShare has status', !!rideshareData.status);
      test('RideShare has latitude', typeof rideshareData.latitude === 'number');
      test('RideShare has longitude', typeof rideshareData.longitude === 'number');
      console.log(`ℹ️    First rideshare: "${rideshareData.name}" (${rideshareData.personCount} person(s))`);
    } else {
      console.log('ℹ️    No rideshares available');
    }
    separator();

    // Test 6: Create Message
    console.log('Test 6: Create Message');
    const createMessageRes = await makeRequest(
      'POST',
      `${API_PREFIX}/villages/${villageId}/messages`,
      {
        text: 'Test message from mobile API',
        priority: 'normal',
      }
    );
    test('Create message returns 201', createMessageRes.status === 201);
    test('Created message has success', createMessageRes.body?.success === true);
    test('Created message has id', !!createMessageRes.body?.data?.id);
    console.log(`ℹ️    Message created with ID: ${createMessageRes.body?.data?.id}`);
    separator();

    // Test 7: Verify message was created
    if (createMessageRes.status === 201) {
      console.log('Test 7: Verify Message Creation');
      const verifyRes = await makeRequest('GET', `${API_PREFIX}/villages/${villageId}/messages`);
      const createdMessage = verifyRes.body?.data?.find(
        (m) => m.text === 'Test message from mobile API'
      );
      test('Message appears in list', !!createdMessage);
      if (createdMessage) {
        console.log(`ℹ️    Message verified in list`);
      }
      separator();
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  }

  // Summary
  console.log('📊 Test Summary\n');
  console.log(`Total: ${testCount} tests`);
  console.log(`Passed: ${passedCount} ✅`);
  console.log(`Failed: ${testCount - passedCount} ❌`);
  console.log(`\nResult: ${passedCount === testCount ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  process.exit(passedCount === testCount ? 0 : 1);
};

// Run tests
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
