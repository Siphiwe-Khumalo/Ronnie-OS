import { supabase } from '@/lib/supabase';
import { AlertaError } from '@/lib/errors';
import type { Incident, IncidentStatus, IncidentWithProfile } from '@/types/database';

const PHOTO_BUCKET = 'incident-photos';
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

export interface CreateIncidentInput {
  userId: string;
  businessId: string;
  description: string;
  locationText: string;
  severity: Incident['severity'];
  photoFile?: File | null;
}

async function uploadIncidentPhoto(
  businessId: string,
  userId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new AlertaError('That photo is too large. Please choose one under 8MB.');
  }
  if (!file.type.startsWith('image/')) {
    throw new AlertaError('Please choose an image file for the incident photo.');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${businessId}/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw new AlertaError("We couldn't upload your photo. Your incident can still be submitted without it.", error);
  }
  return path;
}

/** Resolves a stored object path to a temporary signed URL for display. */
export async function getSignedPhotoUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

export async function createIncident(input: CreateIncidentInput): Promise<Incident> {
  let photoPath: string | null = null;

  if (input.photoFile) {
    try {
      photoPath = await uploadIncidentPhoto(input.businessId, input.userId, input.photoFile);
    } catch {
      // Photo upload failures should never block the incident report itself.
      photoPath = null;
    }
  }

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      user_id: input.userId,
      business_id: input.businessId,
      description: input.description.trim(),
      location_text: input.locationText.trim() || null,
      severity: input.severity,
      photo_url: photoPath,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMyIncidents(userId: string, limit = 20): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getBusinessIncidents(businessId: string): Promise<IncidentWithProfile[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, profile:profiles(id, name)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as IncidentWithProfile[];
}

export async function getIncidentById(incidentId: string): Promise<IncidentWithProfile> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, profile:profiles(id, name)')
    .eq('id', incidentId)
    .single();
  if (error) throw error;
  return data as unknown as IncidentWithProfile;
}

export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus,
  resolutionNote?: string
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .update({ status, ...(resolutionNote ? { resolution_note: resolutionNote } : {}) })
    .eq('id', incidentId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getOpenIncidentsCount(businessId: string): Promise<number> {
  const { count, error } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['open', 'investigating']);
  if (error) throw error;
  return count ?? 0;
}

export async function getIncidentsThisMonthCount(businessId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString());
  if (error) throw error;
  return count ?? 0;
}
