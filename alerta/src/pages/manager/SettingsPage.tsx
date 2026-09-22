import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getManagerAlerts, getRoster, setManagerAlertEnabled } from '@/services/employeeService';
import type { ManagerAlert, RosterEntry } from '@/types/database';
import { toFriendlyError } from '@/lib/errors';
import { Card, ErrorBanner, Spinner } from '@/components/ui/Primitives';

export function SettingsPage() {
  const { profile } = useAuth();
  const [managers, setManagers] = useState<RosterEntry[]>([]);
  const [alerts, setAlerts] = useState<ManagerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([getRoster(profile.business_id), getManagerAlerts(profile.business_id)])
      .then(([roster, a]) => {
        setManagers(roster.filter((r) => r.role === 'manager' && r.status === 'active'));
        setAlerts(a);
      })
      .catch((err) => setError(toFriendlyError(err)))
      .finally(() => setLoading(false));
  }, [profile]);

  async function toggle(userId: string, enabled: boolean) {
    if (!profile) return;
    try {
      const updated = await setManagerAlertEnabled(profile.business_id, userId, enabled);
      setAlerts((prev) => {
        const others = prev.filter((a) => a.user_id !== userId);
        return [...others, updated];
      });
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't update this setting."));
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
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Settings</h1>
      <p className="text-sm text-ink-500 mb-6">Choose which managers receive emergency alerts.</p>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <Card className="divide-y divide-ink-100">
        {managers.map((manager) => {
          const alertRow = alerts.find((a) => a.user_id === manager.id);
          const enabled = alertRow?.enabled ?? true;
          return (
            <div key={manager.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink-900">{manager.name}</p>
                <p className="text-xs text-ink-500">Receives SOS emergency alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggle(manager.id, e.target.checked)}
                  className="sr-only peer"
                  aria-label={`Toggle emergency alerts for ${manager.name}`}
                />
                <div className="w-11 h-6 bg-ink-200 rounded-full peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
