import { createFileRoute } from '@tanstack/react-router'
import { LdapAuth } from '@/pages/shared/auth/ldap'

export const Route = createFileRoute('/(auth)/ldap')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    company: typeof search.company === 'string' ? search.company : '',
  }),
  component: LdapAuth,
})
