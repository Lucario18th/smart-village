import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './css/light.css'
import './css/light-mc.css'
import './css/light-hc.css'
import './css/dark.css'
import './css/dark-mc.css'
import './css/dark-hc.css'
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
      onUnhandledRequest: 'warn',
    });
  }
}

const container = document.getElementById('root')
const root = createRoot(container)

document.documentElement.classList.add('light')

// Start mocks before rendering the app (dev mode only)
initializeMocks().then(() => {
  root.render(<App />)
})

