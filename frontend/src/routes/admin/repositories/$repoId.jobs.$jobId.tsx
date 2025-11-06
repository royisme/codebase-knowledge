import { createFileRoute } from '@tanstack/react-router'
import { JobDetailPage } from '@/pages/admin/repository-job-detail'

export const Route = createFileRoute('/admin/repositories/$repoId/jobs/$jobId')(
  {
    component: JobDetailPage,
  }
)
