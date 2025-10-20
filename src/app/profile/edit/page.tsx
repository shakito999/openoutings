"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { INTERESTS, searchInterests, getInterestDisplay } from '@/lib/interestsBilingual'
import InterestsPicker from '@/components/InterestsPicker'
import { compressImage } from '@/lib/imageCompression'
import { useLanguage } from '@/contexts/LanguageContext'

export default function EditProfilePage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [interestSearch, setInterestSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        user_interests (
          interest_id,
          interests (
            id,
            name
          )
        )
      `)
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
      setCoverUrl(profile.cover_url || '')
      setInterests(profile.user_interests?.map((ui: any) => ui.interests.name) || [])
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)

    try {
      // Compress image
      const compressedBlob = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8
      })

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (error: any) {
      alert('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingCover(true)

    try {
      // Compress cover image
      const compressedBlob = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 400,
        quality: 0.85
      })

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `cover-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `covers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setCoverUrl(publicUrl)
    } catch (error: any) {
      alert('Error uploading cover: ' + error.message)
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSave() {
    if (!user) return

    setLoading(true)

    try {
      // Update profile (upsert will create if doesn't exist)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          username: username || user.email?.split('@')[0] || 'user',
          bio: bio,
          avatar_url: avatarUrl,
          cover_url: coverUrl
        })

      if (profileError) throw profileError

      // Get interest IDs
      const { data: allInterests } = await supabase
        .from('interests')
        .select('id, name')
        .in('name', interests)

      if (allInterests) {
        // Delete existing interests
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id)

        // Insert new interests
        if (allInterests.length > 0) {
          const userInterests = allInterests.map(interest => ({
            user_id: user.id,
            interest_id: interest.id
          }))

          await supabase
            .from('user_interests')
            .insert(userInterests)
        }
      }

      router.push(`/profile/${user.id}`)
    } catch (error: any) {
      alert('Error saving profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user) return

    const confirmation = prompt(
      'Това действие е необратимо! За да потвърдите изтриването на акаунта си, напишете "ИЗТРИЙ" (с главни букви):'
    )

    if (confirmation !== 'ИЗТРИЙ') {
      if (confirmation !== null) {
        alert('Изтриването е отменено.')
      }
      return
    }

    setDeleting(true)

    try {
      // Delete profile (cascade will handle related data)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (deleteError) throw deleteError

      // Sign out
      await supabase.auth.signOut()
      
      // Redirect to home
      router.push('/')
    } catch (error: any) {
      alert('Грешка при изтриване на акаунта: ' + error.message)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Редактирай профил
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Актуализирай личната си информация и интереси</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Cover Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Корица
              </label>
              <div className="space-y-4">
                <div className="h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                  {coverUrl ? (
                    <>
                      <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setCoverUrl('')}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        title="Изтрий"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">Няма корица</p>
                      </div>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="cover-upload"
                  className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium inline-block"
                >
                  {uploadingCover ? 'Качва се...' : 'Качи корица'}
                </label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Препоръчително: 1920x400px, пейзажен формат
                </p>
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Профилна снимка
              </label>
              <div className="flex items-center space-x-6">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200 dark:border-gray-700">
                    {fullName?.[0] || username?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium inline-block"
                  >
                    {uploading ? 'Качва се...' : 'Качи снимка'}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Препоръчително: квадратна снимка, мин. 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пълно име
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Георги Иванов"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Потребителско име
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="georgi_iv"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Биография
              </label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px]"
                placeholder="Разкажи малко за себе си..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Интереси ({interests.length} избрани)
              </label>
              
              {/* Search box */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Търси интереси..."
                  value={interestSearch}
                  onChange={e => setInterestSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Selected interests */}
              {interests.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Избрани:</p>
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
                    {interestSearch ? 'Няма намерени интереси' : 'Всички интереси са избрани'}
                  </p>
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Избери интересите си, за да намериш подходящи събития
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
              className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Изтрий акаунт
            </button>

            <div className="flex space-x-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                disabled={loading || deleting}
              >
                Отказ
              </button>
              <button
                onClick={handleSave}
                disabled={loading || deleting || !username}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Запазва се...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Запази промените
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Изтриване на акаунт
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Това действие е необратимо! Всички твои данни, събития и участия ще бъдат изтрити завинаги.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Отказ
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    handleDeleteAccount()
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Изтрива се...
                    </>
                  ) : (
                    'Изтрий завинаги'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
