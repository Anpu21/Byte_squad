import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export function AdminLanguageCard() {
  const { t } = useTranslation('profile')

  return (
    <div className="bg-surface border border-border rounded-md p-5 shadow-2xl space-y-3">
      <div>
        <div className="text-sm font-medium text-text-1">
          {t('language.title')}
        </div>
        <div className="text-xs text-text-2 mt-0.5">
          {t('language.description')}
        </div>
      </div>
      <LanguageSwitcher />
    </div>
  )
}
