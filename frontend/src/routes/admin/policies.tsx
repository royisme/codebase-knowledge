import { createFileRoute } from '@tanstack/react-router'
import { PoliciesPage } from '@/pages/admin/policies'

export const Route = createFileRoute('/admin/policies')({
  component: PoliciesPage,
})
