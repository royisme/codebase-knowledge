import { createFileRoute } from '@tanstack/react-router'
import { RbacDashboard } from '@/pages/admin/rbac'

export const Route = createFileRoute('/admin/rbac')({
  component: RbacDashboard,
})
