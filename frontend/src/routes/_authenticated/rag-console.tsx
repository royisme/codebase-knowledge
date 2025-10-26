import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ConfigDrawer } from '@/components/config-drawer'
import { RAGConsole } from '@/features/rag-console'

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
      <Main className="h-[calc(100vh-4rem)]">
        <RAGConsole />
      </Main>
    </>
  )
}

export const Route = createFileRoute('/_authenticated/rag-console')({
  component: RAGConsolePage,
})