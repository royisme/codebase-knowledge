import type { HttpHandler } from 'msw'
import { graphRAGHandlers } from '../graphrag-handlers'
import { adminUserHandlers } from './admin-users'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { jobHandlers } from './jobs'
import { knowledgeHandlers } from './knowledge'
import { knowledgeQueryHandlers } from './knowledge-query'
import { knowledgeSourceHandlers } from './knowledge-sources'
import { ragHandlers } from './rag'
import { ragQueryHandlers } from './rag-query'
import { rbacHandlers } from './rbac'
import { taskHandlers } from './tasks'

export const handlers: HttpHandler[] = [
  ...authHandlers,
  ...dashboardHandlers,
  ...knowledgeQueryHandlers, // knowledge 查询相关（包含 /query, /search, /sessions, /notes）
  ...knowledgeHandlers, // knowledge 基础路由（/sources）
  ...knowledgeSourceHandlers, // admin 的知识源管理
  ...taskHandlers,
  ...ragQueryHandlers, // rag-query 应该在 rag 之前，因为它更具体
  ...ragHandlers,
  ...rbacHandlers,
  ...adminUserHandlers,
  ...graphRAGHandlers,
  ...jobHandlers,
]
