import { supabase } from '@/lib/supabase';

export interface TodayOverview {
  checkedInCount: number;
  totalEmployees: number;
  openIncidentsCount: number;
  sosThisMonthCount: number;
  avgAckSeconds: number | null;
}

export async function getCheckedInCount(businessId: string): Promise<number> {
  const { count, error } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .is('checked_out_at', null);
  if (error) throw error;
  return count ?? 0;
}

export async function getTotalActiveEmployees(businessId: string): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

export async function getCheckInsToday(businessId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('checked_in_at', startOfDay.toISOString());
  if (error) throw error;
  return count ?? 0;
}
