import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            About OpenOutings
          </h1>
          <p className="text-xl text-blue-100">
            Born from loneliness, built for connection
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Founder Story Section */}
      <div className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Image Section */}
            <div className="relative h-80 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop"
                alt="People connecting and making friends"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <p className="text-sm uppercase tracking-wide mb-2">The Story</p>
                <h2 className="text-3xl font-bold">How It All Started</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 space-y-6 text-lg text-gray-700 dark:text-gray-300">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Hey, I'm Shako. I'm 26, and I built this because I needed it myself.
              </p>

              <p>
                A year ago, I went through a breakup that hit me harder than I expected. Not just because I lost a relationship, but because I realized I'd lost my friends too. I'd been so wrapped up in that relationship that I'd become that friend who always cancels, who never shows up, who's always "busy." 
              </p>

              <p>
                You know what the worst part was? When I finally reached out to people, they'd moved on. New friend groups, new routines, new inside jokes I wasn't part of. And I got it - I'd done this to myself.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-l-4 border-blue-500">
                <p className="italic text-gray-800 dark:text-gray-200">
                  "I spent three months going to work, coming home, ordering food, watching Netflix, and wondering why I felt so empty. I had everything I thought I wanted - good job, nice apartment, freedom - but I was lonely as hell."
                </p>
              </div>

              <p>
                So I decided to fix it. I'd always wanted to try hiking, but none of my old friends were into it. I thought: "I'll just go alone." 
              </p>

              <p>
                Except... I didn't. Because going alone felt weird. What if people thought I was a loser with no friends? What if something happened and I needed help? What if I just looked pathetic out there by myself?
              </p>

              <p>
                That's when it clicked. <span className="font-semibold text-gray-900 dark:text-white">I wasn't the only one feeling this way.</span> There had to be other people in Sofia who wanted to do things but had no one to do them with. People who'd moved here for work. People who'd drifted from their friend groups. People who were just... lonely.
              </p>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                The Solution
              </h3>

              <p>
                I started building OpenOutings at 2 AM on a Tuesday. Couldn't sleep, couldn't stop thinking about it. What if there was a place where going alone wasn't weird - it was expected? Where everyone else was also there to meet people?
              </p>

              <p>
                <span className="font-semibold text-gray-900 dark:text-white">No swiping. No small talk over coffee with a stranger from the internet. Just actual activities with actual people who share your actual interests.</span>
              </p>

              <p>
                The first event I created was a hiking trip. Seven people showed up. All strangers to each other. All a little nervous. By the end of that hike, we had a group chat and plans for next weekend.
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-l-4 border-green-500">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Three months later:
                </p>
                <ul className="space-y-2 text-gray-800 dark:text-gray-200">
                  <li>• I have a friend group again</li>
                  <li>• I've tried things I never would have done alone (rock climbing, board game cafes, photography walks)</li>
                  <li>• I actually look forward to weekends</li>
                  <li>• I'm not lonely anymore</li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Why This Works
              </h3>

              <p>
                Here's what I learned: <span className="font-semibold text-gray-900 dark:text-white">Friendships don't form from perfect profiles or clever bios. They form from shared experiences.</span>
              </p>

              <p>
                When you're hiking a trail together, or figuring out a board game, or all trying the same weird coffee at a new cafe - that's when real connections happen. You're not performing for each other. You're just... being people. Doing things.
              </p>

              <p>
                And here's the secret: <span className="font-semibold text-gray-900 dark:text-white">everyone at these events is in the same boat.</span> We're all there because we want to meet people. There's no shame in that. It's actually kind of beautiful.
              </p>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                For You
              </h3>

              <p>
                If you're reading this and you're lonely - I get it. I've been there. I know how it feels to scroll through Instagram seeing everyone else having fun while you're home alone. Again.
              </p>

              <p>
                I built OpenOutings for you. For past me. For anyone who's ever thought "I wish I had someone to do this with."
              </p>

              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                You don't need to have friends to join events. You need to join events to make friends.
              </p>

              <p>
                So pick an event. Any event. Show up. Be awkward if you need to - everyone else is a little awkward too. Say hi. Ask questions. Share experiences.
              </p>

              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Do it weekly for a month. I promise you, your life will look different.
              </p>

              <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">— Shako</span>
                  <br />
                  Founder, OpenOutings
                  <br />
                  Still showing up to events, still making friends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Making it easier for people to connect through shared experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                No One Left Lonely
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every person in every city deserves to have friends and a social life. We're here to make that happen.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Real Connections
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Forget the algorithms and perfect profiles. We believe in meeting people the old-fashioned way - by actually doing things together.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Build Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Strong cities are built on strong communities. We're creating spaces where neighbors become friends and strangers become family.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              We're Just Getting Started
            </h2>
            <p className="text-blue-100 text-lg">
              But the impact is already real
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">1,000+</div>
              <div className="text-blue-100 text-lg">Lives Changed</div>
              <div className="text-blue-200 text-sm mt-1">People who found their tribe</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100 text-lg">Monthly Events</div>
              <div className="text-blue-200 text-sm mt-1">Moments of connection</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">∞</div>
              <div className="text-blue-100 text-lg">Friendships Made</div>
              <div className="text-blue-200 text-sm mt-1">And counting every day</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Your Story Starts Here
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Six months from now, you'll wish you'd started today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-blue-500/30 text-center"
            >
              Join OpenOutings
            </Link>
            <Link
              href="/events"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all font-semibold text-center"
            >
              Browse Events
            </Link>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-6">
            P.S. That first event is always the hardest. But I promise it gets easier. And then it gets amazing.
          </p>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl italic mb-4">
            "Life's too short to spend it alone when your people are out there waiting to meet you."
          </p>
          <p className="text-gray-400">— The OpenOutings Promise</p>
        </div>
      </div>
    </div>
  )
}
