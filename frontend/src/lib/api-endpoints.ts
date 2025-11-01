/**
 * API 端点集中管理
 * 
 * 所有后端 API 路径的单一真相源
 * 优点：
 * 1. 集中管理，易于维护
 * 2. 类型安全
 * 3. IDE 自动补全
 * 4. 修改路径只需改一处
 */

export const API_ENDPOINTS = {
  // ==================== 认证相关 ====================
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    register: '/api/v1/auth/register',
    me: '/api/v1/auth/users/me',
  },

  // ==================== 知识源管理 ====================
  knowledgeSources: {
    list: '/api/v1/admin/sources',
    create: '/api/v1/admin/sources',
    detail: (id: string) => `/api/v1/admin/sources/${id}`,
    update: (id: string) => `/api/v1/admin/sources/${id}`,
    delete: (id: string) => `/api/v1/admin/sources/${id}`,
    sync: (id: string) => `/api/v1/admin/sources/${id}/sync`,
    bulk: '/api/v1/admin/sources/bulk',
  },

  // ==================== RAG 查询 ====================
  rag: {
    query: '/api/v1/knowledge/query',
    stream: '/api/v1/knowledge/query/stream',
    queryHistory: '/api/v1/knowledge/query/history',
    queryDetail: (id: string) => `/api/v1/knowledge/query/${id}`,
  },

  // ==================== 任务管理 ====================
  tasks: {
    list: '/api/v1/admin/tasks',
    create: '/api/v1/admin/tasks',
    detail: (id: string) => `/api/v1/admin/tasks/${id}`,
    cancel: (id: string) => `/api/v1/admin/tasks/${id}/cancel`,
    retry: (id: string) => `/api/v1/admin/tasks/${id}/retry`,
    logs: (id: string) => `/api/v1/admin/tasks/${id}/logs`,
  },

  // ==================== 用户管理 ====================
  users: {
    list: '/api/v1/admin/users',
    create: '/api/v1/admin/users',
    detail: (id: string) => `/api/v1/admin/users/${id}`,
    update: (id: string) => `/api/v1/admin/users/${id}`,
    delete: (id: string) => `/api/v1/admin/users/${id}`,
    activate: (id: string) => `/api/v1/admin/users/${id}/activate`,
    deactivate: (id: string) => `/api/v1/admin/users/${id}/deactivate`,
  },

  // ==================== RBAC 权限 ====================
  rbac: {
    roles: '/api/v1/admin/rbac/roles',
    roleDetail: (id: string) => `/api/v1/admin/rbac/roles/${id}`,
    permissions: '/api/v1/admin/rbac/permissions',
    assignRole: '/api/v1/admin/rbac/assign-role',
    roleMembers: '/api/v1/admin/role-members',
    updatePolicy: '/api/v1/admin/policies/update',
  },

  // ==================== 审计日志 ====================
  audit: {
    list: '/api/v1/admin/audit/events',
    detail: (id: string) => `/api/v1/admin/audit/events/${id}`,
  },

  // ==================== 代码仓库管理 ====================
  repositories: {
    list: '/api/v1/admin/sources',
    detail: (id: string) => `/api/v1/admin/sources/${id}`,
    create: '/api/v1/admin/sources',
    update: (id: string) => `/api/v1/admin/sources/${id}`,
    delete: (id: string) => `/api/v1/admin/sources/${id}`,
    validate: '/api/v1/admin/sources/validate',
    triggerIndex: (id: string) => `/api/v1/admin/sources/${id}/index`,
  },

  // ==================== 索引任务管理 ====================
  jobs: {
    list: '/api/v1/admin/jobs',
    detail: (id: string) => `/api/v1/admin/jobs/${id}`,
    cancel: (id: string) => `/api/v1/admin/jobs/${id}/cancel`,
    retry: (id: string) => `/api/v1/admin/jobs/${id}/retry`,
  },

  // ==================== 用户仪表盘 ====================
  dashboard: {
    summary: '/api/v1/dashboard/summary',
    queryTrend: '/api/v1/dashboard/query-trend',
    sourceStatus: '/api/v1/dashboard/source-status',
  },

  // ==================== 知识探索 ====================
  knowledge: {
    sources: '/api/v1/knowledge/sources',
    query: '/api/v1/knowledge/query',
  },
} as const

/**
 * 类型辅助：提取所有端点的类型
 */
export type ApiEndpoints = typeof API_ENDPOINTS

/**
 * 辅助函数：构建查询字符串
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)))
    } else {
      searchParams.set(key, String(value))
    }
  })
  
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

/**
 * 辅助函数：组合端点和查询参数
 */
export function withQuery(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint
  const query = buildQueryString(params)
  return `${endpoint}${query}`
}
