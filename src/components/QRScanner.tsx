'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabaseClient';

interface QRScannerProps {
  eventId: number;
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function QRScanner({ eventId, userId, onSuccess, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
    } catch (err: any) {
      // Don't log expected camera errors as errors
      if (err.toString().includes('NotFoundError')) {
        setError('Камера не е намерена. Моля, свържете камера или използвайте мобилно устройство.');
      } else if (err.toString().includes('NotAllowedError')) {
        setError('Достъпът до камерата е отказан. Моля, разрешете достъп в настройките на браузъра.');
      } else {
        console.error('Error starting scanner:', err);
        setError('Грешка при стартиране на камерата. Моля, опитайте отново.');
      }
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        const isScanning = scannerRef.current.getState();
        if (isScanning === 2 || isScanning === 3) { // SCANNING or PAUSED
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
        console.debug('Scanner cleanup:', err);
      }
    }
  }

  async function onScanSuccess(decodedText: string) {
    if (success) return; // Prevent multiple scans

    try {
      // Stop scanning immediately
      await stopScanning();
      setScanning(false);

      // Verify the QR code exists and is active
      const { data: qrCode, error: qrError } = await supabase
        .from('event_qr_codes')
        .select('*')
        .eq('code', decodedText)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        setError('Невалиден или изтекъл QR код');
        return;
      }

      // Check if already checked in
      const { data: existingCheckin } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (existingCheckin) {
        setError('Вече сте регистриран за това събитие');
        return;
      }

      // Create check-in
      const { error: checkinError } = await supabase
        .from('event_checkins')
        .insert({
          event_id: eventId,
          user_id: userId,
          qr_code_id: qrCode.id,
          check_in_method: 'qr_code',
        });

      if (checkinError) {
        setError('Грешка при регистрация');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Грешка при обработка на QR код');
    }
  }

  function onScanError(errorMessage: string) {
    // Ignore scan errors (they happen frequently while scanning)
    // Only log actual errors, not "No QR code found"
    if (!errorMessage.includes('NotFoundException')) {
      console.debug('QR Scan error:', errorMessage);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Сканирай QR код</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-green-600">
              Успешна регистрация!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Вече сте регистриран за събитието
            </p>
          </div>
        ) : (
          <div>
            <div
              id="qr-reader"
              className="rounded-lg overflow-hidden mb-4"
            ></div>
            
            {scanning && (
              <p className="text-sm text-gray-600 text-center">
                Насочете камерата към QR кода
              </p>
            )}
          </div>
        )}

        {!success && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Затвори
          </button>
        )}
      </div>
    </div>
  );
}
