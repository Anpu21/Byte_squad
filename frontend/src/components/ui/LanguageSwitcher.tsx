import { useTranslation } from 'react-i18next'
import Segmented from '@/components/ui/Segmented'
import { useLanguagePreference } from '@/hooks/useLanguagePreference'
import type { AppLanguage } from '@/i18n/config'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguagePreference()
  const { t } = useTranslation('profile')

  return (
    <Segmented<AppLanguage>
      value={language}
      onChange={setLanguage}
      options={[
        { value: 'en', label: t('language.english') },
        { value: 'ta', label: t('language.tamil') },
      ]}
    />
  )
}
