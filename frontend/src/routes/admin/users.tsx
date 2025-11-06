import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AdminUsersPage } from '@/pages/admin/users'

const adminUsersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  statuses: z
    .array(
      z.union([
        z.literal('active'),
        z.literal('unverified'),
        z.literal('suspended'),
      ])
    )
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/admin/users')({
  validateSearch: adminUsersSearchSchema,
  component: AdminUsersPage,
})
