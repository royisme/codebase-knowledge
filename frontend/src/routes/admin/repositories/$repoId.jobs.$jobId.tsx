import { createFileRoute } from '@tanstack/react-router'
import { JobDetailPage } from '@/features/repository-management/pages/JobDetailPage'

export const Route = createFileRoute('/admin/repositories/$repoId/jobs/$jobId')(
  {
    component: JobDetailPage,
  }
)
