import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Copy, Plus, UserCog, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  buildInviteUrl,
  createInvite,
  getPendingInvites,
  getRoster,
  revokeInvite,
  setEmployeeStatus,
} from '@/services/employeeService';
import { toFriendlyError } from '@/lib/errors';
import type { Invite, RosterEntry } from '@/types/database';
import { Badge, Card, ErrorBanner, Input, Label, Select, Spinner } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

export function EmployeesPage() {
  const { profile } = useAuth();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [r, i] = await Promise.all([getRoster(profile.business_id), getPendingInvites(profile.business_id)]);
      setRoster(r);
      setInvites(i);
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't load your team."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleStatus(entry: RosterEntry) {
    setError(null);
    try {
      await setEmployeeStatus(entry.id, entry.status === 'active' ? 'inactive' : 'active');
      await load();
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't update this employee."));
    }
  }

  async function handleRevoke(inviteId: string) {
    try {
      await revokeInvite(inviteId);
      await load();
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't revoke this invite."));
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Employees</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add employee
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {showForm && (
        <AddEmployeeForm
          businessId={profile!.business_id}
          managerId={profile!.id}
          onClose={() => setShowForm(false)}
          onCreated={(url) => {
            setLastInviteUrl(url);
            setShowForm(false);
            load();
          }}
        />
      )}

      {lastInviteUrl && (
        <Card className="p-4 mb-6 bg-brand-50 border-brand-200">
          <p className="text-sm font-medium text-brand-800 mb-2">Invite created! Share this link with them:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded px-2 py-1.5 border border-brand-200 truncate">
              {lastInviteUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(lastInviteUrl)}
              aria-label="Copy invite link"
            >
              <Copy size={14} />
            </Button>
          </div>
        </Card>
      )}

      {invites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wide mb-2">Pending invites</h2>
          <Card className="divide-y divide-ink-100">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{invite.name}</p>
                  <p className="text-xs text-ink-500">{invite.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Pending</Badge>
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    aria-label={`Revoke invite for ${invite.name}`}
                    className="p-1.5 rounded hover:bg-ink-100 text-ink-400 hover:text-emergency-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wide mb-2">Team</h2>
      <Card className="divide-y divide-ink-100">
        {roster.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                <UserCog size={18} className="text-ink-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">{entry.name}</p>
                <p className="text-xs text-ink-500 capitalize">{entry.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={entry.status === 'active' ? 'success' : 'neutral'}>{entry.status}</Badge>
              {entry.id !== profile?.id && (
                <Button size="sm" variant="outline" onClick={() => handleToggleStatus(entry)}>
                  {entry.status === 'active' ? 'Deactivate' : 'Reactivate'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AddEmployeeForm({
  businessId,
  managerId,
  onClose,
  onCreated,
}: {
  businessId: string;
  managerId: string;
  onClose: () => void;
  onCreated: (inviteUrl: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'employee' | 'manager'>('employee');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const invite = await createInvite({ businessId, createdBy: managerId, name, email, phone, role });
      onCreated(buildInviteUrl(invite.invite_code));
    } catch (err) {
      setError(toFriendlyError(err, "We couldn't create this invite."));
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Add employee</h2>
        <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-ink-100 text-ink-400">
          <X size={18} />
        </button>
      </div>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" value={role} onChange={(e) => setRole(e.target.value as 'employee' | 'manager')}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" loading={busy}>
            Create invite
          </Button>
        </div>
      </form>
    </Card>
  );
}
