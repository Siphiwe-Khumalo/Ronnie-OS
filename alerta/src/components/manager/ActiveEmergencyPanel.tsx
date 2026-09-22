import { useState } from 'react';
import { TriangleAlert, ShieldCheck } from 'lucide-react';
import type { SosEventWithProfile } from '@/types/database';
import { formatDateTime, elapsedSince } from '@/lib/format';
import { LocationPreview } from '@/components/shared/LocationPreview';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Primitives';

interface ActiveEmergencyPanelProps {
  events: SosEventWithProfile[];
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, note: string) => Promise<void>;
}

export function ActiveEmergencyPanel({ events, onAcknowledge, onResolve }: ActiveEmergencyPanelProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-4 mb-8" role="alert" aria-label="Active emergencies">
      {events.map((event) => (
        <EmergencyCard key={event.id} event={event} onAcknowledge={onAcknowledge} onResolve={onResolve} />
      ))}
    </div>
  );
}

function EmergencyCard({
  event,
  onAcknowledge,
  onResolve,
}: {
  event: SosEventWithProfile;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, note: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleAcknowledge() {
    setBusy(true);
    setError(null);
    try {
      await onAcknowledge(event.id);
    } catch {
      setError("Couldn't acknowledge — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve() {
    if (note.trim().length === 0) {
      setError('Please add a short resolution note.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onResolve(event.id, note.trim());
    } catch {
      setError("Couldn't resolve — please try again.");
      setBusy(false);
    }
  }

  const isAcknowledged = event.status === 'acknowledged';

  return (
    <div className="rounded-2xl border-2 border-emergency-400 bg-emergency-50 shadow-panel p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-emergency-600 text-white flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <TriangleAlert size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emergency-700">
              {isAcknowledged ? 'Acknowledged — in progress' : 'Active emergency'}
            </p>
            <h3 className="text-lg font-bold text-ink-900">{event.profile.name}</h3>
            <p className="text-sm text-ink-600">
              Triggered {formatDateTime(event.triggered_at)} · {elapsedSince(event.triggered_at)} ago
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 md:w-64">
          <LocationPreview latitude={event.latitude} longitude={event.longitude} accuracy={event.location_accuracy_m} />
        </div>
      </div>

      {error && <p className="text-sm text-emergency-800 font-medium mt-3">{error}</p>}

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        {!isAcknowledged ? (
          <Button variant="danger" size="lg" loading={busy} onClick={handleAcknowledge}>
            <ShieldCheck size={18} /> Acknowledge
          </Button>
        ) : !resolving ? (
          <Button variant="primary" size="lg" onClick={() => setResolving(true)}>
            Mark Resolved
          </Button>
        ) : (
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="What happened, and how was it resolved?"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Resolution note"
            />
            <div className="flex gap-2">
              <Button variant="primary" loading={busy} onClick={handleResolve}>
                Confirm resolved
              </Button>
              <Button variant="secondary" onClick={() => setResolving(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
