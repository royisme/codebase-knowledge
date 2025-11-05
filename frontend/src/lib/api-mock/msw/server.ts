import { setupServer } from 'msw/node'
import { handlers } from '../handlers'

const MSW_DEBUG = process.env.MSW_DEBUG === 'true'

function debugLog(...args: unknown[]) {
  if (MSW_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[MSW]', ...args)
  }
}

// 配置 MSW server
export const server = setupServer(...handlers)

// 添加事件监听器（仅在 debug 模式输出）
server.events.on('request:start', ({ request }) => {
  debugLog('Outgoing:', request.method, request.url)
})

server.events.on('request:match', ({ request }) => {
  debugLog('Matched:', request.method, request.url)
})

server.events.on('request:unhandled', ({ request }) => {
  debugLog('Unhandled:', request.method, request.url)
})
