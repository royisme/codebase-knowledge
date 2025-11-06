import { Outlet, useLocation, Link } from '@tanstack/react-router'
import { generateBreadcrumbs } from '@/config/user-routes-meta'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { userSidebarData } from './data/user-sidebar-data'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const location = useLocation()
  const currentPath = location.pathname

  // 生成面包屑导航数据
  const breadcrumbs = generateBreadcrumbs(currentPath)

  return (
    <div data-theme='user'>
      <SearchProvider>
        <LayoutProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <SkipToMain />
            <AppSidebar data={userSidebarData} />
            <SidebarInset
              className={cn(
                // Set content container, so we can use container queries
                '@container/content',

                // If layout is fixed, set the height
                // to 100svh to prevent overflow
                'has-[[data-layout=fixed]]:h-svh',

                // If layout is fixed and sidebar is inset,
                // set the height to 100svh - spacing (total margins) to prevent overflow
                'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]',

                // 添加页面容器样式 - 固定高度，内部滚动
                'flex h-screen flex-col'
              )}
            >
              <main className='flex-1 overflow-y-auto'>
                <div className='space-y-6 p-6'>
                  {/* 面包屑导航 */}
                  {breadcrumbs.length > 1 && (
                    <Breadcrumb>
                      <BreadcrumbList>
                        {breadcrumbs.map((item, index) => {
                          const isLast = index === breadcrumbs.length - 1

                          return (
                            <div key={item.label} className='flex items-center'>
                              {index > 0 && <BreadcrumbSeparator />}
                              <BreadcrumbItem>
                                {isLast || !item.href ? (
                                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                  <BreadcrumbLink asChild>
                                    <Link to={item.href}>{item.label}</Link>
                                  </BreadcrumbLink>
                                )}
                              </BreadcrumbItem>
                            </div>
                          )
                        })}
                      </BreadcrumbList>
                    </Breadcrumb>
                  )}

                  {/* 页面内容 */}
                  {children ?? <Outlet />}
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </LayoutProvider>
      </SearchProvider>
    </div>
  )
}
