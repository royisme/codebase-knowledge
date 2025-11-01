import type { Repository } from '@/types/repository'

// 辅助函数：生成多样化的仓库数据
function generateRepository(index: number): Repository {
  const languages: Record<string, number>[] = [
    { python: 80, typescript: 15, javascript: 5 },
    { typescript: 85, javascript: 10, html: 5 },
    { python: 95, sql: 5 },
    { go: 100 },
    { java: 100 },
    { kotlin: 70, java: 30 },
    { rust: 100 },
    { typescript: 92, javascript: 8 },
    { php: 75, javascript: 25 },
    { cpp: 60, python: 40 },
    { scala: 100 },
    { vue: 50, typescript: 50 },
  ]

  const repoNames = [
    'Core API',
    'Frontend App',
    'Data Pipeline',
    'Microservice Utils',
    'Legacy System',
    'Mobile Backend',
    'Analytics Engine',
    'Payment Gateway',
    'Auth Service',
    'Notification Service',
    'Content Management',
    'Search Engine',
    'Image Processing',
    'Video Streaming',
    'Logging Service',
    'Metrics Collector',
    'Cache Manager',
    'Config Server',
    'Service Mesh',
    'API Gateway',
    'Load Balancer',
    'Workflow Engine',
    'Message Queue',
    'Event Bus',
    'Scheduler Service',
    'Backup Service',
    'Monitoring Dashboard',
    'Admin Portal',
    'Customer Portal',
    'Report Generator',
    'Export Service',
    'Import Service',
    'Validation Service',
    'Transformation Service',
    'Aggregation Service',
    'Sync Service',
    'Replication Service',
    'Archive Service',
    'Compression Service',
    'Encryption Service',
    'Key Management',
    'Certificate Service',
    'Token Service',
    'Session Manager',
    'Identity Provider',
    'Access Control',
    'Permission Service',
    'Audit Logger',
    'Compliance Checker',
    'Risk Assessment',
    'Fraud Detection',
    'ML Training',
    'Model Service',
    'Feature Store',
    'A/B Testing',
    'Email Service',
    'SMS Gateway',
    'Push Notification',
    'Webhook Manager',
    'Rate Limiter',
    'Circuit Breaker',
    'Health Check',
    'Service Discovery',
    'Config Watcher',
    'Secret Manager',
  ]

  const descriptions = [
    '核心服务',
    '前端应用',
    '数据处理',
    '工具库',
    '遗留系统',
    '后端服务',
    '分析引擎',
    '网关服务',
    '认证服务',
    '通知服务',
    '内容管理',
    '搜索引擎',
    '图像处理',
    '视频服务',
    '日志服务',
    '指标采集',
    '缓存管理',
    '配置中心',
    '服务网格',
    'API网关',
  ]

  const statuses: Array<'indexed' | 'indexing' | 'pending_index' | 'failed'> =
    index % 20 === 0
      ? ['indexing', 'pending_index', 'failed', 'indexed']
      : ['indexed']

  const status = statuses[index % 4] || 'indexed'
  const hasMetadata = status === 'indexed' || status === 'indexing'

  const langSet = languages[index % languages.length]
  const totalFiles = 50 + ((index * 7) % 200)
  const totalFunctions = totalFiles * 2 + ((index * 5) % 300)

  const daysAgo = index % 15
  const baseDate = new Date('2025-10-31')
  baseDate.setDate(baseDate.getDate() - daysAgo)

  return {
    id: `repo-${String(index).padStart(3, '0')}-${Math.random().toString(36).substring(2, 15)}`,
    name:
      repoNames[index % repoNames.length] +
      (index >= repoNames.length
        ? ` ${Math.floor(index / repoNames.length) + 1}`
        : ''),
    description: descriptions[index % descriptions.length],
    source_type: 'code',
    connection_config: {
      repo_url: `https://github.com/example/repo-${index}`,
      branch: index % 3 === 0 ? 'develop' : 'main',
      auth_type: index % 2 === 0 ? 'token' : 'none',
      include_patterns: ['*.py', '*.ts', '*.js', '*.go', '*.java'],
      exclude_patterns: ['node_modules/*', 'target/*', '__pycache__/*'],
      max_file_size_kb: 500,
    },
    source_metadata: hasMetadata
      ? {
          last_commit_sha: Math.random().toString(36).substring(2, 14),
          total_files: totalFiles,
          total_functions: totalFunctions,
          languages: langSet,
          graph_nodes: totalFiles * 3,
          graph_edges: totalFunctions * 2,
          index_version: `v1.${index % 5}.0`,
        }
      : undefined,
    is_active: index % 15 !== 0,
    last_synced_at: hasMetadata ? baseDate.toISOString() : undefined,
    created_at: new Date(
      baseDate.getTime() - index * 24 * 60 * 60 * 1000
    ).toISOString(),
    updated_at: baseDate.toISOString(),
  }
}

// 生成 65 个仓库数据
export const mockRepositories: Repository[] = Array.from(
  { length: 65 },
  (_, i) => generateRepository(i)
)
