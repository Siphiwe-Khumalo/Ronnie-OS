import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SosEvent } from '@/types/database';

/**
 * Subscribes to Postgres changes on `sos_events` for a given business so
 * manager dashboards update the instant an SOS is triggered, acknowledged,
 * or resolved — no polling required. This does NOT track location
 * continuously; it only reacts to rows the app already wrote via an
 * explicit SOS action.
 */
export function useRealtimeBusinessSos(
  businessId: string | undefined,
  onChange: (event: SosEvent, eventType: 'INSERT' | 'UPDATE') => void
) {
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`sos-business-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_events', filter: `business_id=eq.${businessId}` },
        (payload) => onChange(payload.new as SosEvent, 'INSERT')
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sos_events', filter: `business_id=eq.${businessId}` },
        (payload) => onChange(payload.new as SosEvent, 'UPDATE')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);
}

/** Subscribes to updates on a single SOS event (used by the employee's own status screen). */
export function useRealtimeSosEvent(sosId: string | undefined, onUpdate: (event: SosEvent) => void) {
  useEffect(() => {
    if (!sosId) return;

    const channel = supabase
      .channel(`sos-event-${sosId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sos_events', filter: `id=eq.${sosId}` },
        (payload) => onUpdate(payload.new as SosEvent)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosId]);
}

export function useRealtimeBusinessIncidents(businessId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`incidents-business-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents', filter: `business_id=eq.${businessId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);
}

export function useRealtimeBusinessShifts(businessId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`shifts-business-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `business_id=eq.${businessId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);
}
