// Service Worker for FruitLane B2B Rich Push Notifications
const CACHE_NAME = "fruitlane-v1";

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated.");
  event.waitUntil(self.clients.claim());
});

// Listen for Push Events from Web Push / Socket / Server
self.addEventListener("push", (event) => {
  let data = {
    title: "🥭 FruitLane Wholesale",
    message: "New fresh fruit crates available at today's wholesale prices!",
    icon: "/fruitlane-icon.svg",
    actionText: "Order Now"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message || data.body,
    icon: data.icon || "/fruitlane-icon.svg",
    badge: "/fruitlane-icon.svg",
    image: data.imageUrl || data.image || undefined,
    vibrate: [200, 100, 200],
    tag: data._id || "fruitlane-push",
    renotify: true,
    data: {
      url: data.deepLink || "/"
    },
    actions: [
      { action: "open", title: `🛒 ${data.actionText || "Order Now"}` },
      { action: "close", title: "Dismiss" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle Notification Click on Mobile Lock Screen / Shade
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
