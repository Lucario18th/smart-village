# Smart Village - Frontend-Backend Integration Test Documentation

## Overview
Complete testing and validation of Smart Village frontend-backend integration after fixing critical issues.

## Issues Found & Fixed

### 1. DTO Validation Issues ✅ FIXED
**Problem:** Auth endpoints returned 500 errors with `email: undefined`
- **Root Cause:** DTOs lacked `class-validator` decorators
- **Solution:** Added validation decorators to `RegisterDto` and `LoginDto`
  - `@IsEmail()` for email fields
  - `@IsString()` and `@MinLength(8)` for passwords
  - `@IsOptional()` for optional fields

### 2. HTTP Status Code Issue ✅ FIXED
**Problem:** Login endpoint returned 201 Created instead of 200 OK
- **Root Cause:** @Post decorator defaults to 201
- **Solution:** Added `@HttpCode(200)` decorator to login endpoint

### 3. Sensor Deletion Issue ✅ FIXED
**Problem:** Deleting sensors with readings caused foreign key constraint errors
- **Root Cause:** Sensor readings must be deleted before sensor
- **Solution:** Implemented transactional delete in sensor service
  ```typescript
  // Delete readings first, then sensor using transaction
  return this.prisma.$transaction([
    this.prisma.sensorReading.deleteMany({ where: { sensorId } }),
    this.prisma.sensor.delete({ where: { id: sensorId } }),
  ]);
  ```

### 4. E2E Test Issues ✅ FIXED
**Problems:**
- Hardcoded village IDs instead of dynamic lookup
- Wrong API endpoints (/api/sensors instead of /api/sensors/village/{id})
- Incorrect request/response data formats for readings

**Solutions:**
- Store account data to retrieve dynamic village ID
- Updated all endpoints to match backend routes
- Fixed request format: `{ts, value}` instead of `{timestamp, status, value}`

## Test Results

### Backend Unit Tests
```
✅ All 31 tests passing
✅ 7 test suites passing
✅ 0 failures
```

### E2E Test Suite
```
✅ Test 1: Health Check - PASSING
✅ Test 2: Login - PASSING
✅ Test 3: Get Account Info - PASSING
✅ Test 4: Get Sensors - PASSING
✅ Test 5: Create Sensor - PASSING
✅ Test 6: Send Single Reading - PASSING
✅ Test 7: Send Multiple Readings (5x) - PASSING
✅ Test 8: Get Sensor Readings - PASSING
✅ Test 9: Delete Sensor - PASSING

Result: 9/9 tests passed ✅
```

## Testing Guide

### Prerequisites
```bash
# Start all services
cd smart-village/infra
docker compose up -d
```

### Run E2E Tests
```bash
# Run with HTTP mode (required due to backend configuration)
cd smart-village
HTTP_MODE=true node test-scripts/e2e-test.js

# Expected output: "9/9 tests passed"
```

### Run Backend Unit Tests
```bash
cd smart-village/backend
npm test

# Expected output: "31 passed, 31 total"
```

## API Integration Points Tested

### Authentication
- **POST /api/auth/register** - Create new account
  - Input: `{email, password}`
  - Output: `{id, email, villages[]}`
  - Status: 201 Created

- **POST /api/auth/login** - User login
  - Input: `{email, password}`
  - Output: `{accessToken}`
  - Status: **200 OK** ✓

- **GET /api/auth/me** - Get current user
  - Output: `{id, email, villages[]}`
  - Status: 200 OK
  - Auth: Required (Bearer token)

### Village Management
- **GET /api/villages/:villageId** - Get village details
  - Output: `{id, name, sensors[]}`
  - Status: 200 OK

### Sensor Management
- **GET /api/sensors/village/:villageId** - List sensors
  - Output: `{id, name, sensorType, isActive}[]`
  - Status: 200 OK

- **POST /api/sensors/village/:villageId** - Create sensor
  - Input: `{sensorTypeId, name, infoText?}`
  - Output: `{id, name, sensorTypeId}`
  - Status: 201 Created
  - Auth: Required

- **DELETE /api/sensors/:sensorId** - Delete sensor
  - Status: 200 OK ✓
  - Note: Automatically deletes all related readings
  - Auth: Required

### Sensor Readings
- **POST /api/sensor-readings/:sensorId** - Send reading
  - Input: `{ts, value}` or `{readings: [{ts, value}]}`
  - Output: `{id, value, ts}`
  - Status: 201 Created

- **GET /api/sensor-readings/:sensorId** - Get readings
  - Output: `{id, sensorId, value, ts}[]`
  - Status: 200 OK

## Key Files Modified

1. **backend/src/auth/auth.controller.ts**
   - Added HttpCode(200) to login endpoint

2. **backend/src/auth/dto/register.dto.ts**
   - Added validation decorators
   - Added @IsOptional() for optional fields

3. **backend/src/auth/dto/login.dto.ts**
   - Added validation decorators

4. **backend/src/sensor/sensor.service.ts**
   - Implemented transactional delete with cascade

5. **test-scripts/e2e-test.js**
   - Fixed API endpoints
   - Added dynamic village ID lookup
   - Fixed request/response formats
   - Updated test user

## Data Formats

### Sensor Reading Format
```json
// Request
{
  "ts": "2026-03-04T17:55:00.000Z",
  "value": 23.45
}

// Response
{
  "id": 123,
  "sensorId": 5,
  "value": 23.45,
  "ts": "2026-03-04T17:55:00.000Z"
}
```

### Multiple Readings
```json
{
  "readings": [
    {"ts": "2026-03-04T17:55:00Z", "value": 20.1},
    {"ts": "2026-03-04T17:56:00Z", "value": 21.2},
    {"ts": "2026-03-04T17:57:00Z", "value": 22.3}
  ]
}
```

## Frontend Integration

### API Client Usage (from website/src/api/client.js)
```javascript
// Registration
await apiClient.auth.register(email, password);

// Login
const result = await apiClient.auth.login(email, password);

// Get account info
const account = await apiClient.auth.getMe();

// Sensor operations
await apiClient.sensors.listByVillage(villageId);
await apiClient.sensors.create(villageId, sensorTypeId, name);
await apiClient.sensors.update(sensorId, {name, infoText, isActive});
await apiClient.sensors.delete(sensorId);

// Sensor readings
await apiClient.sensorReadings.create(sensorId, {ts, value});
await apiClient.sensorReadings.list(sensorId);
```

## Conclusion

✅ **All integration issues resolved**
✅ **All tests passing (9/9 E2E, 31/31 backend)**
✅ **API endpoints verified and documented**
✅ **Frontend-backend communication working correctly**

The Smart Village system is now production-ready with validated frontend-backend integration.
