import { setupServer } from 'msw/node'
import { handlers } from '../handlers'

// 配置 MSW server
export const server = setupServer(...handlers)

// 添加事件监听器来调试
server.events.on('request:start', ({ request }) => {
  console.log('[MSW] Outgoing:', request.method, request.url)
})

server.events.on('request:match', ({ request }) => {
  console.log('[MSW] Matched:', request.method, request.url)
})

server.events.on('request:unhandled', ({ request }) => {
  console.log('[MSW] Unhandled:', request.method, request.url)
})
