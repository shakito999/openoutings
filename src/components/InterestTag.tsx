"use client"
import Link from 'next/link'
import { getInterestDisplay } from '@/lib/interestsBilingual'
import { useLanguage } from '@/contexts/LanguageContext'

export default function InterestTag({ interest }: { interest: string }) {
  const { language } = useLanguage()
  
  return (
    <Link
      href={`/events?interest=${encodeURIComponent(interest)}`}
      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all hover:scale-105"
    >
      {getInterestDisplay(interest, language)}
    </Link>
  )
}
