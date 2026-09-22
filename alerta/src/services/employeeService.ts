import { supabase } from '@/lib/supabase';
import type { Invite, ManagerAlert, Profile, RosterEntry } from '@/types/database';

export async function getRoster(businessId: string): Promise<RosterEntry[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true });
  if (error) throw error;

  const { data: activeShifts, error: shiftsError } = await supabase
    .from('shifts')
    .select('*')
    .eq('business_id', businessId)
    .is('checked_out_at', null);
  if (shiftsError) throw shiftsError;

  const shiftByUser = new Map(activeShifts?.map((s) => [s.user_id, s]));

  return (profiles ?? []).map((p) => ({
    ...p,
    active_shift: shiftByUser.get(p.id) ?? null,
  }));
}

export async function setEmployeeStatus(profileId: string, status: 'active' | 'inactive'): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', profileId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * "Adding an employee" creates a pending invite; the frontend has no
 * service-role key so it cannot create the person's login directly. The
 * manager shares the resulting invite link/code with the new hire, who
 * creates their own password when they claim it. See supabase/README.md.
 */
export async function createInvite(input: {
  businessId: string;
  createdBy: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'employee' | 'manager';
}): Promise<Invite> {
  const inviteCode = generateInviteCode();
  const { data, error } = await supabase
    .from('invites')
    .insert({
      business_id: input.businessId,
      created_by: input.createdBy,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      role: input.role ?? 'employee',
      invite_code: inviteCode,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getPendingInvites(businessId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from('invites').update({ status: 'revoked' }).eq('id', inviteId);
  if (error) throw error;
}

function generateInviteCode(): string {
  // Short, human-shareable code (not a security boundary by itself — the
  // RPC that consumes it validates status='pending' and is single-use).
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes)
    .map((b) => b.toString(36))
    .join('')
    .slice(0, 8)
    .toUpperCase();
}

export function buildInviteUrl(inviteCode: string): string {
  return `${window.location.origin}/join/${inviteCode}`;
}

// --- Manager alert recipients ---------------------------------------

export async function getManagerAlerts(businessId: string): Promise<ManagerAlert[]> {
  const { data, error } = await supabase.from('manager_alerts').select('*').eq('business_id', businessId);
  if (error) throw error;
  return data ?? [];
}

export async function setManagerAlertEnabled(
  businessId: string,
  userId: string,
  enabled: boolean
): Promise<ManagerAlert> {
  const { data, error } = await supabase
    .from('manager_alerts')
    .upsert({ business_id: businessId, user_id: userId, enabled }, { onConflict: 'business_id,user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
