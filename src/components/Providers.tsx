"use client"
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { useEffect } from 'react'

function HtmlLangSync({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])
  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <HtmlLangSync>
        {children}
      </HtmlLangSync>
    </LanguageProvider>
  )
}
