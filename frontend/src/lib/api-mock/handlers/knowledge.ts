import { http, HttpResponse } from 'msw'
import { authFixtures } from '../fixtures/auth'
import knowledgeSources from '../fixtures/knowledge-sources.json'

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export const knowledgeHandlers = [
  http.get('*/api/v1/knowledge/sources', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')

    let filtered = knowledgeSources

    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(
        (source) =>
          source.name.toLowerCase().includes(lowerSearch) ||
          source.alias.toLowerCase().includes(lowerSearch) ||
          source.description.toLowerCase().includes(lowerSearch)
      )
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((source) => source.status === status)
    }

    return HttpResponse.json(filtered)
  }),

  http.get('*/api/v1/knowledge/sources/:sourceId', ({ params, request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const { sourceId } = params
    const source = knowledgeSources.find((s) => s.id === sourceId)

    if (!source) {
      return HttpResponse.json(
        { error: 'Knowledge source not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(source)
  }),

  http.get('*/api/v1/knowledge/memory', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json([])
  }),

  http.post('*/api/v1/knowledge/memory', async ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: `mem-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.delete('*/api/v1/knowledge/memory/:id', ({ request }) => {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token || !authFixtures.findUserByToken(token)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
]
