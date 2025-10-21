import type { HttpHandler } from 'msw'

import { adminUserHandlers } from './admin-users'
import { authHandlers } from './auth'
import { knowledgeSourceHandlers } from './knowledge-sources'
import { ragHandlers } from './rag'
import { taskHandlers } from './tasks'
import { rbacHandlers } from './rbac'

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...knowledgeSourceHandlers,
  ...taskHandlers,
  ...ragHandlers,
  ...rbacHandlers,
  ...adminUserHandlers,
]
