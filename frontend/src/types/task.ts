import type { AuditMetadata, Identifier, ISODateString } from './common'

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'

export interface TaskProgress {
  total: number
  completed: number
  percentage: number
  etaSeconds?: number
}

export interface ParseTask extends AuditMetadata {
  id: Identifier
  sourceId: Identifier
  status: TaskStatus
  progress?: TaskProgress
  startedAt?: ISODateString
  finishedAt?: ISODateString
  errorMessage?: string
}

export interface RetryTaskPayload {
  taskId: Identifier
}
