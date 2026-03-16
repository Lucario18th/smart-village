# Mock API Development Guide

This document explains how to set up and use the Mock Service Worker (MSW) for local development of the Smart Village website.

## Overview

MSW (Mock Service Worker) intercepts HTTP requests in the browser and returns mock responses. This allows you to develop and test the frontend without needing the NestJS backend running locally. The mock API only works in development mode—production builds use the real backend.

## Initial Setup

### 1. Install Dependencies

Install MSW as a development dependency:

```bash
npm install
```

If MSW is not already installed, run:

```bash
npm install --save-dev msw
```

### 2. Initialize the Service Worker

Initialize the MSW Service Worker in the public folder:

```bash
npx msw init public
```

This command creates the necessary Service Worker script that handles request interception. It should only need to be run once. MSW may ask to save the worker directory in `package.json`—say yes to simplify future updates.

## Running the App with Mocks

Once setup is complete, simply start the development server:

```bash
npm run dev
```

The app will automatically start MSW in development mode. You should see a message in the browser console confirming MSW has started:

```
[MSW] Mocking enabled.
```

### Test Credentials

Use these credentials to log in:

- **Email:** `test@example.com`
- **Password:** `test123`

Any other email/password combination will be rejected with a 401 error.

## How It Works

### Architecture

- **`src/mocks/handlers.js`**: Defines all mock HTTP handlers (request/response pairs)
- **`src/mocks/browser.js`**: Initializes the Service Worker with the handlers
- **`src/main.jsx`**: Dynamically imports and starts MSW before rendering the React app (dev mode only)

### Request Interception

All requests to the following endpoints are intercepted and mocked:

- `POST /api/auth/login` — Authenticates with test credentials
- `GET /api/auth/me` — Returns the authenticated user object

The API client in `src/api/client.js` uses the same URLs as in production (`/api/*`), so no changes are needed to your existing code.

## Adding More Mock Endpoints

To add mock responses for additional endpoints (e.g., `/api/villages`, `/api/projects`), edit `src/mocks/handlers.js`:

```javascript
// Example: Add a mock endpoint for villages
http.get('/api/villages/:id', ({ params }) => {
  const { id } = params;
  return HttpResponse.json({
    id,
    name: 'Test Village',
    description: 'A mock village for development',
  });
}),
```

Place your handlers in the `additionalHandlers` array, then restart the dev server.

## Production Builds

When you build for production (`npm run build`), MSW code is not included. The build is completely clean and will communicate with the real NestJS backend.

## Troubleshooting

### MSW is not intercepting requests

1. Check that the browser console shows `[MSW] Mocking enabled.`
2. Verify the Service Worker is registered: Open DevTools → Application → Service Workers
3. Make sure you're using relative URLs (e.g., `/api/auth/login`, not `http://localhost:3000/api/auth/login`)

### "Unhandled request" warnings

If you see warnings for unhandled requests in the console, it means an endpoint is not mocked. Add a handler for it in `src/mocks/handlers.js` or suppress the warning by setting `onUnhandledRequest: 'bypass'` in `src/main.jsx`.

### Service Worker not updating

If you change handlers and the changes don't take effect:
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear Service Workers: DevTools → Application → Service Workers → Unregister

## References

- [MSW Documentation](https://mswjs.io)
- [MSW Quick Start](https://mswjs.io/docs/quick-start)
- [Request/Response Handling](https://mswjs.io/docs/basics/request-response-inspection)
