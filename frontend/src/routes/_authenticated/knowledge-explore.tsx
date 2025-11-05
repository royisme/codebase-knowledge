import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeExplorePage } from '@/pages/user/knowledge-explore'

export const Route = createFileRoute('/_authenticated/knowledge-explore')({
  component: KnowledgeExplorePage,
})
