import { createFileRoute } from '@tanstack/react-router'
import { RepositoryListPage } from '@/features/repository-management/pages/RepositoryListPage'

export const Route = createFileRoute('/admin/repositories/')({
  component: RepositoryListPage,
})
