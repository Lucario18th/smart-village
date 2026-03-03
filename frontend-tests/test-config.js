// Test configuration
const TEST_CONFIG = {
  API_URL: 'https://localhost:8000',
  TEST_USER: {
    email: 'test@test.de',
    password: 'test1234',
  },
};

// Helper: API Call with HTTPS support
async function apiCall(endpoint, options = {}) {
  const url = `${TEST_CONFIG.API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Helper: Set Bearer Token
function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

// Helper: Get Bearer Token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper: Clear Token
function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// Helper: API call with Bearer token
async function apiCallWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
