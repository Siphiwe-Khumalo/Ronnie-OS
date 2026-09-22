import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { captureOneTimeLocation, createSosEvent } from '@/services/sosService';
import { toFriendlyError } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/Primitives';

const COUNTDOWN_SECONDS = 3;

/**
 * The SOS confirmation screen. A short countdown prevents accidental
 * activation while still keeping the emergency path fast. GPS is
 * requested only AFTER confirmation, exactly once, and a denied/failed
 * location fix never blocks sending the alert.
 */
export function SosConfirmPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    setConfirming(true);
    setCount(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerSos();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function cancelCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
    setConfirming(false);
    setCount(COUNTDOWN_SECONDS);
  }

  async function triggerSos() {
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    try {
      // Location is requested only now, after explicit confirmation, and
      // only once. A denied/unavailable fix resolves to `null` — it never
      // throws — so the alert always goes out.
      const location = await captureOneTimeLocation();
      const sos = await createSosEvent(profile.id, profile.business_id, location);
      navigate('/sos/status', { replace: true, state: { sosId: sos.id } });
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't send your alert. Please try again immediately."));
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-emergency-950 text-white flex flex-col px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        aria-label="Cancel and go back"
        className="self-start p-2 -ml-2 rounded-lg hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <X size={26} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-emergency-600 flex items-center justify-center mb-6" aria-hidden="true">
          <TriangleAlert size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Emergency alert</h1>
        <p className="text-emergency-100 max-w-xs mb-8">
          Press and confirm to notify your designated managers immediately.
        </p>

        {error && (
          <div className="mb-6 w-full max-w-xs">
            <ErrorBanner message={error} />
          </div>
        )}

        {submitting ? (
          <p className="text-lg font-semibold animate-pulse">Sending your alert…</p>
        ) : confirming ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-28 h-28 rounded-full border-4 border-white/30 flex items-center justify-center text-5xl font-bold"
              role="status"
              aria-live="assertive"
            >
              {count}
            </div>
            <p className="text-sm text-emergency-100">Sending alert automatically…</p>
            <Button variant="secondary" size="lg" onClick={cancelCountdown}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" size="xl" onClick={startCountdown} className="bg-white text-emergency-800 hover:bg-emergency-50 border-2 border-white">
            Confirm Emergency
          </Button>
        )}
      </div>
    </div>
  );
}
