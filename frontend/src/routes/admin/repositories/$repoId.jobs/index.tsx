import { createFileRoute } from '@tanstack/react-router'
import { JobListPage } from '@/pages/admin/repository-jobs'

export const Route = createFileRoute('/admin/repositories/$repoId/jobs/')({
  component: JobListPage,
})
