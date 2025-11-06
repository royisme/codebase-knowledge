import { createFileRoute } from '@tanstack/react-router'
import { SettingsAppearance } from '@/components/ragApp/settings/appearance-index'

export const Route = createFileRoute('/_authenticated/settings/appearance')({
  component: SettingsAppearance,
})
