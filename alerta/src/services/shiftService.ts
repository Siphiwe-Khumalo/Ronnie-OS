import { supabase } from '@/lib/supabase';
import type { Shift } from '@/types/database';

export async function getActiveShift(userId: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .is('checked_out_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function checkIn(userId: string, businessId: string): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .insert({ user_id: userId, business_id: businessId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function checkOut(shiftId: string): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', shiftId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMyRecentShifts(userId: string, limit = 10): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** All shifts today for a business — used by the roster + today's overview. */
export async function getTodayShifts(businessId: string): Promise<Shift[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('business_id', businessId)
    .gte('checked_in_at', startOfDay.toISOString())
    .order('checked_in_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getActiveShiftsForBusiness(businessId: string): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('business_id', businessId)
    .is('checked_out_at', null);
  if (error) throw error;
  return data ?? [];
}
