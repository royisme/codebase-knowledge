import { createFileRoute } from '@tanstack/react-router'
import { RepositoryListPage } from '@/pages/admin/repositories'

export const Route = createFileRoute('/admin/repositories/')({
  component: RepositoryListPage,
})
