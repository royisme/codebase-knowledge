import type {
  Identifier,
  ISODateString,
  RagMessage,
  RagSession,
  RagCitation,
} from '@/types'

const buildMessage = (input: {
  id: string
  role: RagMessage['role']
  content: string
  createdAt: string
  citations?: RagCitation[]
}): RagMessage => ({
  id: input.id as Identifier,
  role: input.role,
  content: input.content,
  createdAt: input.createdAt as ISODateString,
  citations: input.citations,
})

const sessions: RagSession[] = [
  {
    id: 'session-1' as Identifier,
    repositoryId: 'backend-repo' as Identifier,
    title: '解析管道失败原因分析',
    createdAt: new Date('2025-01-19T02:00:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-19T02:10:00Z').toISOString() as ISODateString,
    participants: ['user-1'].map((id) => id as Identifier),
    messages: [
      buildMessage({
        id: 'msg-1',
        role: 'user',
        content: '解析管道最新的失败原因是什么？',
        createdAt: new Date('2025-01-19T02:01:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-2',
          role: 'assistant',
          content:
            '最近一次失败发生在 2025-01-18T23:10Z，原因是 Neo4j 写入超时。系统检测到超时后自动重试了3次，最终在第4次尝试时成功写入。建议优化 Neo4j 的批量写入配置以避免类似问题。',
          createdAt: new Date('2025-01-19T02:01:20Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-1' as Identifier,
            label: '任务执行日志 #TASK-2025-0118-2310',
            resourceUri: 'file://logs/pipeline/tasks.log',
            score: 0.94,
          },
          {
            id: 'cite-2' as Identifier,
            label: 'Neo4j 配置文件 neo4j.conf',
            resourceUri: 'file://config/neo4j/neo4j.conf',
            score: 0.89,
          },
          {
            id: 'cite-3' as Identifier,
            label: '数据管道错误处理代码',
            resourceUri: 'file://src/pipeline/error-handler.ts',
            score: 0.86,
          },
        ],
      },
    ],
  },
  {
    id: 'session-2' as Identifier,
    repositoryId: 'frontend-repo' as Identifier,
    title: '用户认证系统架构查询',
    createdAt: new Date('2025-01-19T01:30:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-19T01:45:00Z').toISOString() as ISODateString,
    participants: ['user-1'].map((id) => id as Identifier),
    messages: [
      buildMessage({
        id: 'msg-3',
        role: 'user',
        content: '显示所有与"用户认证"相关的组件和模块',
        createdAt: new Date('2025-01-19T01:31:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-4',
          role: 'assistant',
          content:
            '找到了 8 个与用户认证相关的核心组件：\n1. AuthProvider - 认证状态管理\n2. LoginModal - 登录弹窗组件\n3. UserSession - 会话管理\n4. TokenManager - JWT 令牌处理\n5. PermissionGuard - 权限守卫组件\n6. RBACService - 基于角色的访问控制\n7. AuthAPI - 认证接口封装\n8. PasswordValidator - 密码验证器\n\n这些组件共同构成了完整的认证体系，支持 JWT 令牌、角色权限控制、会话管理等功能。',
          createdAt: new Date('2025-01-19T01:31:25Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-4' as Identifier,
            label: '认证上下文 AuthProvider',
            resourceUri: 'file://src/context/AuthContext.tsx',
            score: 0.96,
          },
          {
            id: 'cite-5' as Identifier,
            label: '登录组件 LoginModal',
            resourceUri: 'file://src/components/auth/LoginModal.tsx',
            score: 0.93,
          },
          {
            id: 'cite-6' as Identifier,
            label: '权限管理 RBACService',
            resourceUri: 'file://src/services/rbac.ts',
            score: 0.91,
          },
          {
            id: 'cite-7' as Identifier,
            label: 'API 接口文档',
            resourceUri: 'file://docs/api/auth.md',
            score: 0.88,
          },
        ],
      },
    ],
  },
  {
    id: 'session-3' as Identifier,
    repositoryId: 'docs-repo' as Identifier,
    title: '知识图谱构建流程',
    createdAt: new Date('2025-01-18T15:20:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-18T15:35:00Z').toISOString() as ISODateString,
    participants: ['user-1'].map((id) => id as Identifier),
    messages: [
      buildMessage({
        id: 'msg-5',
        role: 'user',
        content: '知识图谱是如何从代码文档构建的？',
        createdAt: new Date('2025-01-18T15:21:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-6',
          role: 'assistant',
          content:
            '知识图谱构建分为以下几个步骤：\n\n1. **代码扫描**: 使用 AST 解析器扫描源代码，提取函数、类、变量等实体\n2. **关系分析**: 分析调用关系、继承关系、依赖关系等\n3. **文档解析**: 解析 JSDoc、注释和 README 文件\n4. **实体识别**: 识别知识点、概念、技术栈等\n5. **图谱构建**: 在 Neo4j 中创建节点和关系\n6. **索引优化**: 建立全文搜索和向量索引\n\n整个流程约需 10-15 分钟，支持增量更新。',
          createdAt: new Date('2025-01-18T15:21:30Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-8' as Identifier,
            label: '图谱构建管道 GraphBuilder',
            resourceUri: 'file://src/graph/builder.ts',
            score: 0.95,
          },
          {
            id: 'cite-9' as Identifier,
            label: 'AST 解析器配置',
            resourceUri: 'file://src/parsers/ast-parser.ts',
            score: 0.92,
          },
          {
            id: 'cite-10' as Identifier,
            label: 'Neo4j 数据模型定义',
            resourceUri: 'file://src/models/graph-schema.ts',
            score: 0.9,
          },
        ],
      },
    ],
  },
  {
    id: 'session-4' as Identifier,
    repositoryId: 'backend-repo' as Identifier,
    title: '数据库查询性能优化',
    createdAt: new Date('2025-01-18T10:15:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-18T10:30:00Z').toISOString() as ISODateString,
    participants: ['user-1'].map((id) => id as Identifier),
    messages: [
      buildMessage({
        id: 'msg-7',
        role: 'user',
        content: '如何优化知识检索的查询性能？',
        createdAt: new Date('2025-01-18T10:16:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-8',
          role: 'assistant',
          content:
            '针对知识检索查询性能优化，建议采用以下策略：\n\n1. **索引优化**：\n   - 为常用查询字段创建复合索引\n   - 使用全文索引支持模糊匹配\n   - 建立向量索引支持语义搜索\n\n2. **查询优化**：\n   - 使用 Cypher 的 PROFILE 分析查询计划\n   - 避免笛卡尔积和深度遍历\n   - 合理使用 LIMIT 和 SKIP\n\n3. **缓存策略**：\n   - 对热点查询结果进行 Redis 缓存\n   - 实现查询结果的预计算\n   - 使用 CDN 缓存静态知识内容\n\n4. **分片策略**：\n   - 按知识域对图进行分片\n   - 实现读写分离\n\n经过这些优化，查询响应时间可以从平均 2s 降低到 200ms。',
          createdAt: new Date('2025-01-18T10:16:45Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-11' as Identifier,
            label: '查询优化器 QueryOptimizer',
            resourceUri: 'file://src/optimizers/query-optimizer.ts',
            score: 0.93,
          },
          {
            id: 'cite-12' as Identifier,
            label: '缓存管理器 CacheManager',
            resourceUri: 'file://src/cache/redis-manager.ts',
            score: 0.89,
          },
          {
            id: 'cite-13' as Identifier,
            label: '性能基准测试报告',
            resourceUri: 'file://benchmarks/query-performance.md',
            score: 0.87,
          },
        ],
      },
    ],
  },
  {
    id: 'session-5' as Identifier,
    repositoryId: 'devops-repo' as Identifier,
    title: '部署配置问题排查',
    createdAt: new Date('2025-01-17T14:45:00Z').toISOString() as ISODateString,
    updatedAt: new Date('2025-01-17T15:00:00Z').toISOString() as ISODateString,
    participants: ['user-1'].map((id) => id as Identifier),
    messages: [
      buildMessage({
        id: 'msg-9',
        role: 'user',
        content: '生产环境部署失败，提示 Neo4j 连接超时',
        createdAt: new Date('2025-01-17T14:46:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-10',
          role: 'assistant',
          content:
            'Neo4j 连接超时通常由以下几个原因导致：\n\n1. **网络配置**：\n   - 检查防火墙规则是否开放 7474 (HTTP) 和 7687 (Bolt) 端口\n   - 验证 VPC 安全组配置\n   - 确认负载均衡器健康检查配置\n\n2. **Neo4j 服务状态**：\n   - 检查 Neo4j 服务是否正常运行：`systemctl status neo4j`\n   - 查看日志：`tail -f /var/log/neo4j/neo4j.log`\n   - 验证内存配置是否充足\n\n3. **连接池配置**：\n   - 调整连接超时时间：`connection.timeout=30s`\n   - 增加最大连接数：`connection.pool.max_size=50`\n   - 配置连接重试策略\n\n建议先检查网络连通性，然后逐步排查服务状态。',
          createdAt: new Date('2025-01-17T14:46:40Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-14' as Identifier,
            label: 'Docker Compose 配置',
            resourceUri: 'file://docker-compose.yml',
            score: 0.94,
          },
          {
            id: 'cite-15' as Identifier,
            label: 'Neo4j 部署文档',
            resourceUri: 'file://docs/deployment/neo4j-setup.md',
            score: 0.91,
          },
          {
            id: 'cite-16' as Identifier,
            label: '生产环境配置检查清单',
            resourceUri: 'file://checklists/production-deployment.md',
            score: 0.88,
          },
        ],
      },
      buildMessage({
        id: 'msg-11',
        role: 'user',
        content:
          '根据 query_id=graph-query-neo4j 的结果，想继续确认缓存设置是否也会影响连接。',
        createdAt: new Date('2025-01-17T14:49:00Z').toISOString(),
      }),
      {
        ...buildMessage({
          id: 'msg-12',
          role: 'assistant',
          content:
            '继续沿用上一轮上下文（query_id=graph-query-neo4j）：建议检查连接池缓存大小与空闲连接回收时间，避免长时间占用导致连接假死。',
          createdAt: new Date('2025-01-17T14:49:25Z').toISOString(),
        }),
        citations: [
          {
            id: 'cite-17' as Identifier,
            label: '连接池配置说明',
            resourceUri: 'file://docs/deployment/connection-pool.md',
            score: 0.9,
          },
        ],
      },
    ],
  },
]

export const ragFixtures = {
  sessions,
}
