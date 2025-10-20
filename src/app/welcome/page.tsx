import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export default async function WelcomePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in, redirect to events
  if (user) {
    redirect('/events')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Life's Better
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    With Friends
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Stop scrolling. Start living. Meet real people doing real things.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">New in town?</h3>
                    <p className="text-gray-600 dark:text-gray-400">Make your first 10 friends in 30 days</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Go alone, come back with friends</h3>
                    <p className="text-gray-600 dark:text-gray-400">No shame in showing up solo - everyone's here to meet people</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Your vibe, your tribe</h3>
                    <p className="text-gray-600 dark:text-gray-400">Find events matching your exact interests</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-blue-500/30 text-center"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/events"
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all font-semibold text-center"
                >
                  Browse Events
                </Link>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop"
                  alt="People enjoying activities together"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Floating testimonial */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Sarah</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Joined 2 months ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "I moved to Sofia knowing nobody. Now I have a whole friend group and we hang out 3x a week!"
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-blue-100">People Making Friends</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Events Every Month</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Interest Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Three simple steps to your new social life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Pick Your Interests
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us what you're into - hiking, gaming, coffee, yoga, whatever!
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Join an Event
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See events matching your interests. Pick one and show up - solo is totally fine!
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Make Real Friends
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Meet people who share your interests. Go to events regularly, friendships happen naturally.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              This Is For You If...
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🏙️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                You Just Moved Here
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                New city, don't know anyone? Been there. Join events, become a regular face, watch your social circle grow from zero to amazing.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                You Work Remotely
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tired of talking to your cat all day? Meet actual humans! Coffee meetups, co-working sessions, after-work drinks.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Your Friends Are Always Busy
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Want to do something but everyone's "busy"? Join events with people who actually show up. Make friends who want to hang out.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🦋</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                You're Shy But Want Friends
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Introverts welcome! Group activities are way less awkward than one-on-one. You're all there for the same thing - instant icebreaker.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Stop Being Lonely?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of people building real friendships through shared experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all font-semibold shadow-lg text-center"
            >
              Create Free Account
            </Link>
            <Link
              href="/events"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition-all font-semibold text-center"
            >
              See What's Happening
            </Link>
          </div>
          <p className="text-blue-100 mt-6 text-sm">
            No credit card required. Just you and your interests.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4">Life's too short to be lonely when your people are out there.</p>
          <div className="flex justify-center space-x-6">
            <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            <Link href="/polls" className="hover:text-white transition-colors">Polls</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
