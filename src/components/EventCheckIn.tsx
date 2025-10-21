'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-2 left-8 transform -translate-y-full">
          <div className="absolute bottom-0 left-0 transform translate-y-1/2 -translate-x-3">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
          {text}
        </div>
      )}
    </div>
  );
}

// Dynamically import QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false });

interface EventCheckInProps {
  eventId: number;
  isHost: boolean;
}

export default function EventCheckIn({ eventId, isHost }: EventCheckInProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckInStatus();
  }, [eventId]);

  async function loadCheckInStatus() {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is checked in
      const { data: checkin } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsCheckedIn(!!checkin);

      // Get total check-in count
      const { count } = await supabase
        .from('event_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      setCheckInCount(count || 0);
    } catch (err) {
      console.error('Error loading check-in status:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleScanSuccess() {
    setShowScanner(false);
    loadCheckInStatus();
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Регистрация
            </h3>
            <InfoTooltip text="Сканирайте QR кода, показан от домакина, за да потвърдите, че наистина сте присъствали на събитието. След сканиране ще можете да оставите отзив - това гарантира, че само хора, които реално са били на събитието, могат да оставят доверени отзиви." />
          </div>
          {checkInCount > 0 && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
              {checkInCount} регистрирани
            </span>
          )}
        </div>

        {isCheckedIn ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Вие сте регистриран
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Готови сте за събитието
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Регистрирайте се за събитието, за да потвърдите присъствието си
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Сканирай QR код
            </button>
          </div>
        )}
      </div>

      {showScanner && currentUser && (
        <QRScanner
          eventId={eventId}
          userId={currentUser.id}
          onSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
