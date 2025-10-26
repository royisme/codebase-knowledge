import { createFileRoute } from '@tanstack/react-router'
import { LdapAuth } from '@/features/auth/ldap-auth'

export const Route = createFileRoute('/(auth)/ldap')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    company: typeof search.company === 'string' ? search.company : '',
  }),
  component: LdapAuth,
})
