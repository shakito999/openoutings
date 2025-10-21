"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { getInterestDisplay } from '@/lib/interestsBilingual'
import { INTEREST_GROUPS, getGroupDisplay } from '@/lib/interestGroups'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Filters(){
  const router = useRouter()
  const params = useSearchParams()
  const { language } = useLanguage()
  const [showInterests, setShowInterests] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  function setParam(key:string, val:string){
    const sp = new URLSearchParams(params.toString())
    if (val) sp.set(key,val); else sp.delete(key)
    router.push(`/events?${sp.toString()}`)
  }

  function setTimeFilter(filter: string) {
    const sp = new URLSearchParams(params.toString())
    sp.set('time', filter)
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

  function toggleGroup(groupId: string) {
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

  const selectedInterests = params.get('interests')?.split(',').filter(Boolean) || []
  const currentTime = params.get('time') || ''

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Търсене
        </label>
        <input
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Търси събития..."
          defaultValue={params.get('q') ?? ''}
          onChange={e=> setParam('q', e.target.value)}
        />
      </div>

      {/* Time Period Pills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Период
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Всички' },
            { value: 'today', label: 'Днес' },
            { value: 'thisweek', label: 'Тази седмица' },
            { value: 'weekend', label: 'Уикенд' },
            { value: 'thismonth', label: 'Този месец' },
            { value: 'nextmonth', label: 'Следващ месец' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={`px-4 py-2 rounded-full border font-medium transition-all ${
                currentTime === filter.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests Filter */}
      <div>
        <button
          onClick={() => setShowInterests(!showInterests)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          <span>Интереси {selectedInterests.length > 0 && `(${selectedInterests.length})`}</span>
          <svg
            className={`w-5 h-5 transition-transform ${showInterests ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showInterests && (
          <div className="max-h-96 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
            {INTEREST_GROUPS.map(group => {
              const isExpanded = expandedGroups.has(group.id)
              const groupSelectedCount = group.interests.filter(i => selectedInterests.includes(i)).length
              
              return (
                <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <span className="text-lg">{group.emoji}</span>
                      <span>{getGroupDisplay(group.id, language)}</span>
                      {groupSelectedCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          {groupSelectedCount}
                        </span>
                      )}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Group Interests */}
                  {isExpanded && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-2">
                      {group.interests.map(interest => {
                        const isSelected = selectedInterests.includes(interest)
                        return (
                          <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md shadow-blue-500/30'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {getInterestDisplay(interest, language)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
