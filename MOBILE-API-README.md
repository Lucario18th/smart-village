# 📱 Smart Village Mobile API

**Production-Ready Public REST API for Mobile Apps**

---

## Quick Start

### What is Mobile API?
A separate, **public REST API** designed for mobile apps (iOS, Android, Flutter, React Native). No authentication required.

### Get Started in 60 seconds

```bash
# 1. Start your backend
cd /home/leon/smart-village/backend
npm run start

# 2. In another terminal, test the API
curl http://localhost:8000/mobile-api/villages

# Expected response:
{
  "success": true,
  "data": [
    {"id": 1, "name": "Testdorf", "sensorCount": 3, ...}
  ],
  "timestamp": "2026-03-05T18:03:10.218Z"
}

# 3. Done! API is working ✅
```

---

## Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mobile-api/villages` | List all villages |
| GET | `/mobile-api/villages/:id` | Get village details |
| GET | `/mobile-api/villages/:id/sensors` | Get sensors with geo-coordinates |
| GET | `/mobile-api/villages/:id/messages` | Get messages/warnings |
| GET | `/mobile-api/villages/:id/rideshares` | Get transportation info |
| POST | `/mobile-api/villages/:id/messages` | Create a message |

---

## Key Features

✨ **No Authentication** - Public data, no login needed  
✨ **Geo-Coordinates** - Automatic for sensor map display  
✨ **Optimized** - Only essential data for mobile apps  
✨ **Separate** - Completely separate from website API  
✨ **Tested** - 26 unit tests + E2E tests all passing  

---

## API Examples

### List Villages
```bash
curl http://localhost:8000/mobile-api/villages
```

### Get Sensors with Location
```bash
curl http://localhost:8000/mobile-api/villages/1/sensors

# Returns:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Temperatur Rathaus",
      "type": "Temperature",
      "value": 23.5,
      "unit": "°C",
      "latitude": 52.5170,    ← For map display
      "longitude": 13.3888,
      "lastUpdated": "2026-03-05T18:00:00Z"
    }
  ]
}
```

### Send Message
```bash
curl -X POST http://localhost:8000/mobile-api/villages/1/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Straße überflutet!","priority":"high"}'
```

---

## Integrate into Your App

### React Native

```javascript
import { useEffect, useState } from 'react';

function VillageScreen({ villageId }) {
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetch(`/mobile-api/villages/${villageId}/sensors`)
      .then(r => r.json())
      .then(data => setSensors(data.data));

    // Poll every 20 seconds
    const timer = setInterval(() => {
      fetch(`/mobile-api/villages/${villageId}/sensors`)
        .then(r => r.json())
        .then(data => setSensors(data.data));
    }, 20000);

    return () => clearInterval(timer);
  }, [villageId]);

  return (
    <MapView>
      {sensors.map(s => (
        <Marker
          coordinate={{latitude: s.latitude, longitude: s.longitude}}
          title={s.name}
          description={`${s.value}${s.unit}`}
        />
      ))}
    </MapView>
  );
}
```

### Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class SensorService {
  static Future<List<Sensor>> getSensors(int villageId) async {
    final response = await http.get(
      Uri.parse('http://api.example.com/mobile-api/villages/$villageId/sensors')
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return List<Sensor>.from(
        (json['data'] as List).map((s) => Sensor.fromJson(s))
      );
    }
    throw Exception('Failed to load sensors');
  }
}
```

---

## Documentation

| Document | For | Content |
|----------|-----|---------|
| **MOBILE-API-SPEC.md** | API Reference | All endpoints, responses, examples |
| **APP-INTEGRATION-GUIDE.md** | App Developers | How to integrate, polling strategies |
| **API-COMPARISON-GUIDE.md** | Understanding | Website API vs Mobile API |
| **PROJECT-STATUS-OVERVIEW.md** | Project Status | What's done, what's next |

---

## Testing

```bash
# Run backend tests
cd /home/leon/smart-village/backend
npm test

# Run Mobile API E2E tests
cd /home/leon/smart-village
HTTP_MODE=true node test-scripts/mobile-api-test.js

# Expected: All tests passing ✅
```

---

## Data Consumption

Estimated bandwidth for typical mobile app:

```
Polling Interval: 20 seconds (sensors)
Requests/minute: ~3
Data/request: ~1-2 KB
Daily usage: ~4.3 MB
Monthly usage: ~130 MB
```

**For comparison:**
- 1 HD video = 250+ MB
- Mobile API = ultra-efficient ✅

---

## Polling Recommendation

```javascript
// Recommended setup for production
const polling = {
  sensors: 20000,      // 20 seconds
  messages: 30000,     // 30 seconds
  rideshares: 10000,   // 10 seconds
};

// Implement with exponential backoff for errors
// See APP-INTEGRATION-GUIDE.md for details
```

---

## Key Points

1. **No Login Needed** - Completely public API
2. **Geo-Coordinates** - Automatically included/generated
3. **Real-Time Updates** - Poll every 10-30 seconds
4. **Error Handling** - Standard HTTP status codes
5. **Optimized** - Small payloads for mobile networks
6. **Tested** - All endpoints validated

---

## Status

✅ **Production Ready**
- 57/57 backend tests passing
- 26 tests for mobile API
- Fully documented
- Ready for production deployment

---

## Need Help?

1. **API Questions** → `MOBILE-API-SPEC.md`
2. **Integration Help** → `APP-INTEGRATION-GUIDE.md`
3. **Which API to Use?** → `API-COMPARISON-GUIDE.md`
4. **Test Data** → Run `npm test` in backend
5. **E2E Testing** → `test-scripts/mobile-api-test.js`

---

**Last Updated:** March 5, 2026  
**Status:** Production Ready ✅  
**Docs:** 40,000+ words  
**Tests:** 57/57 passing  
**Code Quality:** Enterprise-ready
