import type { ApiError } from '@/types'
import { useAuthStore } from '@/stores/auth-store'

interface ApiClientOptions {
  endpoint: string
  method?: string
  headers?: HeadersInit
  body?: unknown
  signal?: AbortSignal
  credentials?: RequestCredentials
}

export interface ApiClientError extends ApiError {
  status: number
}

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()
const BASE_URL = RAW_BASE_URL && RAW_BASE_URL.length > 0 ? RAW_BASE_URL : 'http://localhost'

export async function apiClient<T>({
  endpoint,
  headers,
  method = 'GET',
  body,
  signal,
  credentials,
}: ApiClientOptions): Promise<T> {
  const token = useAuthStore.getState().auth.token?.accessToken
  const resolvedHeaders = new Headers(headers)

  if (!resolvedHeaders.has('Content-Type') && body) {
    resolvedHeaders.set('Content-Type', 'application/json')
  }
  if (token) {
    resolvedHeaders.set('Authorization', `Bearer ${token}`)
  }

  const targetUrl = new URL(endpoint, BASE_URL).toString()

  const response = await fetch(targetUrl, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: resolvedHeaders,
    credentials: credentials ?? 'include',
    signal,
  })

  const contentType = response.headers.get('content-type')
  const isJsonResponse = contentType?.includes('application/json')

  if (!response.ok) {
    let parsed: ApiError | undefined
    if (isJsonResponse) {
      try {
        parsed = (await response.json()) as ApiError
      } catch {
        parsed = undefined
      }
    }

    const error: ApiClientError = {
      status: response.status,
      code: parsed?.code ?? 'UNKNOWN_ERROR',
      message: parsed?.message ?? response.statusText,
      details: parsed?.details,
    }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (isJsonResponse) {
    return (await response.json()) as T
  }

  return undefined as T
}
