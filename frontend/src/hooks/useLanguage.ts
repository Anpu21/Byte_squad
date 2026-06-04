import { useCallback, useEffect, useState } from 'react'
import i18n from '@/i18n'
import {
  LANG_STORAGE_KEY,
  isSupportedLanguage,
  type AppLanguage,
} from '@/i18n/config'

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY)
  if (isSupportedLanguage(stored)) return stored
  return isSupportedLanguage(i18n.language) ? i18n.language : 'en'
}

/**
 * Read/set the active UI language. Mirrors `useTheme` — localStorage is the
 * source of truth (i18next's detector also caches there), `<html lang>` is kept
 * in sync, and a cross-tab `storage` listener keeps open tabs aligned.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    readStoredLanguage(),
  )

  useEffect(() => {
    void i18n.changeLanguage(language)
    document.documentElement.setAttribute('lang', language)
    window.localStorage.setItem(LANG_STORAGE_KEY, language)
  }, [language])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && isSupportedLanguage(e.newValue)) {
        setLanguageState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setLanguage = useCallback(
    (next: AppLanguage) => setLanguageState(next),
    [],
  )

  return { language, setLanguage }
}
