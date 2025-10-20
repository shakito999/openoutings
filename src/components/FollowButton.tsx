"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface FollowButtonProps {
  userId: string
  currentUserId?: string
}

export default function FollowButton({ userId, currentUserId: serverUserId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(serverUserId)

  useEffect(() => {
    // Get current user client-side if not provided by server
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id)
      console.log('FollowButton user check:', { userId, currentUserId: user?.id, isOwn: userId === user?.id })
      
      if (user?.id && user.id !== userId) {
        checkFollowStatus(user.id)
      }
    })
    
    loadFollowerCount()
  }, [userId])

  async function checkFollowStatus(currentId: string) {
    const { data } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', currentId)
      .eq('following_id', userId)
      .single()
    
    setIsFollowing(!!data)
  }

  async function loadFollowerCount() {
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
    
    setFollowerCount(count || 0)
  }

  async function toggleFollow() {
    if (!currentUserId || loading) return
    
    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
        
        setIsFollowing(false)
        setFollowerCount(prev => prev - 1)
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          })
        
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  // Always render something so we can see if component is mounting
  console.log('Rendering FollowButton:', { userId, currentUserId, isFollowing, followerCount })
  
  // Show follower count for own profile
  if (currentUserId === userId) {
    return (
      <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
      </div>
    )
  }

  // Show follow button for logged-in users viewing others' profiles
  if (!currentUserId) {
    return (
      <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={toggleFollow}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30'
        }`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            ...
          </span>
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </button>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
      </div>
    </div>
  )
}
