import React, { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, type RenderOptions } from '@testing-library/react'

import { routeTree } from '@/routeTree.gen'
import { ThemeProvider } from '@/context/theme-provider'
import { FontProvider } from '@/context/font-provider'
import { DirectionProvider } from '@/context/direction-provider'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

export function renderRoute(route = '/', renderOptions?: RenderOptions) {
  const testQueryClient = createTestQueryClient()
  const history = createMemoryHistory({
    initialEntries: [route],
  })

  const router = createRouter({
    history,
    routeTree,
    context: { queryClient: testQueryClient },
  })

  return {
    history,
    router,
    queryClient: testQueryClient,
    ...render(
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <Suspense fallback={null}>
                <RouterProvider router={router} />
              </Suspense>
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>,
      renderOptions
    ),
  }
}
