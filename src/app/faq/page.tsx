'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
  emoji: string
}

const faqs: FAQItem[] = [
  {
    emoji: "🤔",
    question: "What is OpenOutings?",
    answer: "OpenOutings is a social platform that helps you find new friends and activities based on shared interests. It's like Meetup, Eventbrite, and your friend group chat had a baby - but way better! You can discover events that match your interests, create your own activities, and meet people naturally through shared experiences."
  },
  {
    emoji: "🎯",
    question: "How does it work?",
    answer: "It's super simple! First, sign up and add your interests (hiking, board games, photography, etc.). Then you can browse events matching your interests and join ones that look fun. You can also create your own events and watch people sign up. Show up, be yourself, and make friends through shared activities - no awkward one-on-one interviews!"
  },
  {
    emoji: "🆓",
    question: "Is OpenOutings free to use?",
    answer: "Yes! OpenOutings is completely free to use. You can browse events, join activities, create your own events, and connect with people at no cost. Some individual events might have optional costs (like tickets, equipment rental, venue fees), but the platform itself is free."
  },
  {
    emoji: "👥",
    question: "Who is this for?",
    answer: "Anyone who wants to meet new people and try new things! Whether you just moved to a new city, work remotely and miss human interaction, recently went through a breakup, or just want to expand your social circle - this is for you. It's perfect for introverts who want friends, people with niche hobbies, organizers, and literally anyone tired of scrolling social media."
  },
  {
    emoji: "🔒",
    question: "Is it safe to meet strangers from the internet?",
    answer: "We take safety seriously! All users have public profiles so you can see who you're meeting. Events show attendee lists, and we have a review system so you can check people's event history. We recommend meeting in public places, telling someone where you're going, and starting with larger group events. Trust your instincts - if something feels off, don't go."
  },
  {
    emoji: "📸",
    question: "Do I need to add a profile photo?",
    answer: "It's not required, but highly recommended! People are more likely to join events when they can see who's organizing or attending. A friendly profile photo makes you more approachable and helps build trust in the community. Think of it like showing up to a party - you wouldn't wear a paper bag over your head, right?"
  },
  {
    emoji: "🎉",
    question: "What kind of events can I create?",
    answer: "Anything! Seriously. Hiking trips, board game nights, coffee meetups, photography walks, language exchanges, fitness classes, book clubs, movie screenings, cooking sessions, bar crawls, coding workshops - if you can imagine it, you can create it. Events can be free or paid, one-time or recurring, small intimate gatherings or large group activities."
  },
  {
    emoji: "📊",
    question: "What are polls and why would I use them?",
    answer: "Polls are amazing for coordinating group activities! Instead of endless WhatsApp messages asking \"Are you free Saturday? What about Sunday afternoon?\", you create one poll, share the link, and everyone clicks when they're available. The site shows you which times work best for the most people. It's perfect for planning weekend trips, regular meetups, or any group activity."
  },
  {
    emoji: "🔔",
    question: "How do I know if someone joins my event?",
    answer: "Currently, you need to check your event page to see new attendees. We're working on a notification system that will alert you when people join, comment, or when event time approaches. For now, bookmark your event pages and check them regularly!"
  },
  {
    emoji: "🔄",
    question: "Can I create recurring events?",
    answer: "Yes! When creating an event, you can set it to repeat daily, weekly, biweekly, or monthly. This is perfect for regular meetups like weekly game nights, monthly book clubs, or fitness groups. Recurring events help build consistent communities and make it easier for members to plan their schedules."
  },
  {
    emoji: "📍",
    question: "How do I find events near me?",
    answer: "Enable location permissions and you'll see distance filters (5km, 10km, 25km, 50km) on the events page. Events will show distance badges, making it easy to find activities in your neighborhood. You can also manually search by location or browse all events and check the address."
  },
  {
    emoji: "❌",
    question: "What if I need to cancel my RSVP?",
    answer: "Go to the event page and click the leave/cancel button. Your spot will become available for others. If you're the organizer and need to cancel the whole event, go to your event page and use the cancel event option - all attendees will be notified."
  },
  {
    emoji: "💬",
    question: "Can I message other users?",
    answer: "Direct messaging is coming soon! For now, you can check people's profiles before events to learn about them, and many users share contact info in event descriptions or at the actual meetup. Once you meet someone at an event, you can exchange socials naturally."
  },
  {
    emoji: "⭐",
    question: "What's the review system?",
    answer: "After attending an event, you can leave reviews for other attendees (and they can review you). This helps build trust in the community! Reviews include ratings for friendliness, communication, and reliability, plus written feedback. If you checked in at the event via QR code, your review gets a special 'verified attendee' badge."
  },
  {
    emoji: "✅",
    question: "What's the QR code check-in feature?",
    answer: "Event hosts can generate QR codes for their events. When you arrive at the physical location, you scan the host's QR code with your phone to check in. This proves you actually attended, which is important for verified reviews and accountability. Plus, it helps organizers track who showed up vs who just RSVPed."
  },
  {
    emoji: "🌍",
    question: "What cities is OpenOutings available in?",
    answer: "OpenOutings works anywhere! It started in Sofia, Bulgaria, but you can create and find events in any city worldwide. The more people use it in your area, the more events you'll see. Be the change - create the first event in your city and watch the community grow!"
  },
  {
    emoji: "👤",
    question: "How do I make my profile stand out?",
    answer: "Add a friendly profile photo, write an interesting bio about yourself and what you're into, list your interests (the more specific, the better!), and most importantly - actually attend events! Your event history shows on your profile. People who attend lots of events and have good reviews naturally build credibility."
  },
  {
    emoji: "🤝",
    question: "How do I actually make friends from this?",
    answer: "The secret is consistency. Attend events regularly - aim for at least one per week. You'll start seeing familiar faces at similar events. Say hi, ask questions, be genuinely interested in people. Exchange contacts with people you click with. Suggest future activities. After a month of showing up consistently, you'll have a whole new friend group. Promise."
  },
  {
    emoji: "😬",
    question: "I'm nervous about attending my first event. Is that normal?",
    answer: "Totally normal! Everyone feels awkward at their first event. Here's the thing: everyone else there is also trying to meet people. That's literally why they're there. The ice is already broken by the shared activity. Start with larger group events (less pressure), arrive on time, introduce yourself, and ask people questions. After your first event, it gets way easier."
  },
  {
    emoji: "💰",
    question: "How do paid events work?",
    answer: "Some events have costs listed (for things like tickets, equipment, venue fees, etc.). Currently, payment is handled outside the platform - organizers typically collect money at the event or coordinate via other methods. In-platform payment integration is planned for the future to make this smoother."
  },
  {
    emoji: "🎨",
    question: "What interests can I choose from?",
    answer: "Tons! Hiking, photography, board games, coding, yoga, coffee, nightlife, food tours, book clubs, language exchange, fitness, art, music, entrepreneurship, sports, volunteering, and many more. You can select multiple interests to get personalized event recommendations matching your vibe."
  },
  {
    emoji: "📱",
    question: "Is there a mobile app?",
    answer: "Not yet, but the website is fully mobile-friendly! You can use it on your phone's browser and it works great. A native mobile app is on the roadmap for the future, which will include push notifications and better camera integration for QR check-ins."
  },
  {
    emoji: "🚫",
    question: "What if I see inappropriate content or behavior?",
    answer: "We have a review system where you can leave feedback about your experiences. You can also flag reviews that are inappropriate. Community safety is important - if you experience harassment or see concerning content, document it and reach out through the contact page. We're working on more robust reporting and moderation tools."
  },
  {
    emoji: "🔮",
    question: "What features are coming next?",
    answer: "Lots of exciting stuff! Direct messaging, activity feed, event comments, photo sharing after events, push notifications, payment integration, advanced search filters, and more. Check out the 'What This Site Does' document for the full roadmap. We're constantly improving based on user feedback!"
  },
  {
    emoji: "💡",
    question: "Can I suggest a feature or report a bug?",
    answer: "Absolutely! We'd love to hear from you. Use the contact page to send suggestions, report issues, or just share your experience. This platform is built for the community, so your feedback directly shapes what gets built next."
  },
  {
    emoji: "🌙",
    question: "Does it have dark mode?",
    answer: "Yes! The entire site supports dark mode. It automatically matches your system preferences, so if your device is in dark mode, OpenOutings will be too. Much better for late-night event browsing. 😎"
  },
  {
    emoji: "👥",
    question: "Can I see who else is attending before I join?",
    answer: "Yes! Every event shows the full list of attendees. You can click on their profiles to learn more about them, see their interests, check their event history, and read reviews. This transparency helps you feel more comfortable joining events."
  },
  {
    emoji: "🎯",
    question: "How do I get more people to join my event?",
    answer: "Make it appealing! Add high-quality photos, write a detailed description, choose a convenient location and time, set a reasonable capacity, and make sure your profile looks trustworthy. Events with clear details and friendly organizers get more sign-ups. Also, having good reviews from past events helps build credibility."
  },
  {
    emoji: "🌐",
    question: "What languages does OpenOutings support?",
    answer: "Currently Bulgarian and English, with automatic language switching based on your browser preferences. More languages are planned as the platform grows internationally. The goal is to make OpenOutings accessible to everyone, everywhere."
  },
  {
    emoji: "⏰",
    question: "How far in advance can I create events?",
    answer: "As far as you want! Whether it's tomorrow or six months from now, you can create events at any time. For recurring events, you can set them to continue indefinitely or specify an end date. Plan ahead or be spontaneous - both work!"
  },
  {
    emoji: "🎓",
    question: "I'm new and don't know where to start. Help?",
    answer: "Welcome! Here's your step-by-step guide: 1) Complete your profile with a photo and bio, 2) Add your interests, 3) Browse events matching those interests, 4) Join one that looks fun (start with a low-pressure group activity), 5) Show up and be yourself, 6) Repeat weekly. In a month, you'll have new friends. We also have a guided onboarding flow to help you get started!"
  }
]

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start gap-4 p-6 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <span className="text-3xl flex-shrink-0">{item.emoji}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {item.question}
          </h3>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-14">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Everything you need to know about OpenOutings
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search questions... (e.g., 'how to create events', 'safety', 'dark mode')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length > 0 ? (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <FAQAccordion key={index} item={faq} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No questions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try a different search term or browse all questions above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Still have questions section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            We're here to help! Reach out and we'll get back to you ASAP.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-lg"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Quick Tips for Success 🎯
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Be Consistent
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Attend at least one event per week. Regular attendance is the secret to making lasting friendships.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">😊</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Be Yourself
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Authenticity beats perfection. People connect with real humans, not carefully curated personas.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Push Through
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The first event is the hardest. After that, it gets easier. Then it gets amazing. Trust the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
