'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { BuddyPreferences, PreferredGender } from '@/lib/types/buddyMatching'

export default function BuddyPreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [enabled, setEnabled] = useState(true)
  const [preferredAgeMin, setPreferredAgeMin] = useState<number | null>(null)
  const [preferredAgeMax, setPreferredAgeMax] = useState<number | null>(null)
  const [preferredGender, setPreferredGender] = useState<PreferredGender>('any')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (userId) {
      loadPreferences()
    }
  }, [userId])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error:', error)
        router.push('/login')
        return
      }

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('buddy_preferences')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to load preferences:', error)
        return
      }

      if (data && data.length > 0) {
        const prefs = data[0]
        setEnabled(prefs.enabled)
        setPreferredAgeMin(prefs.preferred_age_min)
        setPreferredAgeMax(prefs.preferred_age_max)
        setPreferredGender(prefs.preferred_gender || 'any')
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  const handleSave = async () => {
    if (!userId) return

    // Validate age range
    if (preferredAgeMin && preferredAgeMax && preferredAgeMin > preferredAgeMax) {
      alert('Minimum age cannot be greater than maximum age')
      return
    }

    setSaving(true)

    try {
      const preferences: Partial<BuddyPreferences> = {
        user_id: userId,
        enabled,
        preferred_age_min: preferredAgeMin,
        preferred_age_max: preferredAgeMax,
        preferred_gender: preferredGender,
      }

      const { error } = await supabase
        .from('buddy_preferences')
        .upsert(preferences, { onConflict: 'user_id' })

      if (error) {
        console.error('Failed to save preferences:', error)
        alert('Failed to save preferences')
        return
      }

      alert('Preferences saved successfully!')
      router.push('/buddy-matches')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Buddy Matching
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Customize your matching preferences</p>

          <div className="space-y-8">
            {/* Enable/Disable Matching */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Enable buddy matching</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-8">
                Allow others to see you as a potential buddy match at events
              </p>
            </div>

            {/* Age Range Preference */}
            <div className={`p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-opacity ${!enabled ? 'opacity-50' : ''}`}>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Preferred Age Range
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={preferredAgeMin || ''}
                    onChange={(e) =>
                      setPreferredAgeMin(e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Min"
                    disabled={!enabled}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={preferredAgeMax || ''}
                    onChange={(e) =>
                      setPreferredAgeMax(e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Max"
                    disabled={!enabled}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Leave empty to match with any age
              </p>
            </div>

            {/* Gender Preference */}
            <div className={`p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-opacity ${!enabled ? 'opacity-50' : ''}`}>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Preferred Gender
              </label>
              <select
                value={preferredGender}
                onChange={(e) => setPreferredGender(e.target.value as PreferredGender)}
                disabled={!enabled}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="any">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select "Any Gender" to match with all genders
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-xl mt-0.5">ℹ️</div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How It Works</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Matched with people at the same events</li>
                    <li>• Based on shared interests, age & preferences</li>
                    <li>• Both must accept to confirm</li>
                    <li>• Cancel any match anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all font-semibold shadow-lg shadow-blue-500/30"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
              <button
                onClick={() => router.push('/buddy-matches')}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
