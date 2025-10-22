import { useLanguage } from '@/contexts/LanguageContext'
import { messages as en } from './en'
import { messages as bg } from './bg'

export type Messages = typeof en

const dict: Record<'en'|'bg', Messages> = { en, bg }

function get(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? path
}

export function useI18n() {
  const { language } = useLanguage()
  const msgs = dict[language]
  return {
    t: (key: keyof Messages | string) => get(msgs, key as string),
    language,
  }
}
