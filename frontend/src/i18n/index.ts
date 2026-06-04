import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources } from './resources'
import {
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
} from './config'

// Initialised once on import (side-effect import in main.tsx, before React
// mounts). Resources are bundled, so there's nothing async to suspend on —
// `useSuspense: false` keeps us from adding a Suspense boundary around the app.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'common',
    ns: [...NAMESPACES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  })

export default i18n
