import { useTranslation } from 'react-i18next'
import Segmented from '@/components/ui/Segmented'
import { useLanguage } from '@/hooks/useLanguage'
import type { AppLanguage } from '@/i18n/config'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
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
