import { restauranteApi } from '@/api';

let registration: Promise<ServiceWorkerRegistration> | null = null;
let synchronization: Promise<boolean> | null = null;

export type SystemNotificationStatus =
  | 'unsupported'
  | 'permission-required'
  | 'permission-denied'
  | 'subscribing'
  | 'subscribed'
  | 'error';

function report(status: SystemNotificationStatus, message?: string) {
  window.dispatchEvent(
    new CustomEvent('system-notification-status', {
      detail: { status, message }
    })
  );
  if (status === 'error')
    console.error('[Web Push]', message || 'Error desconocido');
}

function serviceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  registration ??= navigator.serviceWorker.register('/notification-sw.js', {
    scope: '/',
    updateViaCache: 'none'
  });
  return registration;
}

function applicationServerKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

async function retry<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      if ((status && status < 500) || attempt === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}

async function persistSubscription() {
  const worker = await serviceWorkerRegistration();
  if (!worker || Notification.permission !== 'granted') return false;
  await navigator.serviceWorker.ready;
  let subscription = await worker.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await retry(() =>
      restauranteApi.get<{ publicKey: string }>(
        '/push-subscriptions/vapid-public-key'
      )
    );
    subscription = await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(data.publicKey)
    });
  }
  await retry(() =>
    restauranteApi.post('/push-subscriptions', subscription!.toJSON())
  );
  localStorage.setItem('web-push-subscribed-at', new Date().toISOString());
  return true;
}

export async function activateSystemNotifications(requestPermission = false) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    report('unsupported');
    return false;
  }
  if (Notification.permission === 'default' && !requestPermission) {
    report('permission-required');
    return false;
  }
  if (Notification.permission === 'default')
    await Notification.requestPermission();
  if (Notification.permission !== 'granted') {
    report('permission-denied');
    return false;
  }
  if (synchronization) return synchronization;
  report('subscribing');
  synchronization = persistSubscription()
    .then((subscribed) => {
      report(subscribed ? 'subscribed' : 'error');
      return subscribed;
    })
    .catch((error) => {
      report('error', error instanceof Error ? error.message : String(error));
      return false;
    })
    .finally(() => {
      synchronization = null;
    });
  return synchronization;
}

export function initializeSystemNotifications() {
  void serviceWorkerRegistration()?.catch((error) =>
    report('error', error instanceof Error ? error.message : String(error))
  );
  void activateSystemNotifications(false);

  const retryWhenOnline = () => {
    if (Notification.permission === 'granted')
      void activateSystemNotifications(false);
  };
  window.addEventListener('online', retryWhenOnline);
  return () => window.removeEventListener('online', retryWhenOnline);
}
