import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/user/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})
