// Hand-authored types mirroring the Supabase schema in
// supabase/migrations/. Keep these in sync with the SQL — if you add a
// column there, add it here too.

export type UserRole = 'employee' | 'manager';
export type UserStatus = 'active' | 'inactive';
export type SosStatus = 'active' | 'acknowledged' | 'resolved';
export type IncidentSeverity = 'minor' | 'moderate' | 'serious';
export type IncidentStatus = 'open' | 'investigating' | 'closed';
export type InviteStatus = 'pending' | 'claimed' | 'revoked';

export interface Business {
  id: string;
  name: string;
  plan: 'starter' | 'pro';
  created_at: string;
}

export interface Profile {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Invite {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  invite_code: string;
  status: InviteStatus;
  created_by: string | null;
  claimed_by: string | null;
  created_at: string;
  claimed_at: string | null;
}

export interface Shift {
  id: string;
  user_id: string;
  business_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  created_at: string;
}

export interface SosEvent {
  id: string;
  business_id: string;
  user_id: string;
  triggered_at: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  status: SosStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  business_id: string;
  user_id: string;
  description: string;
  location_text: string | null;
  severity: IncidentSeverity;
  photo_url: string | null;
  status: IncidentStatus;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagerAlert {
  id: string;
  business_id: string;
  user_id: string;
  enabled: boolean;
  created_at: string;
}

// Convenience joined shapes used by the UI layer.

export interface SosEventWithProfile extends SosEvent {
  profile: Pick<Profile, 'id' | 'name' | 'phone'>;
}

export interface IncidentWithProfile extends Incident {
  profile: Pick<Profile, 'id' | 'name'>;
}

export interface RosterEntry extends Profile {
  active_shift: Shift | null;
}
