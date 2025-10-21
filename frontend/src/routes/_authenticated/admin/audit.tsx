import { createFileRoute } from '@tanstack/react-router'
import { AuditPage } from '@/features/admin'

export const Route = createFileRoute('/_authenticated/admin/audit')({
  component: AuditPage,
})