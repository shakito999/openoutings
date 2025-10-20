'use client'

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go Home
            </Link>
            <Link
              href="/events"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Browse Events
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Quick links:
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Dashboard
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                href="/events/new"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create Event
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                href="/profile"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Profile
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                href="/community"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
