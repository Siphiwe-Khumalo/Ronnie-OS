import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TriangleAlert, FileWarning, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { greeting, firstName, formatTime } from '@/lib/format';
import { toFriendlyError } from '@/lib/errors';
import { checkIn, checkOut, getActiveShift, getMyRecentShifts } from '@/services/shiftService';
import { getMyActiveSos } from '@/services/sosService';
import type { Shift } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Card, ErrorBanner, Spinner } from '@/components/ui/Primitives';
import { Link } from 'react-router-dom';

export function EmployeeHomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [recentShifts, setRecentShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSos, setHasActiveSos] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [shift, recent, sos] = await Promise.all([
        getActiveShift(profile.id),
        getMyRecentShifts(profile.id, 5),
        getMyActiveSos(profile.id),
      ]);
      setActiveShift(shift);
      setRecentShifts(recent);
      setHasActiveSos(Boolean(sos));
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load your activity."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckInOut() {
    if (!profile) return;
    setError(null);
    setBusy(true);
    try {
      if (activeShift) {
        await checkOut(activeShift.id);
      } else {
        await checkIn(profile.id, profile.business_id);
      }
      await load();
    } catch (err) {
      setError(toFriendlyError(err, activeShift ? "We couldn't check you out." : "We couldn't check you in."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          {greeting()}, {firstName(profile?.name)}
        </h1>
        <p className="text-sm text-ink-500 mt-0.5">Here's your status for today.</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {hasActiveSos && (
        <div className="rounded-xl bg-emergency-50 border border-emergency-300 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-emergency-800 text-sm">Your emergency alert is active</p>
            <p className="text-xs text-emergency-700">Tap to view status.</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/sos/status')}>
            View
          </Button>
        </div>
      )}

      {/* Check-in card */}
      <Card className="p-6 text-center">
        {activeShift ? (
          <>
            <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase mb-1">Checked in</p>
            <p className="text-3xl font-bold text-ink-900 flex items-center justify-center gap-2">
              <Clock size={26} className="text-emerald-600" aria-hidden="true" />
              {formatTime(activeShift.checked_in_at)}
            </p>
          </>
        ) : (
          <p className="text-xs font-bold tracking-wide text-ink-400 uppercase mb-1">Not checked in</p>
        )}
        <Button
          size="xl"
          fullWidth
          variant={activeShift ? 'secondary' : 'primary'}
          className="mt-5"
          loading={busy}
          onClick={handleCheckInOut}
        >
          {activeShift ? 'Check Out' : 'Check In'}
        </Button>
      </Card>

      {/* Emergency */}
      <Card className="p-5 border-emergency-200">
        <div className="flex items-center gap-2 mb-3">
          <TriangleAlert size={20} className="text-emergency-600" aria-hidden="true" />
          <h2 className="font-semibold text-ink-900">Emergency</h2>
        </div>
        <Button
          variant="danger"
          size="xl"
          fullWidth
          onClick={() => navigate('/sos')}
          aria-label="Trigger emergency SOS alert"
        >
          SOS — Get Help Now
        </Button>
      </Card>

      {/* Report incident */}
      <Link
        to="/incidents/new"
        className="flex items-center gap-3 bg-white rounded-2xl border border-ink-100 shadow-card px-5 py-4 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <FileWarning size={22} className="text-brand-700 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold text-ink-900 text-sm">Report Incident</p>
          <p className="text-xs text-ink-500">Something unsafe happen? Let your managers know.</p>
        </div>
      </Link>

      {/* My activity */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <ListChecks size={18} className="text-ink-500" aria-hidden="true" />
          <h2 className="font-semibold text-ink-900 text-sm">My Activity</h2>
        </div>
        <Card className="divide-y divide-ink-100">
          {recentShifts.length === 0 ? (
            <p className="text-sm text-ink-500 px-5 py-6 text-center">Nobody is checked in yet.</p>
          ) : (
            recentShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-ink-700">{new Date(shift.checked_in_at).toLocaleDateString()}</span>
                <span className="text-ink-500">
                  {formatTime(shift.checked_in_at)} – {shift.checked_out_at ? formatTime(shift.checked_out_at) : 'now'}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
