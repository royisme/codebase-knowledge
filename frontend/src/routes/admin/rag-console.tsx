import { createFileRoute } from '@tanstack/react-router'
import { RAGConsole } from '@/pages/shared/rag-console'

export const Route = createFileRoute('/admin/rag-console')({
  component: RAGConsole,
})
