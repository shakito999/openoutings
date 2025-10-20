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
      className="mt-4 sm:mt-0 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30"
    >
      Редактирай профил
    </Link>
  )
}
