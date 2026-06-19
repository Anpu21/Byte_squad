import { useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { useLanguage } from '@/hooks/useLanguage'
import { isSupportedLanguage } from '@/i18n/config'

/**
 * Applies the authenticated user's persisted language on login/boot so the
 * profile is the source of truth across devices. The auth user is rehydrated
 * by redux-persist, so this also covers reloads. Renders nothing.
 */
export function LanguageSync(): null {
  const profileLanguage = useAppSelector((s) => s.auth.user?.language)
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    if (isSupportedLanguage(profileLanguage) && profileLanguage !== language) {
      setLanguage(profileLanguage)
    }
  }, [profileLanguage, language, setLanguage])

  return null
}
