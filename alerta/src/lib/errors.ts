// Central place to turn raw Supabase/network/browser errors into calm,
// human-readable copy. Nothing in the UI should ever show a raw
// PostgREST/Postgres error message to a normal user.

export class AlertaError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AlertaError';
    this.cause = cause;
  }
}

/** Postgres unique-violation code, used to detect "already checked in". */
const PG_UNIQUE_VIOLATION = '23505';

export function toFriendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof AlertaError) return err.message;

  if (isOffline()) {
    return "You're offline. Check your connection and try again.";
  }

  const code = (err as { code?: string } | null)?.code;
  const message = (err as { message?: string } | null)?.message ?? '';

  if (code === PG_UNIQUE_VIOLATION || message.includes('idx_shifts_one_active_per_user')) {
    return "You're already checked in.";
  }
  if (message.toLowerCase().includes('invite')) {
    return 'This invite link is invalid or has already been used.';
  }
  if (message.toLowerCase().includes('resolution note')) {
    return 'Please add a short resolution note before resolving this emergency.';
  }
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.toLowerCase().includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email address before logging in.';
  }
  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return fallback;
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
