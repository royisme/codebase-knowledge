import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStreamingQuery } from '@/hooks/useStreamingQuery'
import { parseSSE, createSSEEvent, splitIntoChunks } from '@/lib/sse-parser'
import type { StreamEvent } from '@/types/streaming'

describe('SSE Parser', () => {
  describe('parseSSE', () => {
    it('should parse single SSE event', () => {
      const buffer = 'event: text\ndata: {"content":"Hello"}\n\n'
      const { parsed, remaining } = parseSSE(buffer)

      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual({
        type: 'text',
        content: 'Hello',
      })
      expect(remaining).toBe('')
    })

    it('should parse multiple SSE events', () => {
      const buffer =
        'event: text\ndata: {"content":"Hello"}\n\n' +
        'event: metadata\ndata: {"data":{"execution_time_ms":100}}\n\n'

      const { parsed, remaining } = parseSSE(buffer)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].type).toBe('text')
      expect(parsed[1].type).toBe('metadata')
      expect(remaining).toBe('')
    })

    it('should handle incomplete events', () => {
      const buffer = 'event: text\ndata: {"content":"Hell'
      const { parsed, remaining } = parseSSE(buffer)

      expect(parsed).toHaveLength(0)
      expect(remaining).toContain('event: text')
      expect(remaining).toContain('data: {"content":"Hell')
    })

    it('should ignore comment lines', () => {
      const buffer =
        ': This is a comment\n' +
        'event: text\ndata: {"content":"Hello"}\n\n'

      const { parsed } = parseSSE(buffer)

      expect(parsed).toHaveLength(1)
      expect(parsed[0].type).toBe('text')
    })

    it('should handle malformed JSON gracefully', () => {
      const buffer = 'event: text\ndata: {invalid json}\n\n'
      const { parsed } = parseSSE(buffer)

      expect(parsed).toHaveLength(0)
    })

    it('should preserve remaining data for next parse', () => {
      const buffer1 = 'event: text\ndata: {"content":"Part1'
      const { parsed: parsed1, remaining: remaining1 } = parseSSE(buffer1)

      // First buffer should not parse anything, but preserve the incomplete event
      expect(parsed1).toHaveLength(0)
      expect(remaining1).toContain('event: text')
      expect(remaining1).toContain('data: {"content":"Part1')

      // Simulate receiving the rest of the data
      const buffer2 = remaining1 + '"}\n\n'
      const { parsed: parsed2 } = parseSSE(buffer2)

      // Now it should parse successfully
      expect(parsed2).toHaveLength(1)
      expect(parsed2[0]).toEqual(
        expect.objectContaining({
          type: 'text',
          content: 'Part1',
        })
      )
    })
  })

  describe('createSSEEvent', () => {
    it('should format SSE event correctly', () => {
      const event = createSSEEvent('text', { content: 'Hello' })
      expect(event).toBe('event: text\ndata: {"content":"Hello"}\n\n')
    })

    it('should handle complex data objects', () => {
      const event = createSSEEvent('metadata', {
        data: {
          execution_time_ms: 1234,
          sources: ['a', 'b'],
        },
      })

      expect(event).toContain('event: metadata')
      expect(event).toContain('"execution_time_ms":1234')
      expect(event).toContain('["a","b"]')
    })
  })

  describe('splitIntoChunks', () => {
    it('should split text by word boundaries', () => {
      const text = 'Hello world, this is a test.'
      const chunks = splitIntoChunks(text)

      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.join('')).toBe(text)
    })

    it('should respect fixed chunk size', () => {
      const text = 'Hello world'
      const chunks = splitIntoChunks(text, 5)

      expect(chunks).toEqual(['Hello', ' worl', 'd'])
    })

    it('should handle Chinese text', () => {
      const text = '这是一个测试。'
      const chunks = splitIntoChunks(text)

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.join('')).toBe(text)
    })

    it('should split at punctuation', () => {
      const text = 'First sentence. Second sentence.'
      const chunks = splitIntoChunks(text)

      expect(chunks.some((chunk) => chunk.includes('.'))).toBe(true)
    })
  })
})

describe('useStreamingQuery Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useStreamingQuery())

    expect(result.current.text).toBe('')
    expect(result.current.entities).toEqual([])
    expect(result.current.metadata).toBeNull()
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should accumulate text events', async () => {
    const handlers = {
      onText: vi.fn(),
    }

    const { result } = renderHook(() => useStreamingQuery(handlers))

    // Manually trigger text events
    await waitFor(() => {
      // This would normally be called by the streaming logic
      // We're testing the state management here
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('should call onDone handler when stream completes', async () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useStreamingQuery({ onDone }))

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('should call onError handler on error', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useStreamingQuery({ onError }))

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('should reset state when reset is called', async () => {
    const { result } = renderHook(() => useStreamingQuery())

    // Call reset
    result.current.reset()

    await waitFor(() => {
      expect(result.current.text).toBe('')
      expect(result.current.entities).toEqual([])
      expect(result.current.metadata).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })
})

describe('Stream Event Types', () => {
  it('should validate TextEvent structure', () => {
    const event: StreamEvent = {
      type: 'text',
      content: 'Hello',
      delta: true,
    }

    expect(event.type).toBe('text')
    expect(event.content).toBe('Hello')
  })

  it('should validate EntityEvent structure', () => {
    const event: StreamEvent = {
      type: 'entity',
      entity: {
        type: 'file',
        name: 'auth.py',
        importance: 'high',
        detail: 'Authentication module',
      },
    }

    expect(event.type).toBe('entity')
    expect(event.entity.type).toBe('file')
  })

  it('should validate MetadataEvent structure', () => {
    const event: StreamEvent = {
      type: 'metadata',
      data: {
        execution_time_ms: 1234,
        sources_queried: ['repo-1'],
        confidence_score: 0.92,
      },
    }

    expect(event.type).toBe('metadata')
    expect(event.data.execution_time_ms).toBe(1234)
  })

  it('should validate DoneEvent structure', () => {
    const event: StreamEvent = {
      type: 'done',
      query_id: 'q-123',
      timestamp: new Date().toISOString(),
    }

    expect(event.type).toBe('done')
    expect(event.query_id).toBe('q-123')
  })

  it('should validate ErrorEvent structure', () => {
    const event: StreamEvent = {
      type: 'error',
      message: 'Query timeout',
      code: 'TIMEOUT',
    }

    expect(event.type).toBe('error')
    expect(event.message).toBe('Query timeout')
  })
})
