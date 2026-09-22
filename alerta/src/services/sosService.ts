import { supabase } from '@/lib/supabase';
import type { SosEvent, SosEventWithProfile } from '@/types/database';

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * Captures exactly ONE GPS fix. This is the only place in the entire
 * codebase allowed to call navigator.geolocation. It resolves with
 * `null` rather than throwing when location is unavailable/denied,
 * because per product requirements an SOS must NEVER fail just because
 * GPS could not be obtained.
 */
export function captureOneTimeLocation(timeoutMs = 8000): Promise<CapturedLocation | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}

export async function createSosEvent(
  userId: string,
  businessId: string,
  location: CapturedLocation | null
): Promise<SosEvent> {
  const { data, error } = await supabase
    .from('sos_events')
    .insert({
      user_id: userId,
      business_id: businessId,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      location_accuracy_m: location?.accuracy ?? null,
      status: 'active',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMySosEvent(sosId: string): Promise<SosEvent> {
  const { data, error } = await supabase.from('sos_events').select('*').eq('id', sosId).single();
  if (error) throw error;
  return data;
}

export async function getMyActiveSos(userId: string): Promise<SosEvent | null> {
  const { data, error } = await supabase
    .from('sos_events')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'acknowledged'])
    .order('triggered_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBusinessActiveSosEvents(businessId: string): Promise<SosEventWithProfile[]> {
  const { data, error } = await supabase
    .from('sos_events')
    .select('*, profile:profiles(id, name, phone)')
    .eq('business_id', businessId)
    .in('status', ['active', 'acknowledged'])
    .order('triggered_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SosEventWithProfile[];
}

export async function getBusinessSosHistory(businessId: string, limit = 50): Promise<SosEventWithProfile[]> {
  const { data, error } = await supabase
    .from('sos_events')
    .select('*, profile:profiles(id, name, phone)')
    .eq('business_id', businessId)
    .order('triggered_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as SosEventWithProfile[];
}

export async function acknowledgeSos(sosId: string): Promise<SosEvent> {
  const { data, error } = await supabase
    .from('sos_events')
    .update({ status: 'acknowledged' })
    .eq('id', sosId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function resolveSos(sosId: string, resolutionNote: string): Promise<SosEvent> {
  const { data, error } = await supabase
    .from('sos_events')
    .update({ status: 'resolved', resolution_note: resolutionNote })
    .eq('id', sosId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Average seconds between trigger and acknowledgement, for resolved/acknowledged events this month. */
export async function getAverageAckSeconds(businessId: string): Promise<number | null> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sos_events')
    .select('triggered_at, acknowledged_at')
    .eq('business_id', businessId)
    .not('acknowledged_at', 'is', null)
    .gte('triggered_at', startOfMonth.toISOString());
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const totalSeconds = data.reduce((sum, row) => {
    const triggered = new Date(row.triggered_at).getTime();
    const acknowledged = new Date(row.acknowledged_at as string).getTime();
    return sum + (acknowledged - triggered) / 1000;
  }, 0);
  return totalSeconds / data.length;
}

export async function getSosCountThisMonth(businessId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('sos_events')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('triggered_at', startOfMonth.toISOString());
  if (error) throw error;
  return count ?? 0;
}
