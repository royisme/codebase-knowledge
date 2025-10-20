import { Link, Outlet, useLocation } from '@tanstack/react-router'

import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { cn } from '@/lib/utils'

const ADMIN_NAV_ITEMS = [
  {
    label: '知识源',
    to: '/admin/sources',
  },
  {
    label: 'RBAC 策略',
    to: '/admin/rbac',
  },
]

export function AdminLayout() {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center gap-2 sm:gap-3'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6 pb-12'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-1'>
            <h2 className='text-2xl font-bold tracking-tight'>管理后台</h2>
            <p className='text-muted-foreground text-sm sm:text-base'>
              维护知识源、角色策略等配置，确保治理有序。
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 border-b border-border/80 pb-2 text-sm'>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <Outlet />
      </Main>
    </>
  )
}
