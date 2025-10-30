import type { HttpHandler } from 'msw'
import { graphRAGHandlers } from '../graphrag-handlers'
import { adminUserHandlers } from './admin-users'
import { authHandlers } from './auth'
import { knowledgeSourceHandlers } from './knowledge-sources'
import { ragHandlers } from './rag'
import { rbacHandlers } from './rbac'
import { taskHandlers } from './tasks'

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...knowledgeSourceHandlers,
  ...taskHandlers,
  ...ragHandlers,
  ...rbacHandlers,
  ...adminUserHandlers,
  ...graphRAGHandlers,
]
