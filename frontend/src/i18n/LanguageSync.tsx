import { useEffect, useRef } from 'react'
import i18n from '@/i18n'
import { useAppSelector } from '@/store/hooks'
import { isSupportedLanguage, LANG_STORAGE_KEY } from '@/i18n/config'

/**
 * Applies the authenticated user's persisted language ONCE per login (or boot,
 * via redux-persist) so the profile is the cross-device source of truth — then
 * stays out of the way.
 *
 * It talks to i18next directly rather than going through `useLanguage`, so it
 * holds no language state of its own that could fight the profile
 * `LanguageSwitcher`. And it syncs only the first time a user id appears
 * (`syncedFor`), so a later profile refetch updating `auth.user.language`
 * can't revert the language the cashier just picked. Renders nothing.
 */
export function LanguageSync(): null {
  const userId = useAppSelector((s) => s.auth.user?.id)
  const profileLanguage = useAppSelector((s) => s.auth.user?.language)
  const syncedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) {
      syncedFor.current = null // logged out → re-sync on the next login
      return
    }
    if (syncedFor.current === userId) return
    syncedFor.current = userId
    if (
      isSupportedLanguage(profileLanguage) &&
      i18n.language !== profileLanguage
    ) {
      void i18n.changeLanguage(profileLanguage)
      window.localStorage.setItem(LANG_STORAGE_KEY, profileLanguage)
      document.documentElement.setAttribute('lang', profileLanguage)
    }
  }, [userId, profileLanguage])

  return null
}
