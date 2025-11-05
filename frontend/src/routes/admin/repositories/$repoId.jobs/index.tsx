import { createFileRoute } from '@tanstack/react-router'
import { JobListPage } from '@/features/repository-management/pages/JobListPage'

export const Route = createFileRoute('/admin/repositories/$repoId/jobs/')({
  component: JobListPage,
})
