import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeQueryPage } from '@/pages/user/knowledge-query'

export const Route = createFileRoute('/_authenticated/knowledge-graph-query')({
  component: KnowledgeQueryPage,
})
