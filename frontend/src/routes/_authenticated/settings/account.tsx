import { createFileRoute } from '@tanstack/react-router'
import { SettingsAccount } from '@/components/ragApp/settings/account-index'

export const Route = createFileRoute('/_authenticated/settings/account')({
  component: SettingsAccount,
})
