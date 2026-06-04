export const SUPPORTED_LANGUAGES = ['en', 'ta'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const LANG_STORAGE_KEY = 'lp-lang'
export const NAMESPACES = ['common', 'profile'] as const

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return value === 'en' || value === 'ta'
}
