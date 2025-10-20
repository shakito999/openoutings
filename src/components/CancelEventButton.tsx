'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface CancelEventButtonProps {
  eventId: number;
  eventTitle: string;
  isCancelled?: boolean;
}

export default function CancelEventButton({ eventId, eventTitle, isCancelled }: CancelEventButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  if (isCancelled) {
    return null; // Don't show button if already cancelled
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Трябва да сте влезли в профила си');
        return;
      }

      // Call the cancel_event database function
      const { error } = await supabase.rpc('cancel_event', {
        p_event_id: eventId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error cancelling event:', error);
        alert('Грешка при отмяна на събитието');
        return;
      }

      // Success - refresh the page to show cancellation
      alert('Събитието беше отменено успешно. Всички участници са уведомени.');
      router.refresh();
      setShowConfirm(false);
    } catch (err) {
      console.error('Error:', err);
      alert('Грешка при отмяна на събитието');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Отмени събитие
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Отмяна на събитие
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Сигурни ли сте, че искате да отмените <strong>"{eventTitle}"</strong>?
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Внимание:</strong> Това действие не може да бъде отменено. Всички участници ще видят, че събитието е отменено.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                disabled={loading}
              >
                Назад
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Отменяне...' : 'Да, отмени'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
