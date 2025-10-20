'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ReviewFormProps {
  eventId: number;
  revieweeId: string;
  revieweeName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReviewForm({ eventId, revieweeId, revieweeName, onSuccess, onCancel }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [friendlinessRating, setFriendlinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoverRating, setHoverRating] = useState<{ [key: string]: number }>({});

  const StarRating = ({ 
    value, 
    onChange, 
    label, 
    name 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string; 
    name: string;
  }) => {
    const currentHover = hoverRating[name] || 0;
    const displayRating = currentHover || value;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {value > 0 && <span className="text-gray-500">({value}/5)</span>}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverRating({ ...hoverRating, [name]: star })}
              onMouseLeave={() => setHoverRating({ ...hoverRating, [name]: 0 })}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= displayRating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                fill={star <= displayRating ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (overallRating === 0) {
      setError('Моля, изберете обща оценка');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Моля, напишете поне 10 символа');
      return;
    }

    if (reviewText.trim().length > 1000) {
      setError('Ревюто не може да бъде по-дълго от 1000 символа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Трябва да сте влезли в профила си');
        return;
      }

      // Check if user is checked in
      const { data: checkin } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          event_id: eventId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          overall_rating: overallRating,
          friendliness_rating: friendlinessRating || null,
          communication_rating: communicationRating || null,
          reliability_rating: reliabilityRating || null,
          review_text: reviewText.trim(),
          is_verified_attendee: !!checkin,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Вече сте оставили ревю за този човек за това събитие');
        } else {
          throw insertError;
        }
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Грешка при изпращане на ревю');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ревю за {revieweeName}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Обща оценка *"
              name="overall"
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Допълнителни оценки (незадължително)
              </p>
              
              <StarRating
                value={friendlinessRating}
                onChange={setFriendlinessRating}
                label="Приятелство"
                name="friendliness"
              />

              <StarRating
                value={communicationRating}
                onChange={setCommunicationRating}
                label="Комуникация"
                name="communication"
              />

              <StarRating
                value={reliabilityRating}
                onChange={setReliabilityRating}
                label="Надеждност"
                name="reliability"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Коментар * (10-1000 символа)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Споделете опита си с този човек на събитието..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reviewText.length}/1000 символа
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Отказ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Изпращане...' : 'Изпрати ревю'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
