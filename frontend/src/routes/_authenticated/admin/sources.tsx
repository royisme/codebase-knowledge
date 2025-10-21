import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeSourcesPage } from '@/features/admin/knowledge-sources'

const knowledgeSourcesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  search: z.string().optional().catch(''),
  statuses: z
    .array(
      z.union([
        z.literal('active'),
        z.literal('syncing'),
        z.literal('disabled'),
        z.literal('error'),
      ])
    )
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/admin/sources')({
  validateSearch: knowledgeSourcesSearchSchema,
  component: KnowledgeSourcesPage,
})
