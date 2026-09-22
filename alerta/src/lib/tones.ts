import type { IncidentSeverity, IncidentStatus } from '@/types/database';

export function severityTone(severity: IncidentSeverity): 'success' | 'warning' | 'danger' {
  if (severity === 'serious') return 'danger';
  if (severity === 'moderate') return 'warning';
  return 'success';
}

export function statusTone(status: IncidentStatus): 'neutral' | 'warning' | 'success' {
  if (status === 'open') return 'warning';
  if (status === 'investigating') return 'neutral';
  return 'success';
}
