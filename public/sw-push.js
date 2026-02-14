self.addEventListener("push", (event) => {
  let data = {
    title: "Soundwalk",
    body: "You have a new update.",
    tag: "soundwalk-notification",
    url: "/admin",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (_error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/admin";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
        return undefined;
      })
  );
});
