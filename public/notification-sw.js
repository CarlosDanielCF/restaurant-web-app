self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let message;
  try {
    message = event.data?.json();
  } catch (error) {
    console.error('[Web Push] Payload inválido', error);
  }
  if (!message) return;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        if (windows.some((client) => client.focused || client.visibilityState === 'visible'))
          return;
        return self.registration.showNotification(message.title, {
          body: message.body,
          tag: message.tag || message.eventId,
          icon: '/branding/point-restaurant-logo.png',
          data: { url: message.url, eventId: message.eventId }
        });
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (windows) => {
        const current = windows.find(
          (client) => new URL(client.url).origin === self.location.origin
        );
        if (current) {
          await current.navigate(target);
          return current.focus();
        }
        return self.clients.openWindow(target);
      })
  );
});
