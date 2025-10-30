import { setupWorker } from 'msw/browser'
import { handlers } from '../handlers'
import { shouldEnableMocking } from './shared'

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  if (!shouldEnableMocking()) {
    return
  }

  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}
