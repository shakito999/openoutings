"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Map from '@/components/Map'
import { supabase } from '@/lib/supabaseClient'
import { getInterestDisplay, searchInterests } from '@/lib/interestsBilingual'
import { INTERESTS } from '@/lib/interestGroups'
import { useLanguage } from '@/contexts/LanguageContext'
import { compressImage } from '@/lib/imageCompression'

export default function NewEventPage(){
  const router = useRouter()
  const { language } = useLanguage()
  const [title,setTitle] = useState('')
  const [desc,setDesc] = useState('')
  const [when,setWhen] = useState('')
  const [cap,setCap] = useState<number>(5)
  const [gender,setGender] = useState('none')
  const [address,setAddress] = useState('')
  const [latlng,setLatlng] = useState<[number,number] | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [interestSearch, setInterestSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('none')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [tips, setTips] = useState('')
  const [difficulty, setDifficulty] = useState<'beginner' | 'easy' | 'moderate' | 'intermediate' | 'advanced' | 'expert'>('beginner')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i]
        
        // Compress image
        const compressedBlob = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.85
        })

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `event-${user.id}-${Date.now()}-${i}.${fileExt}`
        const filePath = `event-photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, compressedBlob, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }
      
      setPhotos([...photos, ...uploadedUrls])
    } catch (error: any) {
      alert('Error uploading images: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  async function create(){
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in first')
      setLoading(false)
      return router.push('/login')
    }
    
    // Create event
    const { data: eventData, error } = await supabase.from('events').insert({
      host_id: user.id,
      title,
      description: desc,
      starts_at: new Date(when).toISOString(),
      capacity: cap,
      gender,
      address,
      lat: latlng?.[0],
      lng: latlng?.[1],
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : 'none',
      recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
      tips: tips || null,
      difficulty,
    }).select().single()
    
    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // Add photos
    if (photos.length > 0 && eventData) {
      const photoInserts = photos.map(url => ({
        event_id: eventData.id,
        storage_path: url
      }))
      await supabase.from('event_photos').insert(photoInserts)
    }

    // Add interests
    if (interests.length > 0 && eventData) {
      const { data: interestData } = await supabase
        .from('interests')
        .select('id, name')
        .in('name', interests)

      if (interestData && interestData.length > 0) {
        const interestInserts = interestData.map(interest => ({
          event_id: eventData.id,
          interest_id: interest.id
        }))
        await supabase.from('event_interests').insert(interestInserts)
      }
    }
    
    setLoading(false)
    router.push('/events')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Share an activity and bring people together</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Morning Coffee Meetup"
                  value={title}
                  onChange={e=>setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px]"
                  placeholder="Tell people what to expect..."
                  value={desc}
                  onChange={e=>setDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  value={when}
                  onChange={e=>setWhen(e.target.value)}
                />
              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Event Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={cap}
                    onChange={e=>setCap(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender Restriction
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={gender}
                    onChange={e=>setGender(e.target.value)}
                  >
                    <option value="none">No restriction</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Recurring Event Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={e => {
                    setIsRecurring(e.target.checked)
                    if (!e.target.checked) {
                      setRecurrencePattern('none')
                      setRecurrenceEndDate('')
                    }
                  }}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="flex-1 cursor-pointer">
                  <span className="font-medium text-gray-900 dark:text-white">Make this a recurring event</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Event will repeat automatically</p>
                </label>
              </div>

              {/* Recurring Options */}
              {isRecurring && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repeat Pattern *
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={recurrencePattern}
                      onChange={e => setRecurrencePattern(e.target.value as any)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={recurrenceEndDate}
                      onChange={e => setRecurrenceEndDate(e.target.value)}
                      min={when ? new Date(when).toISOString().split('T')[0] : undefined}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty for indefinite recurrence
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter event address or use map below"
                  value={address}
                  onChange={e=>setAddress(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Will be auto-filled when you select a location on the map
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Map Location
                </label>
                <Map 
                  onPick={(a,b)=> setLatlng([a,b])} 
                  onAddressFound={(addr) => !address && setAddress(addr)}
                />
                {latlng && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Location selected: {latlng[0].toFixed(4)}, {latlng[1].toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Photos Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event Photos (Optional)
              </h2>

              {/* Photo Upload */}
              <div>
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Add Photos (max 5)'}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading || photos.length >= 5}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Images will be automatically compressed. Max 5 photos.
                </p>
              </div>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips & Requirements Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips & Requirements
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                >
                  <option value="beginner">🟢 Beginner - Anyone can join</option>
                  <option value="easy">🟢 Easy - Minimal effort required</option>
                  <option value="moderate">🟡 Moderate - Some fitness needed</option>
                  <option value="intermediate">🟡 Intermediate - Good fitness level</option>
                  <option value="advanced">🔴 Advanced - High fitness required</option>
                  <option value="expert">🔴 Expert - Very demanding</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Help participants understand the physical demands
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tips & Suggestions (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                  placeholder="e.g., Bring 100 leva spending money, warm clothes, suitable hiking shoes, water bottle..."
                  value={tips}
                  onChange={e => setTips(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  What should participants bring or know?
                </p>
              </div>
            </div>

            {/* Interests Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Interests ({interests.length} selected)
              </h2>

              {/* Search box */}
              <div>
                <input
                  type="text"
                  placeholder="Search interests..."
                  value={interestSearch}
                  onChange={e => setInterestSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Selected interests */}
              {interests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => setInterests(interests.filter(i => i !== interest))}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium shadow-md shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1"
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

              {/* Available interests */}
              <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex flex-wrap gap-2">
                  {(interestSearch ? searchInterests(interestSearch).map(i => i.canonical) : INTERESTS)
                    .filter(interest => !interests.includes(interest))
                    .map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => setInterests([...interests, interest])}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      >
                        + {getInterestDisplay(interest, language)}
                      </button>
                    ))}
                </div>
                {(interestSearch ? searchInterests(interestSearch).map(i => i.canonical) : INTERESTS)
                  .filter(interest => !interests.includes(interest)).length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {interestSearch ? 'No interests found' : 'All interests selected'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 flex justify-end space-x-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={loading || !title || !desc || !when}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
