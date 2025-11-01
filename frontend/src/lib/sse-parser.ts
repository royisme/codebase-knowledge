/**
 * Server-Sent Events (SSE) 解析工具
 *
 * 用于解析流式传输的 SSE 数据，支持分片和多行事件
 */
import type { StreamEvent, SSEParseResult } from '@/types/streaming'

/**
 * 解析 SSE 格式的缓冲区
 *
 * SSE 格式示例：
 * ```
 * event: text
 * data: {"content":"Hello"}
 *
 * event: metadata
 * data: {"execution_time_ms":1234}
 *
 * ```
 *
 * @param buffer - 包含 SSE 数据的字符串缓冲区
 * @returns 解析结果，包含已解析的事件和剩余未完成的数据
 */
export function parseSSE(buffer: string): SSEParseResult {
  const events: StreamEvent[] = []
  const lines = buffer.split('\n')
  let currentEvent: { event?: string; data?: string } = {}
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行表示一个事件的结束
    if (line.trim() === '') {
      if (currentEvent.event && currentEvent.data) {
        try {
          const parsed = JSON.parse(currentEvent.data)
          events.push({
            type: currentEvent.event as StreamEvent['type'],
            ...parsed,
          })
        } catch {
          // Failed to parse SSE data - silently ignore malformed events
        }
      }
      currentEvent = {}
      i++
      continue
    }

    // 解析事件类型
    if (line.startsWith('event:')) {
      currentEvent.event = line.slice(6).trim()
      i++
      continue
    }

    // 解析事件数据
    if (line.startsWith('data:')) {
      const data = line.slice(5).trim()
      currentEvent.data = currentEvent.data ? currentEvent.data + data : data
      i++
      continue
    }

    // 注释行（以 : 开头），忽略
    if (line.startsWith(':')) {
      i++
      continue
    }

    // 其他情况，移动到下一行
    i++
  }

  // 如果有未完成的事件，保留为剩余数据
  let remaining = ''
  if (currentEvent.event || currentEvent.data) {
    const incompleteParts = []
    if (currentEvent.event) {
      incompleteParts.push(`event: ${currentEvent.event}`)
    }
    if (currentEvent.data) {
      incompleteParts.push(`data: ${currentEvent.data}`)
    }
    remaining = incompleteParts.join('\n')
  }

  return { parsed: events, remaining }
}

/**
 * 创建 SSE 事件字符串（用于 Mock API）
 *
 * @param type - 事件类型
 * @param data - 事件数据对象
 * @returns SSE 格式的字符串
 */
export function createSSEEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * 将文本分割为模拟流式传输的块
 *
 * @param text - 完整文本
 * @param chunkSize - 每块的字符数（默认为单词边界）
 * @returns 文本块数组
 */
export function splitIntoChunks(text: string, chunkSize?: number): string[] {
  if (chunkSize) {
    // 按固定字符数分割
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }
    return chunks
  }

  // 按单词边界分割（更自然的流式效果）
  const words = text.split(/(\s+)/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const word of words) {
    currentChunk += word
    // 每 3-5 个单词或标点符号后发送一个块
    if (
      currentChunk.length > 15 ||
      word.match(/[。！？.!?]/) ||
      currentChunk.split(/\s+/).length > 4
    ) {
      chunks.push(currentChunk)
      currentChunk = ''
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks.filter((chunk) => chunk.trim().length > 0)
}

/**
 * 延迟函数（用于模拟网络延迟）
 *
 * @param ms - 延迟毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
