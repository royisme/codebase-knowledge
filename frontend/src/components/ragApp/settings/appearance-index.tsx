import { AppearanceForm } from '@/components/ragApp/settings/appearance-form'
import { ContentSection } from '@/components/ragApp/settings/content-section'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Appearance'
      desc='Customize the appearance of the app. Automatically switch between day
          and night themes.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
