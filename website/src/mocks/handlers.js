import { http, HttpResponse } from 'msw'

// Mock test user credentials
const TEST_USER = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user'],
}

const TEST_PASSWORD = 'test123'
const FAKE_TOKEN = 'fake-jwt-token-dev-only'

/**
 * Authentication handlers
 */
const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    const { email, password } = body

    // Debug: verify handler is hit (do not log plaintext password)
    console.log('MSW login handler hit', { email, password: '[REDACTED]' })

    // Validate test user credentials
    if (email === TEST_USER.email && password === TEST_PASSWORD) {
      // IMPORTANT: match real backend response shape
      return HttpResponse.json(
        {
          accessToken: FAKE_TOKEN, // camelCase like real API
          user: TEST_USER,
        },
        { status: 200 },
      )
    }

    // Distinguish between unknown user and wrong password for the known user
    if (email !== TEST_USER.email) {
      return HttpResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User does not exist',
          code: 'USER_NOT_FOUND',
        },
        { status: 401 },
      )
    }

    return HttpResponse.json(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid password',
        code: 'INVALID_PASSWORD',
      },
      { status: 401 },
    )
  }),

  // GET /api/auth/me
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token === FAKE_TOKEN) {
      return HttpResponse.json(TEST_USER, { status: 200 })
    }

    return HttpResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing token',
      },
      { status: 401 },
    )
  }),
]

/**
 * Placeholder handlers for future endpoints
 * Add more handlers here for /projects, /villages, etc.
 */
const additionalHandlers = [
  // Example placeholder for future endpoints:
  // http.get('/api/villages/:id', ({ params }) => { ... }),
  // http.get('/api/projects', () => { ... }),
]

/**
 * All handlers for MSW
 */
export const handlers = [...authHandlers, ...additionalHandlers]
