import { createFileRoute } from '@tanstack/react-router'
import { Otp } from '@/features/auth/otp'

export const Route = createFileRoute('/(auth)/otp')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: Otp,
})
