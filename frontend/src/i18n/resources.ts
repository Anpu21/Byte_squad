import enCommon from './locales/en/common.json'
import enProfile from './locales/en/profile.json'
import taCommon from './locales/ta/common.json'
import taProfile from './locales/ta/profile.json'

export const resources = {
  en: { common: enCommon, profile: enProfile },
  ta: { common: taCommon, profile: taProfile },
} as const
