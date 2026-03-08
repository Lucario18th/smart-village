# Smart Village Mobile App - Auto-Pulling Guide

**Für:** Mobile App-Entwickler (React Native, Flutter, iOS Native, Android Native)  
**Zweck:** Strategie für regelmäßiges Abrufen von Dorf-Daten ohne Benutzer-Aktion

---

## Überblick

Die Mobile App sollte regelmäßig Daten von der Mobile API abrufen, um Sensoren, Nachrichten und Mitfahrbänke aktuell zu halten.

**Drei Optionen:**
1. ✅ **Polling** (empfohlen) - Einfach, zuverlässig, offline-tolerant
2. 🚀 **WebSocket** (Zukunft) - Echtzeit, geringerer Overhead
3. 📡 **Server-Sent Events (SSE)** (Zukunft) - Streaming, Push-ready

Dieses Guide konzentriert sich auf **Polling** als Production-Ready Lösung.

---

## 1. Polling-Ansatz (Recommended)

### Konzept
Die App fragt die API regelmäßig ab (z.B. alle 15 Sekunden) und aktualisiert den lokalen State mit neuen Daten.

```
App Start
    ↓
Set Timer (15s interval)
    ↓
Fetch /mobile-api/villages/:id/sensors
Fetch /mobile-api/villages/:id/messages
Fetch /mobile-api/villages/:id/rideshares
    ↓
Parse JSON
    ↓
Update Local State / UI
    ↓
Wait 15 seconds
    ↓
(Repeat)
```

### Vorteile
- ✅ Einfach zu implementieren
- ✅ Funktioniert offline (mit lokalen Fallback-Daten)
- ✅ Kein zusätzlicher Server-Code nötig
- ✅ Browser & Native App kompatibel
- ✅ Großartig für Batteries/Datenverbrauch-Optimierung

### Nachteile
- ⚠️ Latenz bis zu 15s (abhängig vom Interval)
- ⚠️ Unnötige Requests wenn keine Daten sich geändert haben
- ⚠️ Server-Last bei vielen Clients

### Empfohlene Intervalle

| Datentyp | Interval | Begründung |
|----------|----------|-----------|
| **Sensoren** | 10-30s | Messwerte ändern langsam |
| **Nachrichten** | 15-60s | Wichtig aber nicht zeitkritisch |
| **Mitfahrbänke** | 5-10s | Häufige Updates (Personenanzahl) |
| **Dorf-Info** | 5 Min | Selten geändert |

---

## 2. React Native Implementierung

### Mit Hooks (Recommended)

```javascript
import { useEffect, useState, useRef } from 'react';

function VillageScreen({ villageId }) {
  const [sensors, setSensors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [rideshares, setRideshares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const sensorIntervalRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const rideshareIntervalRef = useRef(null);

  // Fetch sensors
  const fetchSensors = async () => {
    try {
      const response = await fetch(
        `http://api.example.com/mobile-api/villages/${villageId}/sensors`
      );
      const json = await response.json();
      if (json.success) {
        setSensors(json.data);
      }
    } catch (err) {
      console.error('Sensor fetch error:', err);
      setError(err.message);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://api.example.com/mobile-api/villages/${villageId}/messages`
      );
      const json = await response.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Message fetch error:', err);
    }
  };

  // Fetch rideshares
  const fetchRideshares = async () => {
    try {
      const response = await fetch(
        `http://api.example.com/mobile-api/villages/${villageId}/rideshares`
      );
      const json = await response.json();
      if (json.success) {
        setRideshares(json.data);
      }
    } catch (err) {
      console.error('Rideshare fetch error:', err);
    }
  };

  // Setup polling on component mount
  useEffect(() => {
    setLoading(true);
    
    // Initial fetch
    fetchSensors();
    fetchMessages();
    fetchRideshares();
    
    setLoading(false);

    // Setup intervals
    sensorIntervalRef.current = setInterval(fetchSensors, 20000); // 20s
    messageIntervalRef.current = setInterval(fetchMessages, 30000); // 30s
    rideshareIntervalRef.current = setInterval(fetchRideshares, 10000); // 10s

    // Cleanup on unmount
    return () => {
      clearInterval(sensorIntervalRef.current);
      clearInterval(messageIntervalRef.current);
      clearInterval(rideshareIntervalRef.current);
    };
  }, [villageId]);

  return (
    <ScrollView>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      {/* Sensors Section */}
      <SectionList title="Sensoren">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </SectionList>

      {/* Messages Section */}
      <SectionList title="Nachrichten">
        {messages.map(msg => (
          <MessageCard key={msg.id} message={msg} />
        ))}
      </SectionList>

      {/* Rideshares Section */}
      <SectionList title="Mitfahrbänke">
        {rideshares.map(rs => (
          <RideShareCard key={rs.id} rideshare={rs} />
        ))}
      </SectionList>
    </ScrollView>
  );
}

export default VillageScreen;
```

### Mit Context API (für App-State)

```javascript
import { createContext, useContext, useEffect, useRef } from 'react';

const VillageContext = createContext();

export function VillageProvider({ villageId, children }) {
  const [data, setData] = useState({
    sensors: [],
    messages: [],
    rideshares: [],
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Unified fetch (alle 3 Endpoints parallel)
  const syncData = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      const [sensorsRes, messagesRes, ridesharesRes] = await Promise.all([
        fetch(`/mobile-api/villages/${villageId}/sensors`),
        fetch(`/mobile-api/villages/${villageId}/messages`),
        fetch(`/mobile-api/villages/${villageId}/rideshares`),
      ]);

      const [sensorsJson, messagesJson, ridesharesJson] = await Promise.all([
        sensorsRes.json(),
        messagesRes.json(),
        ridesharesRes.json(),
      ]);

      setData({
        sensors: sensorsJson.data || [],
        messages: messagesJson.data || [],
        rideshares: ridesharesJson.data || [],
      });
      
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Setup polling
  useEffect(() => {
    // Initial sync
    syncData();

    // Poll every 15 seconds
    const interval = setInterval(syncData, 15000);

    return () => clearInterval(interval);
  }, [villageId]);

  return (
    <VillageContext.Provider value={{ data, syncing, lastSync, syncData }}>
      {children}
    </VillageContext.Provider>
  );
}

export function useVillageData() {
  return useContext(VillageContext);
}
```

---

## 3. Flutter Implementierung

```dart
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

class VillageService {
  static const String baseUrl = 'http://api.example.com/mobile-api';
  final int villageId;
  
  Timer? _sensorTimer;
  Timer? _messageTimer;
  Timer? _rideshareTimer;

  final _sensorsController = StreamController<List<Sensor>>.broadcast();
  final _messagesController = StreamController<List<Message>>.broadcast();
  final _ridesharesController = StreamController<List<RideShare>>.broadcast();

  Stream<List<Sensor>> get sensorsStream => _sensorsController.stream;
  Stream<List<Message>> get messagesStream => _messagesController.stream;
  Stream<List<RideShare>> get ridesharesStream => _ridesharesController.stream;

  VillageService(this.villageId);

  void startPolling() {
    // Sensor polling (20s)
    _sensorTimer = Timer.periodic(Duration(seconds: 20), (_) {
      _fetchSensors();
    });

    // Message polling (30s)
    _messageTimer = Timer.periodic(Duration(seconds: 30), (_) {
      _fetchMessages();
    });

    // Rideshare polling (10s)
    _rideshareTimer = Timer.periodic(Duration(seconds: 10), (_) {
      _fetchRideshares();
    });

    // Initial fetch
    _fetchSensors();
    _fetchMessages();
    _fetchRideshares();
  }

  Future<void> _fetchSensors() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/villages/$villageId/sensors'),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final sensors = List<Sensor>.from(
          (json['data'] as List).map((s) => Sensor.fromJson(s))
        );
        _sensorsController.sink.add(sensors);
      }
    } catch (e) {
      print('Error fetching sensors: $e');
    }
  }

  Future<void> _fetchMessages() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/villages/$villageId/messages'),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final messages = List<Message>.from(
          (json['data'] as List).map((m) => Message.fromJson(m))
        );
        _messagesController.sink.add(messages);
      }
    } catch (e) {
      print('Error fetching messages: $e');
    }
  }

  Future<void> _fetchRideshares() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/villages/$villageId/rideshares'),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final rideshares = List<RideShare>.from(
          (json['data'] as List).map((r) => RideShare.fromJson(r))
        );
        _ridesharesController.sink.add(rideshares);
      }
    } catch (e) {
      print('Error fetching rideshares: $e');
    }
  }

  void stopPolling() {
    _sensorTimer?.cancel();
    _messageTimer?.cancel();
    _rideshareTimer?.cancel();
  }

  void dispose() {
    stopPolling();
    _sensorsController.close();
    _messagesController.close();
    _ridesharesController.close();
  }
}

// Usage in Widget
class VillageScreen extends StatefulWidget {
  final int villageId;

  const VillageScreen({required this.villageId});

  @override
  State<VillageScreen> createState() => _VillageScreenState();
}

class _VillageScreenState extends State<VillageScreen> {
  late VillageService _service;

  @override
  void initState() {
    super.initState();
    _service = VillageService(widget.villageId);
    _service.startPolling();
  }

  @override
  void dispose() {
    _service.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        // Sensors
        StreamBuilder<List<Sensor>>(
          stream: _service.sensorsStream,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return SizedBox();
            return SensorsList(sensors: snapshot.data!);
          },
        ),

        // Messages
        StreamBuilder<List<Message>>(
          stream: _service.messagesStream,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return SizedBox();
            return MessagesList(messages: snapshot.data!);
          },
        ),

        // Rideshares
        StreamBuilder<List<RideShare>>(
          stream: _service.ridesharesStream,
          builder: (context, snapshot) {
            if (!snapshot.hasData) return SizedBox();
            return RideSharesList(rideshares: snapshot.data!);
          },
        ),
      ],
    );
  }
}
```

---

## 4. Intelligentes Polling mit Exponential Backoff

**Problem:** API ist offline oder überlastet?  
**Lösung:** Erhöhe Interval bei Fehlern

```javascript
class SmartPoller {
  constructor(apiUrl, initialInterval = 15000) {
    this.apiUrl = apiUrl;
    this.interval = initialInterval;
    this.maxInterval = 300000; // 5 Minuten max
    this.multiplier = 1.5;
    this.timer = null;
  }

  async fetch() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const json = await response.json();
      if (!json.success) throw new Error('API returned success: false');

      // Success: reset interval
      this.interval = 15000;
      return json.data;
    } catch (error) {
      // Error: increase interval
      this.interval = Math.min(
        this.interval * this.multiplier,
        this.maxInterval
      );
      console.error(`Fetch failed: ${error.message}. Next attempt in ${this.interval}ms`);
      throw error;
    }
  }

  start(callback) {
    const poll = async () => {
      try {
        const data = await this.fetch();
        callback(data, null);
      } catch (error) {
        callback(null, error);
      }
      
      this.timer = setTimeout(poll, this.interval);
    };

    poll(); // Initial call
  }

  stop() {
    clearTimeout(this.timer);
  }
}

// Usage
const sensorPoller = new SmartPoller('/mobile-api/villages/1/sensors');
sensorPoller.start((data, error) => {
  if (data) {
    updateUI(data);
  } else {
    showError(error.message);
  }
});
```

---

## 5. Caching-Strategie

### Lokales Caching
```javascript
class CachedApi {
  constructor(cacheTimeMs = 5000) {
    this.cache = new Map();
    this.cacheTime = cacheTimeMs;
  }

  async fetch(url) {
    const cached = this.cache.get(url);
    
    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    // Fetch fresh data
    const response = await fetch(url);
    const json = await response.json();

    // Cache it
    this.cache.set(url, {
      data: json.data,
      timestamp: Date.now(),
    });

    return json.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage with different cache times
const api = new CachedApi();

// Short cache (sensors change frequently)
const sensors = await api.fetch('/mobile-api/villages/1/sensors', 5000);

// Longer cache (villages rarely change)
const villages = await api.fetch('/mobile-api/villages', 300000);
```

### Diff-Based Updates
```javascript
// Only update UI if data actually changed
function updateWithDiff(oldData, newData) {
  const oldIds = new Set(oldData.map(d => d.id));
  const newIds = new Set(newData.map(d => d.id));

  const added = newData.filter(d => !oldIds.has(d.id));
  const removed = oldData.filter(d => !newIds.has(d.id));
  const modified = newData.filter(d => {
    const old = oldData.find(o => o.id === d.id);
    return old && JSON.stringify(old) !== JSON.stringify(d);
  });

  if (added.length > 0) console.log('Added:', added);
  if (removed.length > 0) console.log('Removed:', removed);
  if (modified.length > 0) console.log('Modified:', modified);

  // Only update if something changed
  if (added.length + removed.length + modified.length > 0) {
    setState({ data: newData });
  }
}
```

---

## 6. Datenverbrauch Optimierung

### Bandwidth-Aware Polling
```javascript
async function checkNetworkSpeed() {
  const start = performance.now();
  const response = await fetch('http://api.example.com/ping');
  const duration = performance.now() - start;

  if (duration < 100) return 'fast'; // 4G/WiFi
  if (duration < 500) return 'medium'; // 3G
  return 'slow'; // 2G/poor connection
}

const intervals = {
  fast: 15000,     // 15 seconds
  medium: 30000,   // 30 seconds
  slow: 60000,     // 60 seconds
};

async function adaptivePolling() {
  const speed = await checkNetworkSpeed();
  const interval = intervals[speed];
  
  setPollingInterval(interval);
  console.log(`Network: ${speed} - Polling every ${interval}ms`);
}

// Check speed periodically
setInterval(adaptivePolling, 300000); // Re-check every 5 minutes
```

---

## 7. Error Recovery

```javascript
class ResilientPoller {
  constructor(fetcher, onSuccess, onError) {
    this.fetcher = fetcher;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.retries = 0;
    this.maxRetries = 3;
    this.baseInterval = 15000;
  }

  async poll() {
    try {
      const data = await this.fetcher();
      this.onSuccess(data);
      this.retries = 0; // Reset on success
      
      setTimeout(() => this.poll(), this.baseInterval);
    } catch (error) {
      this.retries++;
      
      if (this.retries >= this.maxRetries) {
        this.onError(error);
        this.retries = 0;
        // Try again after 1 minute
        setTimeout(() => this.poll(), 60000);
      } else {
        // Retry after delay
        const delay = 5000 * this.retries;
        console.log(`Retry ${this.retries}/${this.maxRetries} after ${delay}ms`);
        setTimeout(() => this.poll(), delay);
      }
    }
  }

  start() {
    this.poll();
  }
}

// Usage
const poller = new ResilientPoller(
  () => fetch('/mobile-api/villages/1/sensors').then(r => r.json()),
  (data) => updateUI(data),
  (error) => showAlert(`Connection lost: ${error.message}`)
);

poller.start();
```

---

## 8. Alternative: WebSocket (Zukunft)

**Wenn Server WebSocket Support hat:**

```javascript
class WebSocketPoller {
  constructor(villageId) {
    this.villageId = villageId;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(`wss://api.example.com/mobile-ws`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to village
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        villageId: this.villageId,
      }));
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'sensor-update':
          updateSensors(message.data);
          break;
        case 'message-new':
          addMessage(message.data);
          break;
        case 'rideshare-update':
          updateRideshares(message.data);
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.reconnect();
    };
  }

  reconnect() {
    setTimeout(() => this.connect(), 5000);
  }

  close() {
    this.ws?.close();
  }
}

// Usage
const ws = new WebSocketPoller(1);
ws.connect();
```

---

## 9. Best Practices Checklist

- ✅ **Cleanup Timers:** Lösche alle setInterval() beim Component Unmount
- ✅ **Error Handling:** Fange Fetch-Fehler ab (Netzwerk, Server)
- ✅ **Rate Limiting:** Beachte Server-Limits (z.B. max 10 req/sec)
- ✅ **Offline Support:** Cache Daten lokal für Offline-Nutzung
- ✅ **Battery:** Reduziere Polling bei Low-Battery-Mode
- ✅ **WiFi Check:** Erhöhe Intervalle bei mobile data
- ✅ **User Feedback:** Zeige "Syncing..." Indikator
- ✅ **Retry Logic:** Implementiere exponential backoff
- ✅ **Debounce:** Verhindere mehrfache API-Calls
- ✅ **Memory:** Beachte Speicher bei langen Listen

---

## 10. Debugging

```javascript
// Enable verbose logging
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[VillagePoller]', ...args);
}

// Monitor polling health
class PollingMonitor {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  recordRequest(success, duration) {
    this.stats.totalRequests++;
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    // Update moving average
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime + duration) / 2;

    log('Stats:', this.stats);
  }

  getHealth() {
    const successRate = (
      this.stats.successfulRequests / this.stats.totalRequests * 100
    ).toFixed(2);
    
    return {
      health: successRate >= 95 ? 'good' : successRate >= 80 ? 'ok' : 'poor',
      successRate: `${successRate}%`,
      ...this.stats,
    };
  }
}

const monitor = new PollingMonitor();

async function monitoredFetch(url) {
  const start = performance.now();
  try {
    const response = await fetch(url);
    const duration = performance.now() - start;
    monitor.recordRequest(response.ok, duration);
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    monitor.recordRequest(false, duration);
    throw error;
  }
}

// Check health
console.log('Polling health:', monitor.getHealth());
```

---

## Zusammenfassung

**Empfohlene Setup für Production:**

```javascript
// 1. React Native mit Context + exponential backoff
const { data, syncing } = useVillageData();

// 2. Flutter mit Streams
_service.sensorsStream.listen((sensors) => setState(() {}));

// 3. Web mit SmartPoller
const poller = new SmartPoller(url);
poller.start(updateUI);

// 4. Alle Plattformen
- Polling Interval: 10-30s
- Error Retry: Exponential backoff (5s, 10s, 20s)
- Cache: 5-10 Sekunden lokal
- Datenverbrauch: ~3-5 KB pro Minute
- Latency: Akzeptabel (~15s verzögert)
```

---

**Status:** ✅ Production Ready  
**Nächste Phase:** WebSocket Support (geplant)  
**Fragen?** Siehe MOBILE-API-SPEC.md
