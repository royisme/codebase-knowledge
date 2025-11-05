import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from '@/lib/api-mock/msw/server'
import { setupTestAuth, clearTestAuth } from '@/lib/test-utils'

// Fix for MSW with vitest/node environment
if (typeof global !== 'undefined' && !global.fetch) {
  global.fetch = fetch
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => {
    return {
      matches: query.includes('prefers-color-scheme: dark') ? false : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }
  }
}

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // @ts-expect-error - assign mock
  window.ResizeObserver = ResizeObserverMock
}

if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => undefined
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => undefined
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
  // eslint-disable-next-line no-console
  console.log('[MSW] Server started')
})

beforeEach(() => {
  // 默认为每个测试注入管理员登录态，避免 RBAC 请求 401
  setupTestAuth()
})

afterEach(() => {
  server.resetHandlers()
  clearTestAuth()
})

afterAll(() => {
  server.close()
  // eslint-disable-next-line no-console
  console.log('[MSW] Server closed')
})
