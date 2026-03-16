/**
 * API Client für Backend-Kommunikation
 * Verbindet sich mit NestJS Backend über /api Endpunkte
 */

const API_BASE_URL = '/api'; // Nginx leitet /api/* zu Backend durch
const SESSION_KEY = 'smart-village-admin-session';
const TOKEN_KEY = 'access_token';

function getActiveToken() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    const parsedSession = JSON.parse(rawSession);
    const expiresAt = Date.parse(parsedSession?.idleExpiresAt || '');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    return parsedSession.token || null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export const apiClient = {
  async request(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Token aus localStorage hinzufügen falls vorhanden
    const token = getActiveToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Request-Body hinzufügen wenn nötig
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const enrichedError = new Error(error.message || `HTTP ${response.status}`);
        if (error.code) {
          enrichedError.code = error.code;
        }
        throw enrichedError;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth Endpoints
  auth: {
    register(payload) {
      return apiClient.request('POST', '/auth/register', payload);
    },
    login(email, password) {
      return apiClient.request('POST', '/auth/login', { email, password });
    },
    verifyCode(email, code) {
      return apiClient.request('POST', '/auth/verify-code', { email, code });
    },
    resendVerification(email) {
      return apiClient.request('POST', '/auth/resend-verification', { email });
    },
    getMe() {
      return apiClient.request('GET', '/auth/me');
    },
    changePassword(currentPassword, newPassword) {
      return apiClient.request('POST', '/auth/change-password', { currentPassword, newPassword });
    },
  },

  // Sensor Endpoints
  sensors: {
    listByVillage(villageId) {
      return apiClient.request('GET', `/sensors/village/${villageId}`);
    },
    create(villageId, sensorTypeId, name, infoText, deviceId, latitude, longitude) {
      return apiClient.request('POST', `/sensors/village/${villageId}`, {
        sensorTypeId,
        name,
        infoText: infoText || '',
        deviceId: deviceId ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      });
    },
    get(sensorId) {
      return apiClient.request('GET', `/sensors/${sensorId}`);
    },
    update(sensorId, data) {
      return apiClient.request('PATCH', `/sensors/${sensorId}`, data);
    },
    delete(sensorId) {
      return apiClient.request('DELETE', `/sensors/${sensorId}`);
    },
  },

  devices: {
    listByVillage(villageId) {
      return apiClient.request('GET', `/devices/village/${villageId}`);
    },
    create(villageId, data) {
      return apiClient.request('POST', `/devices/village/${villageId}`, data);
    },
    update(deviceId, data) {
      return apiClient.request('PATCH', `/devices/${deviceId}`, data);
    },
  },

  // Village Endpoints
  villages: {
    get(villageId) {
      return apiClient.request('GET', `/villages/${villageId}`);
    },
    update(villageId, data) {
      return apiClient.request('PUT', `/villages/${villageId}`, data);
    },
    getFeatures(villageId) {
      return apiClient.request('GET', `/villages/${villageId}/features`);
    },
    updateFeatures(villageId, data) {
      return apiClient.request('PATCH', `/villages/${villageId}/features`, data);
    },
  },

  admin: {
    deleteAccount(accountId) {
      return apiClient.request('DELETE', `/admin/accounts/${accountId}`);
    },
  },

  // Village Modules (custom user-defined modules)
  villageModules: {
    list(villageId) {
      return apiClient.request('GET', `/villages/${villageId}/modules`);
    },
    create(villageId, data) {
      return apiClient.request('POST', `/villages/${villageId}/modules`, data);
    },
    update(villageId, moduleId, data) {
      return apiClient.request('PATCH', `/villages/${villageId}/modules/${moduleId}`, data);
    },
    delete(villageId, moduleId) {
      return apiClient.request('DELETE', `/villages/${villageId}/modules/${moduleId}`);
    },
  },


  // Location search
  locations: {
    search(query) {
      const params = new URLSearchParams({ query });
      return apiClient.request('GET', `/locations/search?${params.toString()}`);
    },
  },

  // Sensor Types Endpoints
  sensorTypes: {
    list() {
      return apiClient.request('GET', '/sensor-types');
    },
  },

  // Sensor Reading Endpoints
  sensorReadings: {
    list(sensorId, options = {}) {
      const params = new URLSearchParams();
      if (options.from) params.set('from', options.from);
      if (options.to) params.set('to', options.to);
      if (options.limit) params.set('limit', String(options.limit));
      if (options.order) params.set('order', options.order);
      const query = params.toString();
      const endpoint = query
        ? `/sensor-readings/${sensorId}?${query}`
        : `/sensor-readings/${sensorId}`;
      return apiClient.request('GET', endpoint);
    },
    create(sensorId, data) {
      return apiClient.request('POST', `/sensor-readings/${sensorId}`, data);
    },
    getTimeseries(sensorId, from, to, bucket = '1h') {
      const params = new URLSearchParams({
        from,
        to,
        bucket,
      });
      return apiClient.request('GET', `/sensor-readings/${sensorId}/timeseries?${params}`);
    },
    getSummary(sensorId, from, to) {
      const params = new URLSearchParams({
        from,
        to,
      });
      return apiClient.request('GET', `/sensor-readings/${sensorId}/summary?${params}`);
    },
  },

  // Public App-API Endpoints (no auth required)
  appApi: {
    getVillages() {
      return apiClient.request('GET', '/app/villages');
    },
    getVillageConfig(villageId) {
      return apiClient.request('GET', `/app/villages/${villageId}/config`);
    },
    getVillageInitialData(villageId) {
      return apiClient.request('GET', `/app/villages/${villageId}/initial-data`);
    },
  },

  // Health check
  health() {
    return apiClient.request('GET', '/health');
  },
};
