import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import { profileService } from '@/services/profile.service'
import { useLanguage } from '@/hooks/useLanguage'
import type { AppLanguage } from '@/i18n/config'

/**
 * Language control for the profile switcher. Applies the choice instantly
 * (localStorage + i18n via {@link useLanguage}) and, for an authenticated
 * user, persists it to their profile so it follows them across devices. The
 * persistence is best-effort — the local switch never blocks on the network,
 * and the optimistic `setUser` keeps the cached auth user in sync.
 */
export function useLanguagePreference() {
  const { language, setLanguage } = useLanguage()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  const changeLanguage = useCallback(
    (next: AppLanguage) => {
      setLanguage(next)
      if (isAuthenticated) {
        dispatch(setUser({ language: next }))
        void profileService.updateProfile({ language: next }).catch(() => {})
      }
    },
    [setLanguage, dispatch, isAuthenticated],
  )

  return { language, setLanguage: changeLanguage }
}
