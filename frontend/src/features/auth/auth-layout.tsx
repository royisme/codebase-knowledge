import { Logo } from '@/assets/logo'
import { AssignmentInfo } from './assignment-info'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='bg-background text-foreground relative min-h-svh overflow-hidden transition-colors'>
      {/* 背景装饰 - 几何图形 */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* 大圆形1 */}
        <div className='bg-primary/20 dark:bg-primary/30 absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl' />
        {/* 大圆形2 */}
        <div className='absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-600/30' />
        {/* 网格背景 */}
        <div
          className='absolute inset-0 opacity-50'
          style={{
            maskImage:
              'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            background:
              'linear-gradient(to right, color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 30%, transparent) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />
        {/* 光晕效果 */}
        <div className='absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[radial-gradient(circle_at_center,var(--primary)/18,transparent_65%)] blur-3xl' />
      </div>

      <div className='relative container flex min-h-svh max-w-none items-center justify-center px-4 py-10'>
        <div className='grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12'>
          {/* 左侧 - 信息展示区 */}
          <div className='flex flex-col gap-8'>
            <div className='flex w-full justify-center lg:justify-start'>
              <div className='w-full max-w-md'>
                {/* Logo 和标题 */}
                <div className='mb-8 text-center lg:text-left'>
                  <div className='mb-4 flex items-center justify-center gap-3 lg:justify-start'>
                    <div className='from-primary shadow-primary/40 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br to-sky-500 shadow-lg'>
                      <Logo className='text-primary-foreground h-8 w-8' />
                    </div>
                    <h1 className='text-foreground text-2xl font-bold'>
                      CIT 知识图谱
                    </h1>
                  </div>
                  <p className='text-muted-foreground text-lg'>
                    企业级智能知识管理平台
                  </p>
                </div>

                {/* Assignment 信息卡片 */}
                <AssignmentInfo />

                {/* 特性展示 */}
                <div className='mt-8 grid gap-4'>
                  <div className='flex items-start gap-3'>
                    <div className='bg-primary/15 flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-sm'>
                      <svg
                        className='text-primary h-4 w-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className='text-foreground font-medium'>
                        智能知识检索
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        基于图谱的快速精准搜索
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/15 backdrop-blur-sm dark:bg-sky-500/20'>
                      <svg
                        className='h-4 w-4 text-sky-500 dark:text-sky-300'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className='text-foreground font-medium'>
                        企业级安全
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        多层权限控制和数据加密
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-sky-200/30 backdrop-blur-sm dark:bg-blue-500/20'>
                      <svg
                        className='h-4 w-4 text-blue-500 dark:text-blue-300'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className='text-foreground font-medium'>
                        可视化分析
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        直观的知识关系图谱展示
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 表单区域 */}
          <div className='mx-auto flex w-full flex-col justify-center'>
            <div className='group border-border/60 bg-card/80 hover:border-border hover:bg-card supports-[backdrop-filter]:bg-card/70 relative overflow-hidden rounded-2xl border p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:max-w-md'>
              {/* 卡片内部光晕 */}
              <div className='bg-primary/20 dark:bg-primary/30 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl transition-all duration-500 group-hover:scale-110' />
              <div className='absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl transition-all duration-500 group-hover:scale-110 dark:bg-sky-600/30' />

              <div className='relative'>
                <div className='mb-6 flex items-center justify-center'>
                  <div className='from-primary/20 rounded-xl bg-gradient-to-br to-sky-500/20 p-3 backdrop-blur-sm'>
                    <Logo className='text-primary h-8 w-8' />
                  </div>
                </div>
                {children}
              </div>
            </div>

            {/* 底部装饰文字 */}
            <p className='text-muted-foreground mt-8 text-center text-sm'>
              © 2025 CIT Corporation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
