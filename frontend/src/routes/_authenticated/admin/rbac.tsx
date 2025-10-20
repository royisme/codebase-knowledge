import { createFileRoute } from '@tanstack/react-router'
import { RbacDashboard } from '@/features/admin'

export const Route = createFileRoute('/_authenticated/admin/rbac')({
  component: RbacDashboard,
})
