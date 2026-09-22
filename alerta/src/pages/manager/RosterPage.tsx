import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRoster } from '@/services/employeeService';
import { useRealtimeBusinessShifts } from '@/hooks/useRealtimeSos';
import { formatTime } from '@/lib/format';
import type { RosterEntry } from '@/types/database';
import { Badge, Card, EmptyState, ErrorBanner, Spinner } from '@/components/ui/Primitives';
import { toFriendlyError } from '@/lib/errors';

export function RosterPage() {
  const { profile } = useAuth();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await getRoster(profile.business_id);
      setRoster(data);
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load the roster."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeBusinessShifts(profile?.business_id, load);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const activeEmployees = roster.filter((r) => r.status === 'active');

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Roster</h1>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {activeEmployees.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="Add your first employee." description="Your roster will show up here once you invite your team." />
      ) : (
        <Card className="divide-y divide-ink-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-4 gap-4 px-5 py-3 text-xs font-bold text-ink-400 uppercase tracking-wide">
            <span>Name</span>
            <span>Role</span>
            <span>Status</span>
            <span>Check-in time</span>
          </div>
          {activeEmployees.map((entry) => (
            <div key={entry.id} className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-4 items-center">
              <span className="font-medium text-ink-900">{entry.name}</span>
              <span className="text-sm text-ink-500 capitalize hidden md:block">{entry.role}</span>
              <span>
                {entry.active_shift ? (
                  <Badge tone="success">Checked in</Badge>
                ) : (
                  <Badge tone="neutral">Checked out</Badge>
                )}
              </span>
              <span className="text-sm text-ink-500">
                {entry.active_shift ? formatTime(entry.active_shift.checked_in_at) : '—'}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
