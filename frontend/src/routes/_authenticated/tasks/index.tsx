import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/pages/user/tasks'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: Tasks,
})
