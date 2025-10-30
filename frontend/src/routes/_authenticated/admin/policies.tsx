import { createFileRoute } from '@tanstack/react-router'
import { PoliciesPage } from '@/features/admin'

export const Route = createFileRoute('/_authenticated/admin/policies')({
  component: PoliciesPage,
})
