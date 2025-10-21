import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AuditPage } from '@/features/admin'

const auditSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  search: z.string().optional().catch(''),
  statuses: z.array(z.enum(['success', 'failure'])).optional().catch([]),
  actions: z.array(z.enum(['assign_role', 'update_policy', 'create_policy', 'delete_policy', 'login_attempt', 'permission_denied'])).optional().catch([]),
  startDate: z.string().optional().catch(''),
  endDate: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/admin/audit')({
  validateSearch: auditSearchSchema,
  component: AuditPage,
})