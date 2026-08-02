import { createContext, useContext } from 'react'

import type { Language } from './types'

export const LANGUAGE_STORAGE_KEY = 'dbio-language'
export const DEFAULT_LANGUAGE: Language = 'en'

export const htmlLangByLanguage: Record<Language, string> = {
  en: 'en',
  fr: 'fr',
  zh: 'zh-CN',
}

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'fr' || value === 'zh'
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return context
}
