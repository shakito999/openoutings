"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { INTERESTS, getInterestDisplay } from '@/lib/interestsBilingual'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OnboardingPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Step 1: Profile Info
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  
  // Step 2: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [interestSearch, setInterestSearch] = useState('')
  
  // Check if user is logged in and if they've already completed onboarding
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, onboarding_completed')
        .eq('id', user.id)
        .single()
      
      if (profile?.onboarding_completed) {
        router.push('/events')
        return
      }
      
      // Pre-fill existing data
      if (profile?.full_name) setFullName(profile.full_name)
      if (profile?.bio) setBio(profile.bio)
    }
    
    checkUser()
  }, [router])
  
  const handleNext = async () => {
    if (step === 1) {
      // Save profile info
      if (!fullName.trim()) {
        alert('Please enter your full name')
        return
      }
      
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio || null
        })
        .eq('id', userId)
      
      setLoading(false)
      
      if (error) {
        alert('Error saving profile: ' + error.message)
        return
      }
      
      setStep(2)
    } else if (step === 2) {
      // Save interests
      if (selectedInterests.length === 0) {
        alert('Please select at least one interest')
        return
      }
      
      setLoading(true)
      
      // Get interest IDs
      const { data: interests } = await supabase
        .from('interests')
        .select('id, name')
        .in('name', selectedInterests)
      
      if (interests && interests.length > 0) {
        // Insert user interests
        const userInterests = interests.map(interest => ({
          user_id: userId,
          interest_id: interest.id
        }))
        
        await supabase
          .from('user_interests')
          .insert(userInterests)
      }
      
      setLoading(false)
      setStep(3)
    } else if (step === 3) {
      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)
      
      router.push('/events')
    }
  }
  
  const handleSkip = () => {
    if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)
        .then(() => router.push('/events'))
    }
  }
  
  const filteredInterests = interestSearch
    ? INTERESTS.filter(i => 
        getInterestDisplay(i, language).toLowerCase().includes(interestSearch.toLowerCase())
      )
    : INTERESTS
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {step} of 3
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Let's start by setting up your profile
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                    placeholder="Tell people a bit about yourself..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  What are your interests?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select at least one interest to help us recommend events
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search interests..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={interestSearch}
                  onChange={e => setInterestSearch(e.target.value)}
                />
                
                {/* Selected Interests */}
                {selectedInterests.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected ({selectedInterests.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map(interest => (
                        <button
                          key={interest}
                          onClick={() => setSelectedInterests(selectedInterests.filter(i => i !== interest))}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1"
                        >
                          {getInterestDisplay(interest, language)}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Available Interests */}
                <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {filteredInterests
                      .filter(interest => !selectedInterests.includes(interest))
                      .map(interest => (
                        <button
                          key={interest}
                          onClick={() => setSelectedInterests([...selectedInterests, interest])}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          + {getInterestDisplay(interest, language)}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  You're all set!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ready to discover amazing events and meet new people
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  What's next?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      Browse events matching your interests
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      Join your first event and meet awesome people
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      Create your own events and build your community
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8">
            {step > 1 && step < 3 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              {step < 3 && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {step === 3 ? 'Get Started' : 'Continue'}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
