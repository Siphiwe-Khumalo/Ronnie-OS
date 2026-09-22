import { User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Primitives';

export function EmployeeProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-ink-900">My Profile</h1>

      <Card className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <User size={26} className="text-brand-700" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-ink-900">{profile?.name}</p>
          <p className="text-sm text-ink-500">{profile?.email}</p>
          <p className="text-sm text-ink-500 capitalize">{profile?.role}</p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="text-brand-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-sm text-ink-900">Your privacy, protected</p>
            <p className="text-sm text-ink-500 mt-1">
              Alerta never tracks your location in the background. GPS is only captured the moment you trigger an
              emergency SOS alert, so help can find you.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
