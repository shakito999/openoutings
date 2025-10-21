"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { getInterestDisplay } from '@/lib/interestsBilingual'
import { INTEREST_GROUPS, searchInterestsInGroups, getGroupDisplay } from '@/lib/interestGroups'
import { useLanguage } from '@/contexts/LanguageContext'

const STORAGE_KEY = 'event-filter-preferences'

export default function CompactFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const { language } = useLanguage()
  
  const [searchQuery, setSearchQuery] = useState(params.get('q') ?? '')
  const [showInterestsDropdown, setShowInterestsDropdown] = useState(false)
  const [interestSearch, setInterestSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const interestsRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const selectedInterests = params.get('interests')?.split(',').filter(Boolean) || []
  const currentTime = params.get('time') || ''
  const currentSort = params.get('sort') || 'soonest'
  const currentDistance = params.get('distance') || ''

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const preferences = JSON.parse(saved)
        
        // Only apply saved preferences if no URL params are set
        const hasUrlParams = params.get('sort') || params.get('time') || params.get('distance') || params.get('interests')
        
        if (!hasUrlParams) {
          const sp = new URLSearchParams()
          if (preferences.sort) sp.set('sort', preferences.sort)
          if (preferences.time) sp.set('time', preferences.time)
          if (preferences.distance) sp.set('distance', preferences.distance)
          if (preferences.interests) sp.set('interests', preferences.interests)
          
          if (sp.toString()) {
            router.replace(`/events?${sp.toString()}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load filter preferences:', error)
    }
    setIsInitialized(true)
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isInitialized) return
    if (typeof window === 'undefined') return
    
    try {
      const preferences = {
        sort: currentSort !== 'soonest' ? currentSort : '',
        time: currentTime,
        distance: currentDistance,
        interests: selectedInterests.join(',')
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to save filter preferences:', error)
    }
  }, [currentSort, currentTime, currentDistance, selectedInterests, isInitialized])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (interestsRef.current && !interestsRef.current.contains(event.target as Node)) {
        setShowInterestsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateParam(key: string, val: string) {
    const sp = new URLSearchParams(params.toString())
    if (val) sp.set(key, val)
    else sp.delete(key)
    router.push(`/events?${sp.toString()}`)
  }

  function toggleInterest(interest: string) {
    const current = params.get('interests')?.split(',').filter(Boolean) || []
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest]
    
    const sp = new URLSearchParams(params.toString())
    if (updated.length > 0) {
      sp.set('interests', updated.join(','))
    } else {
      sp.delete('interests')
    }
    router.push(`/events?${sp.toString()}`)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const displayGroups = interestSearch 
    ? searchInterestsInGroups(interestSearch, language)
    : INTEREST_GROUPS

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="Търси събития..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                updateParam('q', e.target.value)
              }}
            />
          </div>
        </div>

        {/* Time Filter Dropdown */}
        <div className="w-full sm:w-44 relative">
          <select
            className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer text-sm appearance-none"
            value={currentTime}
            onChange={e => updateParam('time', e.target.value)}
          >
            <option value="">⏰ Всички периоди</option>
            <option value="today">📅 Днес</option>
            <option value="thisweek">📆 Тази седмица</option>
            <option value="weekend">🎉 Уикенд</option>
            <option value="thismonth">🗓️ Този месец</option>
            <option value="nextmonth">➡️ Следващ месец</option>
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Distance Filter */}
        <div className="w-full sm:w-44 relative">
          <select
            className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer text-sm appearance-none"
            value={currentDistance}
            onChange={e => updateParam('distance', e.target.value)}
          >
            <option value="">📍 Всички разстояния</option>
            <option value="5">📍 До 5 км</option>
            <option value="10">📍 До 10 км</option>
            <option value="25">📍 До 25 км</option>
            <option value="50">📍 До 50 км</option>
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full sm:w-44 relative">
          <select
            className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer text-sm appearance-none"
            value={currentSort}
            onChange={e => updateParam('sort', e.target.value)}
          >
            <option value="soonest">🕐 Най-скоро</option>
            <option value="newest">✨ Най-нови</option>
            <option value="popular">🔥 Най-популярни</option>
            <option value="spots">💺 Най-много места</option>
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Interests Dropdown */}
        <div className="relative w-full sm:w-48" ref={interestsRef}>
          <button
            onClick={() => setShowInterestsDropdown(!showInterestsDropdown)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-left flex items-center justify-between text-sm"
          >
            <span className="text-gray-700 dark:text-gray-300">
              🎯 Интереси {selectedInterests.length > 0 && `(${selectedInterests.length})`}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showInterestsDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showInterestsDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
              {/* Search within interests */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Търси интереси..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={interestSearch}
                  onChange={e => setInterestSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </div>

              {/* Selected interests */}
              {selectedInterests.length > 0 && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Избрани:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className="px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1"
                      >
                        {getInterestDisplay(interest, language)}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available interests - grouped */}
              <div className="overflow-y-auto p-2 max-h-48">
                <div className="space-y-1">
                  {displayGroups.map(group => {
                    const isExpanded = expandedGroups.has(group.id) || interestSearch !== ''
                    const availableInterests = group.interests.filter(i => !selectedInterests.includes(i))
                    const groupSelectedCount = group.interests.filter(i => selectedInterests.includes(i)).length
                    
                    if (availableInterests.length === 0 && groupSelectedCount === 0) return null
                    
                    return (
                      <div key={group.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <span className="text-base">{group.emoji}</span>
                            <span>{getGroupDisplay(group.id, language)}</span>
                            {groupSelectedCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                {groupSelectedCount}
                              </span>
                            )}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Group Interests */}
                        {isExpanded && availableInterests.length > 0 && (
                          <div className="pl-8 pr-3 pb-2 space-y-1">
                            {availableInterests.map(interest => (
                              <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className="block w-full px-3 py-1.5 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                {getInterestDisplay(interest, language)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {displayGroups.every(g => g.interests.filter(i => !selectedInterests.includes(i)).length === 0) && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    {interestSearch ? 'Няма намерени' : 'Всички избрани'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedInterests.length > 0 || currentTime || searchQuery) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Активни филтри:</span>
          
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                updateParam('q', '')
              }}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1"
            >
              Търсене: "{searchQuery}"
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {currentTime && (
            <button
              onClick={() => updateParam('time', '')}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1"
            >
              {currentTime === 'today' && 'Днес'}
              {currentTime === 'thisweek' && 'Тази седмица'}
              {currentTime === 'weekend' && 'Уикенд'}
              {currentTime === 'thismonth' && 'Този месец'}
              {currentTime === 'nextmonth' && 'Следващ месец'}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {selectedInterests.length > 0 && (
            <button
              onClick={() => updateParam('interests', '')}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1"
            >
              {selectedInterests.length} интереса
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
