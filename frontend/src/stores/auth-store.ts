import type { AuthResponse, AuthUser, SessionToken } from '@/types'
import { create } from 'zustand'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

const AUTH_TOKEN_COOKIE = 'nau-auth-token'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function persistToken(token: SessionToken | null): void {
  if (!token) {
    removeCookie(AUTH_TOKEN_COOKIE)
    return
  }
  const encoded = encodeURIComponent(JSON.stringify(token))
  setCookie(AUTH_TOKEN_COOKIE, encoded, COOKIE_MAX_AGE_SECONDS)
}

function readTokenFromCookie(): SessionToken | null {
  const rawCookie = getCookie(AUTH_TOKEN_COOKIE)
  if (!rawCookie) return null
  try {
    return JSON.parse(decodeURIComponent(rawCookie)) as SessionToken
  } catch {
    removeCookie(AUTH_TOKEN_COOKIE)
    return null
  }
}

interface AuthSlice {
  user: AuthUser | null
  token: SessionToken | null
  isAuthenticated: boolean
  setAuth: (payload: AuthResponse) => void
  setUser: (user: AuthUser | null) => void
  clear: () => void
  reset: () => void
}

interface AuthState {
  auth: AuthSlice
}

export const useAuthStore = create<AuthState>()((set) => {
  const initialToken = readTokenFromCookie()

  const clearAuthState = () =>
    set((state) => {
      persistToken(null)
      return {
        ...state,
        auth: {
          ...state.auth,
          user: null,
          token: null,
          isAuthenticated: false,
        },
      }
    })

  return {
    auth: {
      user: null,
      token: initialToken,
      isAuthenticated: Boolean(initialToken),
      setAuth: (payload) =>
        set((state) => {
          persistToken(payload.token)
          return {
            ...state,
            auth: {
              ...state.auth,
              user: payload.user,
              token: payload.token,
              isAuthenticated: true,
            },
          }
        }),
      setUser: (user) =>
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user,
            isAuthenticated: Boolean(user && state.auth.token),
          },
        })),
      clear: clearAuthState,
      reset: clearAuthState,
    },
  }
})
