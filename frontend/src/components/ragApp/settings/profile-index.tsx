import { ContentSection } from '@/components/ragApp/settings/content-section'
import { ProfileForm } from '@/components/ragApp/settings/profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profile'
      desc='This is how others will see you on the site.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
