// Browser (Web Push / Notification API) notifications for managers, plus
// a documented extension point for SMS.
//
// What's implemented now:
//   * Local browser notifications via the Notification API, shown when a
//     manager's own tab/device receives a realtime SOS event while the
//     app is open (or backgrounded, via the service worker showing the
//     notification). This requires no external service or secret.
//
// What's intentionally NOT implemented:
//   * True push-when-the-app-is-fully-closed requires a push subscription
//     (VAPID keys) plus a server component to call the Web Push protocol
//     with the service_role key — that server-side sending step cannot
//     live in this frontend-only repo without exposing secrets. The
//     `VITE_VAPID_PUBLIC_KEY` env var and `subscribeToPush()` below are
//     wired up so a small serverless function (e.g. a Supabase Edge
//     Function using web-push + the service role key, never in the
//     browser) can be added later without any frontend rework.
//   * SMS notifications: see `smsNotifier` interface below. No SMS
//     provider credentials are fabricated. Wire up a real provider by
//     implementing `SmsNotifier` in a server-side function (Supabase Edge
//     Function) — never call an SMS provider directly from the browser,
//     since that would require shipping its secret API key to the client.

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function notifyManagerOfSos(employeeName: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification('🚨 Emergency alert', {
      body: `${employeeName} has triggered an SOS. Open Alerta to respond.`,
      tag: 'alerta-sos',
      requireInteraction: true,
    });
  } catch {
    // Notifications are best-effort; never let a notification failure
    // affect the actual SOS/acknowledgement flow.
  }
}

/**
 * Registers a push subscription with the browser's push service using
 * VITE_VAPID_PUBLIC_KEY. Storing/using this subscription server-side to
 * actually send a push is NOT implemented here (see file header) — this
 * function alone enables the groundwork without requiring secrets in the
 * frontend.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * SMS notification abstraction. Deliberately unimplemented in the
 * frontend: any real implementation needs a provider secret (e.g. Twilio
 * Account SID/Auth Token) that must live in a server-side function, not
 * this repo's client bundle.
 *
 * To wire up real SMS alerts:
 *   1. Create a Supabase Edge Function (e.g. `notify-sos-sms`) that reads
 *      TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER from
 *      its own environment (set via `supabase secrets set`), and sends an
 *      SMS to each enabled manager_alerts recipient's phone number.
 *   2. Trigger that function from a Postgres webhook/trigger on
 *      `sos_events` INSERT, or call it from this service via
 *      `supabase.functions.invoke('notify-sos-sms', { body: { sosId } })`
 *      right after `createSosEvent()` succeeds.
 *   3. Until that function exists, `smsNotifier.send()` below is a no-op
 *      that resolves successfully — it never blocks or fails the SOS
 *      flow, and it never fabricates a "sent" state to the user.
 */
export interface SmsNotifier {
  send(input: { toPhone: string; message: string }): Promise<{ sent: boolean }>;
}

export const smsNotifier: SmsNotifier = {
  async send() {
    // Not configured. See docstring above for how to enable this.
    return { sent: false };
  },
};
