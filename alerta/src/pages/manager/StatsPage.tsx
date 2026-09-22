import { useEffect, useState } from 'react';
import { CalendarCheck, FileWarning, Siren, Timer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAverageAckSeconds, getSosCountThisMonth } from '@/services/sosService';
import { getIncidentsThisMonthCount } from '@/services/incidentService';
import { getCheckInsToday } from '@/services/statsService';
import { formatDuration } from '@/lib/format';
import { Card, Spinner } from '@/components/ui/Primitives';

export function StatsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkInsToday, setCheckInsToday] = useState(0);
  const [incidentsMonth, setIncidentsMonth] = useState(0);
  const [sosMonth, setSosMonth] = useState(0);
  const [avgAck, setAvgAck] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getCheckInsToday(profile.business_id),
      getIncidentsThisMonthCount(profile.business_id),
      getSosCountThisMonth(profile.business_id),
      getAverageAckSeconds(profile.business_id),
    ])
      .then(([ci, im, sm, avg]) => {
        setCheckInsToday(ci);
        setIncidentsMonth(im);
        setSosMonth(sm);
        setAvgAck(avg);
      })
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Stats</h1>
      <p className="text-sm text-ink-500 mb-6">A simple snapshot of safety activity.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Check-ins today" value={String(checkInsToday)} />
        <StatCard icon={FileWarning} label="Incidents this month" value={String(incidentsMonth)} />
        <StatCard icon={Siren} label="SOS events this month" value={String(sosMonth)} />
        <StatCard icon={Timer} label="Avg. SOS ack time" value={avgAck != null ? formatDuration(avgAck) : '—'} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof CalendarCheck; label: string; value: string }) {
  return (
    <Card className="p-5">
      <Icon size={22} className="text-brand-600 mb-3" aria-hidden="true" />
      <p className="text-3xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500 mt-1">{label}</p>
    </Card>
  );
}
