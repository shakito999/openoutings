"use client"

import { usePathname } from 'next/navigation'
import Footer from '@/components/Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  if (pathname?.startsWith('/messages')) return null
  return <Footer />
}
