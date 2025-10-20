'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import EventQRCode from './EventQRCode';
import EventCheckIn from './EventCheckIn';

interface EventQRSectionProps {
  eventId: number;
  hostId: string;
}

export default function EventQRSection({ eventId, hostId }: EventQRSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return null;
  }

  const isHost = currentUserId === hostId;

  return (
    <>
      {isHost ? (
        <EventQRCode 
          eventId={eventId} 
          hostId={hostId} 
          currentUserId={currentUserId} 
        />
      ) : (
        <EventCheckIn 
          eventId={eventId} 
          isHost={false} 
        />
      )}
    </>
  );
}
