import { faker } from '@faker-js/faker'

import type {
  BulkOperationPayload,
  BulkOperationResponse,
  Identifier,
  ISODateString,
  KnowledgeSource,
  KnowledgeSourceListParams,
  KnowledgeSourceStatus,
  PaginatedResponse,
  ParserConfig,
  CreateKnowledgeSourcePayload,
  UpdateKnowledgeSourcePayload,
} from '@/types'

const DEFAULT_PARSER_CONFIG: ParserConfig = {
  languages: ['python', 'typescript', 'sql'],
  pathAllowList: ['backend/', 'apps/frontend/src/'],
  maxDepth: 8,
  enableIncrementalRefresh: true,
}

type MutableKnowledgeSource = KnowledgeSource & { deleted?: boolean }

let seed = faker.string.alphanumeric(6)
faker.seed(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))

let sources: MutableKnowledgeSource[] = createInitialSources()

function createInitialSources(): MutableKnowledgeSource[] {
  const createSource = (input: Partial<MutableKnowledgeSource>) => {
    const now = faker.date.recent()
    const createdAt = (faker.date.past({ years: 1 }) as Date).toISOString() as ISODateString
    const updatedAt = (now.toISOString() as ISODateString) ?? createdAt
    return {
      id: faker.string.uuid() as Identifier,
      name: faker.company.name(),
      repositoryUrl: `git@github.com:${faker.company.buzzNoun()}/${faker.helpers
        .arrayElement(['service', 'console', 'pipeline'])
        .toString()}-${faker.helpers.arrayElement(['core', 'admin', 'api'])}.git`,
      defaultBranch: faker.helpers.arrayElement(['main', 'develop', 'release']),
      credentialMode: faker.helpers.arrayElement(['ssh', 'https', 'token']),
      status: faker.helpers.arrayElement<KnowledgeSourceStatus>([
        'active',
        'syncing',
        'disabled',
        'error',
      ]),
      lastSyncedAt:
        Math.random() > 0.3
          ? (faker.date.recent({ days: 10 }).toISOString() as ISODateString)
          : undefined,
      lastTaskId:
        Math.random() > 0.5 ? (faker.string.uuid() as Identifier) : undefined,
      parserConfig: DEFAULT_PARSER_CONFIG,
      createdAt,
      updatedAt,
      createdBy: (faker.string.uuid() as Identifier) ?? ('user-1' as Identifier),
      updatedBy: (faker.string.uuid() as Identifier) ?? ('user-1' as Identifier),
      ...input,
    }
  }

  return [
    createSource({
      name: 'Core API Service',
      repositoryUrl: 'git@github.com:enterprise/core-api.git',
      defaultBranch: 'main',
      credentialMode: 'ssh',
      status: 'active',
      parserConfig: {
        ...DEFAULT_PARSER_CONFIG,
        languages: ['python', 'sql'],
        pathAllowList: ['backend/app/', 'backend/app/services/'],
      },
    }),
    createSource({
      name: 'Frontend Console',
      repositoryUrl: 'git@github.com:enterprise/frontend-console.git',
      defaultBranch: 'develop',
      credentialMode: 'token',
      status: 'syncing',
      parserConfig: {
        ...DEFAULT_PARSER_CONFIG,
        languages: ['typescript', 'tsx'],
        pathAllowList: ['apps/frontend/src/'],
      },
    }),
    createSource({
      name: 'Data Pipeline Worker',
      repositoryUrl: 'git@github.com:enterprise/pipeline-worker.git',
      status: 'error',
    }),
    createSource({
      name: 'Knowledge Graph Schema',
      repositoryUrl: 'git@github.com:enterprise/graph-schema.git',
      status: 'disabled',
    }),
    createSource({
      name: 'Observability Stack',
      repositoryUrl: 'git@github.com:enterprise/observability.git',
      status: 'active',
    }),
  ]
}

export function resetKnowledgeSourceFixtures() {
  sources = createInitialSources()
  seed = faker.string.alphanumeric(6)
  faker.seed(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
}

function matchSearch(source: KnowledgeSource, search?: string) {
  if (!search) return true
  const term = search.trim().toLowerCase()
  if (term.length === 0) return true

  return (
    source.name.toLowerCase().includes(term) ||
    source.repositoryUrl.toLowerCase().includes(term) ||
    source.defaultBranch.toLowerCase().includes(term)
  )
}

function matchStatus(
  source: KnowledgeSource,
  statuses?: KnowledgeSourceStatus[]
) {
  if (!statuses || statuses.length === 0) return true
  return statuses.includes(source.status)
}

export function listKnowledgeSourcesFixture(
  params?: KnowledgeSourceListParams
): PaginatedResponse<KnowledgeSource> {
  const page = Math.max(1, Number(params?.page ?? 1))
  const pageSize = Math.max(1, Number(params?.pageSize ?? 10))

  const filtered = sources.filter(
    (source) =>
      !source.deleted &&
      matchSearch(source, params?.search) &&
      matchStatus(source, params?.statuses)
  )

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = filtered.slice(start, end)

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
  }
}

export function createKnowledgeSourceFixture(
  payload: CreateKnowledgeSourcePayload
): KnowledgeSource {
  const now = new Date().toISOString() as ISODateString
  const entity: MutableKnowledgeSource = {
    id: faker.string.uuid() as Identifier,
    name: payload.name,
    repositoryUrl: payload.repositoryUrl,
    defaultBranch: payload.defaultBranch,
    credentialMode: payload.credentialMode,
    status: 'active',
    parserConfig: payload.parserConfig,
    createdAt: now,
    updatedAt: now,
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  }
  sources.unshift(entity)
  return entity
}

export function updateKnowledgeSourceFixture(
  id: Identifier,
  payload: UpdateKnowledgeSourcePayload
): KnowledgeSource | undefined {
  const target = sources.find((item) => item.id === id && !item.deleted)
  if (!target) return undefined

  Object.assign(target, payload, {
    updatedAt: new Date().toISOString() as ISODateString,
    updatedBy: 'user-1' as Identifier,
  })
  return target
}

export function deleteKnowledgeSourceFixture(id: Identifier): boolean {
  const target = sources.find((item) => item.id === id && !item.deleted)
  if (!target) return false
  target.deleted = true
  return true
}

export function triggerKnowledgeSourceSyncFixture(id: Identifier) {
  const target = sources.find((item) => item.id === id && !item.deleted)
  if (!target) return undefined

  target.status = 'syncing'
  target.lastTaskId = faker.string.uuid() as Identifier
  target.updatedAt = new Date().toISOString() as ISODateString
  return target
}

export function bulkOperationFixture(payload: BulkOperationPayload): BulkOperationResponse {
  const { ids, operation } = payload
  const updated: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const id of ids) {
    const target = sources.find((item) => item.id === id && !item.deleted)
    if (!target) {
      failed.push({ id, error: '知识源不存在或已删除' })
      continue
    }

    try {
      switch (operation) {
        case 'enable':
          target.status = 'active'
          target.updatedAt = new Date().toISOString() as ISODateString
          target.updatedBy = 'user-1' as Identifier
          updated.push(id)
          break
        case 'disable':
          target.status = 'disabled'
          target.updatedAt = new Date().toISOString() as ISODateString
          target.updatedBy = 'user-1' as Identifier
          updated.push(id)
          break
        case 'sync':
          target.status = 'syncing'
          target.lastTaskId = faker.string.uuid() as Identifier
          target.updatedAt = new Date().toISOString() as ISODateString
          target.updatedBy = 'user-1' as Identifier
          updated.push(id)
          break
        default:
          failed.push({ id, error: '不支持的操作类型' })
      }
    } catch (error) {
      failed.push({ id, error: error instanceof Error ? error.message : '未知错误' })
    }
  }

  const message =
    failed.length === 0
      ? `成功${operation === 'enable' ? '启用' : operation === 'disable' ? '禁用' : '同步'} ${updated.length} 个知识源`
      : `部分操作失败：成功 ${updated.length} 个，失败 ${failed.length} 个`

  return {
    updated,
    failed,
    message,
  }
}
