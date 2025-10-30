"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'
import PasswordVisibilityToggle from '@/components/PasswordVisibilityToggle'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/events')
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
        
        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding')
        } else {
          router.push('/events')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">O</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to discover and create amazing events
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
<div className="p-8 relative" id="auth-box">
            <PasswordVisibilityToggle containerId="auth-box" />
            <Auth
              supabaseClient={supabase}
appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#3b82f6',
                      brandAccent: '#2563eb',
                      inputText: '#111827',
                      inputBackground: '#ffffff',
                      inputBorder: '#d1d5db',
                      inputPlaceholder: '#6b7280',
                    },
                  },
                  dark: {
                    colors: {
                      brand: '#60a5fa',
                      brandAccent: '#3b82f6',
                      inputText: '#ffffff',
                      inputBackground: '#374151',
                      inputBorder: '#4b5563',
                      inputPlaceholder: '#9ca3af',
                      messageText: '#e5e7eb',
                    },
                  },
                },
                className: {
                  container: 'w-full',
                  button: 'w-full px-4 py-2 rounded-lg font-medium transition-all',
                  input: 'w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  label: 'text-gray-700 dark:text-gray-300',
                },
              }}
              providers={['google', 'github']}
              theme="dark"
              onlyThirdPartyProviders={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account yet? Sign up above to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
