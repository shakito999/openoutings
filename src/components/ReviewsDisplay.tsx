'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Review {
  id: number;
  event_id: number;
  reviewer_id: string;
  overall_rating: number;
  friendliness_rating?: number;
  communication_rating?: number;
  reliability_rating?: number;
  review_text: string;
  is_verified_attendee: boolean;
  created_at: string;
  can_edit_until: string;
  is_flagged: boolean;
  is_hidden: boolean;
  reviewer: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  event: {
    id: number;
    title: string;
  };
}

interface ReviewsDisplayProps {
  profileId: string;
  currentUserId?: string;
}

export default function ReviewsDisplay({ profileId, currentUserId }: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [profileId]);

  async function loadReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          event:event_id (
            id,
            title
          )
        `)
        .eq('reviewee_id', profileId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const { data, error } = await supabase
        .from('profile_review_stats')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (data && !error) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function handleHelpfulVote(reviewId: number, isHelpful: boolean) {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: reviewId,
          voter_id: currentUserId,
          is_helpful: isHelpful,
        });

      if (error && error.code === '23505') {
        // Already voted, update instead
        await supabase
          .from('review_votes')
          .update({ is_helpful: isHelpful })
          .eq('review_id', reviewId)
          .eq('voter_id', currentUserId);
      }
    } catch (err) {
      console.error('Error voting on review:', err);
    }
  }

  async function handleFlagReview(reviewId: number) {
    if (!currentUserId) return;

    const reason = prompt('Защо сигнализирате това ревю?');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('review_flags')
        .insert({
          review_id: reviewId,
          flagger_id: currentUserId,
          reason,
        });

      if (error) {
        if (error.code === '23505') {
          alert('Вече сте сигнализирали това ревю');
        } else {
          throw error;
        }
        return;
      }

      alert('Благодарим! Ревюто беше сигнализирано за проверка.');
    } catch (err) {
      console.error('Error flagging review:', err);
      alert('Грешка при сигнализиране');
    }
  }

  const StarDisplay = ({ rating }: { rating: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            fill={star <= rating ? 'currentColor' : 'none'}
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
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Ревюта</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          Все още няма ревюта
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold mb-4">Ревюта ({reviews.length})</h2>

      {stats && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {Number(stats.average_rating).toFixed(1)}
              </div>
              <StarDisplay rating={Math.round(stats.average_rating)} />
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star_count`] || 0;
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{stars}★</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-gray-600 dark:text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {review.reviewer.avatar_url ? (
                  <img
                    src={review.reviewer.avatar_url}
                    alt={review.reviewer.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {review.reviewer.full_name?.[0] || review.reviewer.username?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {review.reviewer.full_name || review.reviewer.username}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <StarDisplay rating={review.overall_rating} />
                    {review.is_verified_attendee && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        ✓ Потвърден
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('bg-BG')} · {review.event.title}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {review.review_text}
            </p>

            {(review.friendliness_rating || review.communication_rating || review.reliability_rating) && (
              <div className="flex gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                {review.friendliness_rating && (
                  <span>Приятелство: {review.friendliness_rating}/5</span>
                )}
                {review.communication_rating && (
                  <span>Комуникация: {review.communication_rating}/5</span>
                )}
                {review.reliability_rating && (
                  <span>Надеждност: {review.reliability_rating}/5</span>
                )}
              </div>
            )}

            {currentUserId && currentUserId !== profileId && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleHelpfulVote(review.id, true)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  👍 Полезно
                </button>
                <button
                  onClick={() => handleHelpfulVote(review.id, false)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  👎 Не е полезно
                </button>
                <button
                  onClick={() => handleFlagReview(review.id)}
                  className="ml-auto px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  🚩 Сигнализирай
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
