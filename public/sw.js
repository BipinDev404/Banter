// Banter PWA & Background Notification Service Worker
// Provides native mobile OS lockscreen & notification shade alerts

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Direct message listener to display notifications from background or main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        renotify: true,
        ...options,
      })
    );
  }
});

// Handle clicking on background notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and notify client
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          });
          return client.focus();
        }
      }
      // If no window is currently open (user exited the app), open a fresh one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Web Push event listener (for native mobile push notifications)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Banter • Live Chat',
    body: 'New chat activity on Banter! Tap to join the conversation.',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Banter • Live Chat';
  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || `banter_${Date.now()}`,
    vibrate: [200, 100, 200],
    data: data.data || {},
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
