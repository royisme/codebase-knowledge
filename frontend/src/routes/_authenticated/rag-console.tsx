import { createFileRoute } from '@tanstack/react-router'
import { RAGConsole } from '@/pages/shared/rag-console'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

function RAGConsolePage() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className='h-[calc(100vh-4rem)]'>
        <RAGConsole />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/rag-console')({
  component: RAGConsolePage,
})
