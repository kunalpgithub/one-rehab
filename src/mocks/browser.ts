import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// This check ensures we're in the browser environment
if (typeof window !== 'undefined') {
  const worker = setupWorker(...handlers)
  worker.start({
    onUnhandledRequest: 'bypass',
  })
}