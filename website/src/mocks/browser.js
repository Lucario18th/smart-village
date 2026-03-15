import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Initialize the Service Worker with all handlers
export const worker = setupWorker(...handlers);
