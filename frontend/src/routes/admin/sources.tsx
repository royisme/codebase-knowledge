import { createFileRoute } from '@tanstack/react-router'
import { UnifiedKnowledgeSourcesPage } from '@/pages/admin/unified-knowledge-sources'

export const Route = createFileRoute('/admin/sources')({
  component: UnifiedKnowledgeSourcesPage,
})
