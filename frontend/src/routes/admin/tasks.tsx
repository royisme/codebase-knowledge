import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/pages/user/tasks'

export const Route = createFileRoute('/admin/tasks')({
  component: Tasks,
})
