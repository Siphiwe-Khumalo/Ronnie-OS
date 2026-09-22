import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyActiveSos } from '@/services/sosService';
import { useRealtimeSosEvent } from '@/hooks/useRealtimeSos';
import { formatDateTime, elapsedSince } from '@/lib/format';
import type { SosEvent } from '@/types/database';
import { LocationPreview } from '@/components/shared/LocationPreview';
import { Button } from '@/components/ui/Button';
import { Card, Spinner } from '@/components/ui/Primitives';

export function SosStatusPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SosEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!profile) return;
    getMyActiveSos(profile.id)
      .then((e) => setEvent(e))
      .finally(() => setLoading(false));
  }, [profile]);

  useRealtimeSosEvent(event?.id, (updated) => setEvent(updated));

  // Re-render every 10s to keep "elapsed time" fresh while active.
  useEffect(() => {
    if (!event || event.status === 'resolved') return;
    const interval = setInterval(() => forceTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [event]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-4 py-10 text-center">
        <ShieldCheck size={40} className="text-emerald-500 mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-ink-900">No active emergency</h1>
        <p className="text-sm text-ink-500 mt-1 mb-6">You don't have an active SOS alert right now.</p>
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </div>
    );
  }

  const isResolved = event.status === 'resolved';
  const isAcknowledged = event.status === 'acknowledged';

  return (
    <div className="px-4 py-8 space-y-5">
      <div className="text-center">
        {isResolved ? (
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" aria-hidden="true" />
        ) : isAcknowledged ? (
          <ShieldCheck size={48} className="text-brand-600 mx-auto mb-3" aria-hidden="true" />
        ) : (
          <TriangleAlert size={48} className="text-emergency-600 mx-auto mb-3" aria-hidden="true" />
        )}
        <h1 className="text-xl font-bold text-ink-900">
          {isResolved ? 'Emergency resolved' : isAcknowledged ? 'Help is on the way' : 'Help has been notified'}
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          {isResolved
            ? 'This alert has been marked resolved by your manager.'
            : isAcknowledged
              ? 'A manager has acknowledged your alert and is responding.'
              : 'Your managers have been alerted.'}
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <Row label="Time triggered" value={formatDateTime(event.triggered_at)} />
        <Row label="Elapsed" value={elapsedSince(event.triggered_at)} />
        <Row
          label="Status"
          value={isResolved ? 'Resolved' : isAcknowledged ? 'Acknowledged' : 'Active — awaiting response'}
        />
        <div>
          <p className="text-xs font-medium text-ink-500 mb-1.5">Location captured</p>
          <LocationPreview latitude={event.latitude} longitude={event.longitude} accuracy={event.location_accuracy_m} />
        </div>
        {event.resolution_note && (
          <div>
            <p className="text-xs font-medium text-ink-500 mb-1">Resolution note</p>
            <p className="text-sm text-ink-800">{event.resolution_note}</p>
          </div>
        )}
      </Card>

      <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
        Back to home
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
