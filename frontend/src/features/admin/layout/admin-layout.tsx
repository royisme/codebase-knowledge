import { Outlet } from '@tanstack/react-router'

import { Main } from '@/components/layout/main'

export function AdminLayout() {
  return (
    <Main className='flex flex-1 flex-col gap-6 pb-12'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='text-2xl font-bold tracking-tight'>管理后台</h2>
          <p className='text-muted-foreground text-sm sm:text-base'>
            维护知识源、角色策略等配置，确保治理有序。
          </p>
        </div>
      </div>

      <Outlet />
    </Main>
  )
}
