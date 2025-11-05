import { createFileRoute } from '@tanstack/react-router'
import { RAGConsole } from '@/features/rag-console'

export const Route = createFileRoute('/admin/rag-console')({
  component: RAGConsole,
})
