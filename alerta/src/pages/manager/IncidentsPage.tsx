import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getBusinessIncidents } from '@/services/incidentService';
import { useRealtimeBusinessIncidents } from '@/hooks/useRealtimeSos';
import { formatDate } from '@/lib/format';
import { severityTone, statusTone } from '@/lib/tones';
import type { IncidentWithProfile } from '@/types/database';
import { Badge, Card, EmptyState, ErrorBanner, Spinner } from '@/components/ui/Primitives';
import { toFriendlyError } from '@/lib/errors';

export function IncidentsPage() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<IncidentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setIncidents(await getBusinessIncidents(profile.business_id));
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load incidents."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeBusinessIncidents(profile?.business_id, load);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Incidents</h1>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {incidents.length === 0 ? (
        <EmptyState icon={<FileWarning size={40} />} title="No incidents yet." />
      ) : (
        <Card className="divide-y divide-ink-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 text-xs font-bold text-ink-400 uppercase tracking-wide">
            <span>Employee</span>
            <span>Severity</span>
            <span>Location</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <span className="font-medium text-ink-900">{incident.profile.name}</span>
              <span>
                <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
              </span>
              <span className="text-sm text-ink-500 hidden md:block truncate">{incident.location_text || '—'}</span>
              <span className="text-sm text-ink-500">{formatDate(incident.created_at)}</span>
              <span>
                <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
