import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileWarning, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyIncidents } from '@/services/incidentService';
import { formatDate } from '@/lib/format';
import type { Incident } from '@/types/database';
import { Badge, Card, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { severityTone, statusTone } from '@/lib/tones';

export function MyIncidentsPage() {
  const { profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getMyIncidents(profile.id)
      .then(setIncidents)
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-ink-900">Incidents</h1>
        <Link to="/incidents/new">
          <Button size="sm">
            <Plus size={16} /> Report
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-7 h-7" />
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<FileWarning size={40} />}
          title="No incidents yet."
          description="Anything you report will show up here."
          action={
            <Link to="/incidents/new">
              <Button>Report an incident</Button>
            </Link>
          }
        />
      ) : (
        <Card className="divide-y divide-ink-100">
          {incidents.map((incident) => (
            <div key={incident.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
                <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
              </div>
              <p className="text-sm text-ink-800 line-clamp-2">{incident.description}</p>
              <p className="text-xs text-ink-400 mt-1.5">{formatDate(incident.created_at)}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
