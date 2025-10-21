'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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

interface EventQRCodeProps {
  eventId: number;
  hostId: string;
  currentUserId: string;
}

export default function EventQRCode({ eventId, hostId, currentUserId }: EventQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // Debug logging
  console.log('EventQRCode props:', { eventId, hostId, currentUserId, isHost: currentUserId === hostId });

  useEffect(() => {
    if (currentUserId === hostId) {
      console.log('Loading QR code for host...');
      loadQRCode();
    }
  }, [eventId, currentUserId, hostId]);

  // Only show for event host
  if (currentUserId !== hostId) {
    console.log('Not showing QR code - user is not host');
    return null;
  }

  async function loadQRCode() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_qr_codes')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setQrCodeData(data.code);
        setIsActive(true);
        await generateQRImage(data.code);
      } else {
        setIsActive(false);
      }
    } catch (err) {
      console.error('Error loading QR code:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateQRImage(data: string) {
    try {
      const url = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code image:', err);
    }
  }

  async function createNewQRCode() {
    setLoading(true);
    try {
      // Deactivate existing QR codes
      await supabase
        .from('event_qr_codes')
        .update({ is_active: false })
        .eq('event_id', eventId);

      // Generate unique code
      const code = `${window.location.origin}/events/${eventId}/checkin/${crypto.randomUUID()}`;

      // Create new QR code
      const { data, error } = await supabase
        .from('event_qr_codes')
        .insert({
          event_id: eventId,
          code,
          created_by: currentUserId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setQrCodeData(code);
      setIsActive(true);
      await generateQRImage(code);
      setShowQR(true);
    } catch (err) {
      console.error('Error creating QR code:', err);
      alert('Грешка при създаване на QR код');
    } finally {
      setLoading(false);
    }
  }

  async function deactivateQRCode() {
    if (!confirm('Сигурни ли сте, че искате да деактивирате този QR код?')) return;

    setLoading(true);
    try {
      await supabase
        .from('event_qr_codes')
        .update({ is_active: false })
        .eq('event_id', eventId)
        .eq('is_active', true);

      setIsActive(false);
      setShowQR(false);
    } catch (err) {
      console.error('Error deactivating QR code:', err);
      alert('Грешка при деактивиране на QR код');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !qrCodeUrl) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Код за регистрация</h3>
          <InfoTooltip text="Покажете този QR код на участниците по време на събитието, за да потвърдят, че наистина са присъствали. Само потребители, които са сканирали кода, могат да оставят отзиви - това гарантира истински и доверени отзиви от реални участници." />
        </div>
        {isActive && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Активен
          </span>
        )}
      </div>

      {!isActive ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Няма активен QR код за това събитие
          </p>
          <button
            onClick={createNewQRCode}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Създаване...' : 'Създай QR код'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Покажете този QR код на участниците, за да се регистрират за събитието
          </p>

          {!showQR ? (
            <button
              onClick={() => setShowQR(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Покажи QR код
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Event QR Code" className="max-w-xs" />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowQR(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  Скрий
                </button>
                <button
                  onClick={createNewQRCode}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Генерирай нов
                </button>
                <button
                  onClick={deactivateQRCode}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Деактивирай
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
