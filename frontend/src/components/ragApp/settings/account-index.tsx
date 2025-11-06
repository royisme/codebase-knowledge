import { AccountForm } from '@/components/ragApp/settings/account-form'
import { ContentSection } from '@/components/ragApp/settings/content-section'

export function SettingsAccount() {
  return (
    <ContentSection
      title='账号设置'
      desc='更新您的账号信息，包括姓名、公司和部门。'
    >
      <AccountForm />
    </ContentSection>
  )
}
