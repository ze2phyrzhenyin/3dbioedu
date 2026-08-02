import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LanguageContext,
  htmlLangByLanguage,
  isLanguage,
} from './languageContext'
import type { Language } from './types'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

  if (isLanguage(storedLanguage)) return storedLanguage

  const browserLanguage = window.navigator.language.toLowerCase()
  if (browserLanguage.startsWith('zh')) return 'zh'
  if (browserLanguage.startsWith('fr')) return 'fr'
  return DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((currentLanguage) =>
      currentLanguage === 'en'
        ? 'fr'
        : currentLanguage === 'fr'
          ? 'zh'
          : 'en',
    )
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = htmlLangByLanguage[language]
    document.documentElement.dir = 'ltr'
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
