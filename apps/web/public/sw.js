/* Service worker Mwinda Market : reçoit les notifications push (messages, commandes) et ouvre la bonne page au toucher. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'Mwinda Market', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Mwinda Market', {
    body: d.body || '',
    icon: '/images/brand/favicon-192.png',
    badge: '/images/brand/favicon-96.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    vibrate: [120, 60, 120],
    data: { url: d.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
