"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'bg' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bg')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language
      if (saved === 'bg' || saved === 'en') {
        setLanguageState(saved)
      }
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const toggleLanguage = () => {
    const newLang = language === 'bg' ? 'en' : 'bg'
    setLanguage(newLang)
  }

  // Always provide context, even before mount
  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Return default value instead of throwing during SSR
    console.warn('useLanguage called outside LanguageProvider, using default')
    return {
      language: 'bg' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {}
    }
  }
  return context
}
