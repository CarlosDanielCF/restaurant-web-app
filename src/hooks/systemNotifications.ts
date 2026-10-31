import { restauranteApi } from '@/api';

let registration: Promise<ServiceWorkerRegistration> | null = null;

function serviceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  registration ??= navigator.serviceWorker.register('/notification-sw.js');
  return registration;
}

function applicationServerKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

async function persistSubscription() {
  const worker = await serviceWorkerRegistration();
  if (!worker || Notification.permission !== 'granted') return false;
  let subscription = await worker.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await restauranteApi.get<{ publicKey: string }>(
      '/push-subscriptions/vapid-public-key'
    );
    subscription = await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(data.publicKey)
    });
  }
  await restauranteApi.post('/push-subscriptions', subscription.toJSON());
  return true;
}

export function initializeSystemNotifications() {
  if (!('Notification' in window)) return () => undefined;
  void serviceWorkerRegistration()?.catch(() => undefined);
  if (Notification.permission === 'granted') {
    void persistSubscription().catch(() => undefined);
    return () => undefined;
  }
  if (Notification.permission !== 'default') return () => undefined;

  const request = () => {
    void Notification.requestPermission()
      .then((permission) =>
        permission === 'granted' ? persistSubscription() : false
      )
      .catch(() => undefined);
  };
  window.addEventListener('pointerdown', request, { once: true });
  return () => window.removeEventListener('pointerdown', request);
}

export async function disableSystemNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const worker = await navigator.serviceWorker.getRegistration();
  const subscription = await worker?.pushManager.getSubscription();
  if (!subscription) return;
  await restauranteApi
    .delete('/push-subscriptions', {
      data: { endpoint: subscription.endpoint }
    })
    .catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}
