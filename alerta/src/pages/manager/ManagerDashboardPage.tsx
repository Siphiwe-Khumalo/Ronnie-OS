import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Users, FileWarning, Siren, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { greeting, firstName, formatDuration } from '@/lib/format';
import {
  acknowledgeSos,
  getAverageAckSeconds,
  getBusinessActiveSosEvents,
  getSosCountThisMonth,
  resolveSos,
} from '@/services/sosService';
import { getOpenIncidentsCount } from '@/services/incidentService';
import { getCheckedInCount, getTotalActiveEmployees } from '@/services/statsService';
import { useRealtimeBusinessSos } from '@/hooks/useRealtimeSos';
import { notifyManagerOfSos, requestNotificationPermission } from '@/services/notificationService';
import type { SosEventWithProfile } from '@/types/database';
import { ActiveEmergencyPanel } from '@/components/manager/ActiveEmergencyPanel';
import { Card, ErrorBanner, Spinner } from '@/components/ui/Primitives';
import { toFriendlyError } from '@/lib/errors';

export function ManagerDashboardPage() {
  const { profile } = useAuth();
  const [activeSos, setActiveSos] = useState<SosEventWithProfile[]>([]);
  const [checkedIn, setCheckedIn] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0);
  const [sosThisMonth, setSosThisMonth] = useState(0);
  const [avgAck, setAvgAck] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [sos, ci, total, incidents, sosCount, avg] = await Promise.all([
        getBusinessActiveSosEvents(profile.business_id),
        getCheckedInCount(profile.business_id),
        getTotalActiveEmployees(profile.business_id),
        getOpenIncidentsCount(profile.business_id),
        getSosCountThisMonth(profile.business_id),
        getAverageAckSeconds(profile.business_id),
      ]);
      setActiveSos(sos);
      setCheckedIn(ci);
      setTotalEmployees(total);
      setOpenIncidents(incidents);
      setSosThisMonth(sosCount);
      setAvgAck(avg);
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useRealtimeBusinessSos(profile?.business_id, (_event, eventType) => {
    if (eventType === 'INSERT') {
      notifyManagerOfSos('An employee');
    }
    load();
  });

  async function handleAcknowledge(id: string) {
    await acknowledgeSos(id);
    await load();
  }

  async function handleResolve(id: string, note: string) {
    await resolveSos(id, note);
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">
        {greeting()}, {firstName(profile?.name)}
      </h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      {activeSos.length > 0 ? (
        <ActiveEmergencyPanel events={activeSos} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center mb-8">
          <ShieldCheck size={36} className="text-emerald-600 mx-auto mb-2" aria-hidden="true" />
          <h2 className="text-lg font-bold text-emerald-800">No active emergencies</h2>
          <p className="text-sm text-emerald-700">You're all clear.</p>
        </div>
      )}

      <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wide mb-3">Today's Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Checked in" value={`${checkedIn} / ${totalEmployees}`} />
        <StatCard icon={FileWarning} label="Open incidents" value={String(openIncidents)} />
        <StatCard icon={Siren} label="SOS this month" value={String(sosThisMonth)} />
        <StatCard icon={Timer} label="Avg. ack time" value={avgAck != null ? formatDuration(avgAck) : '—'} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Icon size={20} className="text-brand-600 mb-2" aria-hidden="true" />
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </Card>
  );
}
