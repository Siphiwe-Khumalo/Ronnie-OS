import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getIncidentById, getSignedPhotoUrl, updateIncidentStatus } from '@/services/incidentService';
import { formatDateTime } from '@/lib/format';
import { severityTone, statusTone } from '@/lib/tones';
import type { IncidentStatus, IncidentWithProfile } from '@/types/database';
import { toFriendlyError } from '@/lib/errors';
import { Badge, Card, ErrorBanner, Spinner, Textarea } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  open: 'investigating',
  investigating: 'closed',
  closed: null,
};

const NEXT_LABEL: Record<IncidentStatus, string> = {
  open: 'Start investigating',
  investigating: 'Mark closed',
  closed: '',
};

export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentWithProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getIncidentById(id);
      setIncident(data);
      if (data.photo_url) {
        setPhotoUrl(await getSignedPhotoUrl(data.photo_url));
      }
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load this incident."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvance() {
    if (!incident) return;
    const next = NEXT_STATUS[incident.status];
    if (!next) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateIncidentStatus(incident.id, next, note.trim() || undefined);
      setIncident({ ...incident, ...updated });
      setNote('');
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't update this incident."));
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

  if (error && !incident) {
    return <ErrorBanner message={error} />;
  }

  if (!incident) return null;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/incidents')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 rounded"
      >
        <ArrowLeft size={16} /> Back to incidents
      </button>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold text-ink-900">{incident.profile.name}</h1>
            <p className="text-sm text-ink-500">{formatDateTime(incident.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
            <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-500 mb-1">Description</p>
          <p className="text-sm text-ink-800">{incident.description}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-ink-500 mb-1">Location</p>
          <p className="text-sm text-ink-800">{incident.location_text || 'Not specified'}</p>
        </div>

        {photoUrl && (
          <div>
            <p className="text-xs font-medium text-ink-500 mb-1.5">Photo</p>
            <img src={photoUrl} alt="Incident evidence" className="rounded-lg max-h-80 object-cover border border-ink-200" />
          </div>
        )}

        {incident.resolution_note && (
          <div>
            <p className="text-xs font-medium text-ink-500 mb-1">Update / resolution notes</p>
            <p className="text-sm text-ink-800">{incident.resolution_note}</p>
          </div>
        )}

        {incident.status !== 'closed' && (
          <div className="pt-3 border-t border-ink-100 space-y-3">
            <Textarea
              placeholder="Add a note about this update (optional)"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button loading={busy} onClick={handleAdvance}>
              {NEXT_LABEL[incident.status]}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
