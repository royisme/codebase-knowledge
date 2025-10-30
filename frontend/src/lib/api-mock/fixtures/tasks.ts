import type { Identifier, ParseTask, TaskStatus } from '@/types'

const buildTask = (overrides: Partial<ParseTask>): ParseTask => {
  const base: ParseTask = {
    id: `task-${Math.random().toString(36).slice(2, 8)}` as Identifier,
    sourceId: 'source-1' as Identifier,
    status: 'queued',
    createdAt: new Date(
      '2025-01-16T06:00:00Z'
    ).toISOString() as ParseTask['createdAt'],
    updatedAt: new Date(
      '2025-01-16T06:00:00Z'
    ).toISOString() as ParseTask['updatedAt'],
    createdBy: 'user-1' as Identifier,
    updatedBy: 'user-1' as Identifier,
  }
  return { ...base, ...overrides }
}

const makeProgressTask = (
  status: TaskStatus,
  completed: number,
  total: number
): ParseTask => {
  const percentage = Math.round((completed / total) * 100)
  return buildTask({
    id: `task-${status}` as Identifier,
    status,
    progress: {
      total,
      completed,
      percentage,
      etaSeconds: status === 'running' ? 120 : undefined,
    },
  })
}

const tasks: ParseTask[] = [
  makeProgressTask('running', 45, 100),
  makeProgressTask('queued', 0, 100),
  buildTask({
    id: 'task-failed' as Identifier,
    status: 'failed',
    errorMessage: 'Connection timeout while accessing repository.',
  }),
  buildTask({
    id: 'task-succeeded' as Identifier,
    status: 'succeeded',
    startedAt: new Date(
      '2025-01-15T07:00:00Z'
    ).toISOString() as ParseTask['startedAt'],
    finishedAt: new Date(
      '2025-01-15T07:05:00Z'
    ).toISOString() as ParseTask['finishedAt'],
  }),
]

export const taskFixtures = {
  list: tasks,
}
