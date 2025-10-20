import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeSourcesPage } from '@/features/admin/knowledge-sources'

export const Route = createFileRoute('/_authenticated/admin/sources')({
  component: KnowledgeSourcesPage,
})
