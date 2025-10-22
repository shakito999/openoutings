'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProfileEditButton from './ProfileEditButton'
import FollowButton from './FollowButton'
import ProfileLogoutButton from './ProfileLogoutButton'
import InterestTag from './InterestTag'

interface ProfileHeaderProps {
  profile: any
  profileId: string
  currentUserId?: string
  isOwnProfile: boolean
  interests: string[]
}

export default function ProfileHeader({
  profile,
  profileId,
  currentUserId,
  isOwnProfile,
  interests,
}: ProfileHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [clientCurrentUserId, setClientCurrentUserId] = useState<string | null>(null)
  const [isOwnProfileClient, setIsOwnProfileClient] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get current user on client side
    supabase.auth.getUser().then(({ data: { user } }) => {
      setClientCurrentUserId(user?.id ?? null)
      if (user?.id === profileId) {
        setIsOwnProfileClient(true)
      }
    })
  }, [profileId])

  // Helpers for displaying age and gender when allowed
  const computeAge = (birthDate?: string) => {
    if (!birthDate) return null
    const dob = new Date(birthDate)
    if (isNaN(dob.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age >= 0 ? age : null
  }

  const genderDisplay: Record<string, string> = {
    'male': 'Мъж',
    'female': 'Жена',
    'non-binary': 'Небинарен',
    'other': 'Друго',
    'prefer-not-to-say': ''
  }

  const showAge = Boolean(profile?.show_age && profile?.birth_date)
  const showGender = Boolean(profile?.show_gender && profile?.gender && profile?.gender !== 'prefer-not-to-say')
  const age = showAge ? computeAge(profile.birth_date) : null
  const genderText = showGender ? genderDisplay[profile.gender] ?? '' : ''

  if (!mounted) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
      {/* Cover Image */}
      <div className="h-48 relative overflow-hidden">
        {profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
      </div>

      <div className="px-8 pb-8">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col sm:flex-row sm:items-end -mt-12 md:-mt-8 lg:mt-0 mb-6 gap-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.full_name?.[0] || profile.username?.[0] || 'U'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.full_name || profile.username}
              </h1>
              {profile.username && (
                <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
              )}
              {(age !== null || genderText) && (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {age !== null && (
                    <span>{age} г.</span>
                  )}
                  {age !== null && genderText && <span>•</span>}
                  {genderText && (
                    <span>{genderText}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center ml-auto">
            <FollowButton userId={profileId} currentUserId={clientCurrentUserId || currentUserId} />
            <div className="flex gap-1">
              <ProfileEditButton profileId={profileId} serverIsOwn={isOwnProfileClient || isOwnProfile} />
              {isOwnProfileClient && <ProfileLogoutButton />}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Интереси
            </h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string) => (
                <InterestTag key={interest} interest={interest} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
