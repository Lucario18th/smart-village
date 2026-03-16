import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './css/light.css'
import './css/light-mc.css'
import './css/light-hc.css'
import './css/dark.css'
import './css/dark-mc.css'
import './css/dark-hc.css'
import 'leaflet/dist/leaflet.css'
import './styles.css'

/**
 * Initialize MSW (Mock Service Worker) in development mode only.
 * This intercepts all API calls and returns mock responses for local development.
 * In production, this code is never imported or executed.
 */
async function initializeMocks() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest(request, print) {
        const url = new URL(request.url)
        const isLocalApi = url.origin === window.location.origin && url.pathname.startsWith('/api/')
        if (isLocalApi) {
          print.warning()
          return
        }
        // Ignore non-API assets/external URLs to avoid repeated dev noise.
      },
    });
  }
}

const container = document.getElementById('root')
const root = createRoot(container)

document.documentElement.classList.add('light')

// Start mocks before rendering the app (dev mode only).
// Ensure the app still renders even if MSW initialization fails.
initializeMocks()
  .catch((error) => {
    // Log MSW initialization errors but do not block app startup.
    // This is especially important in environments where Service Workers are unsupported.
    console.error('Failed to initialize mock service worker:', error)
  })
  .finally(() => {
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
  })

