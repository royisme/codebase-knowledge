import type {
  Identifier,
  ISODateString,
  RagMessage,
  RagSession,
} from '@/types'

const buildMessage = (input: {
  id: string
  role: RagMessage['role']
  content: string
  createdAt: string
}): RagMessage => ({
  id: input.id as Identifier,
  role: input.role,
  content: input.content,
  createdAt: input.createdAt as ISODateString,
})

const session: RagSession = {
  id: 'session-1' as Identifier,
  repositoryId: 'source-1' as Identifier,
  title: '上线回归说明',
  createdAt: new Date('2025-01-19T02:00:00Z').toISOString() as ISODateString,
  updatedAt: new Date('2025-01-19T02:10:00Z').toISOString() as ISODateString,
  participants: ['user-1', 'user-2'].map((id) => id as Identifier),
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
          '最近一次失败发生在 2025-01-18T23:10Z，原因是 Neo4j 写入超时。已自动重试成功。',
        createdAt: new Date('2025-01-19T02:01:20Z').toISOString(),
      }),
      citations: [
        {
          id: 'cite-1' as Identifier,
          label: '任务日志 #task-failed',
          resourceUri: 'neo4j://tasks/task-failed',
          score: 0.82,
        },
      ],
    },
  ],
}

export const ragFixtures = {
  session,
}
