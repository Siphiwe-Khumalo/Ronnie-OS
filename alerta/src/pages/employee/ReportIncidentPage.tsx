import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createIncident } from '@/services/incidentService';
import { toFriendlyError } from '@/lib/errors';
import type { IncidentSeverity } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { ErrorBanner, Input, Label, Textarea } from '@/components/ui/Primitives';

const SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'serious', label: 'Serious' },
];

export function ReportIncidentPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('minor');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSubmitting(true);
    try {
      await createIncident({
        userId: profile.id,
        businessId: profile.business_id,
        description,
        locationText,
        severity,
        photoFile: photo,
      });
      setSuccess(true);
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't submit your report. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="px-4 py-16 text-center">
        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink-900">Incident reported successfully.</h1>
        <p className="text-sm text-ink-500 mt-1 mb-6">Your managers can see it now.</p>
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-ink-900 mb-1">Report Incident</h1>
      <p className="text-sm text-ink-500 mb-6">Let your managers know what happened.</p>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="description">What happened?</Label>
          <Textarea
            id="description"
            required
            rows={4}
            placeholder="Describe what happened…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="e.g. Site B, east scaffold"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </div>

        <div>
          <Label>Severity</Label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                aria-pressed={severity === s.value}
                className={`py-2.5 rounded-lg text-sm font-semibold border focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  severity === s.value
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="photo">Photo (optional)</Label>
          <label
            htmlFor="photo"
            className="flex items-center gap-2 justify-center border-2 border-dashed border-ink-200 rounded-lg py-6 cursor-pointer hover:bg-ink-50 text-ink-500"
          >
            <Camera size={20} aria-hidden="true" />
            <span className="text-sm">{photo ? photo.name : 'Add a photo'}</span>
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Submit report
        </Button>
      </form>
    </div>
  );
}
