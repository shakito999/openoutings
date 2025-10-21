"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ProfileEditButton({ 
  profileId, 
  serverIsOwn 
}: { 
  profileId: string
  serverIsOwn: boolean 
}) {
  const [isOwn, setIsOwn] = useState(serverIsOwn)

  useEffect(() => {
    // Double-check on client side as fallback
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id === profileId) {
        setIsOwn(true)
      }
    })
  }, [profileId])

  if (!isOwn) return null

  return (
    <Link
      href="/profile/edit"
      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title="Редактирай профил"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </Link>
  )
}
