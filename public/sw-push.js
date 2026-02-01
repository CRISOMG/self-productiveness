// Service Worker for Web Push Notifications
// Receives push events and displays native notifications

self.addEventListener("push", function (event) {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "YourFocus";
    const options = {
        body: data.body || "Tienes una notificación",
        icon: data.icon || "/check-focus.png",
        badge: data.badge || "/check-focus.png",
        data: {
            url: data.url || "/",
            timestamp: data.timestamp || Date.now(),
        },
        tag: "pomodoro-notification",
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (windowClients) {
                // Try to focus an existing window
                for (const client of windowClients) {
                    if (client.url.includes(urlToOpen) && "focus" in client) {
                        return client.focus();
                    }
                }
                // Open a new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle service worker activation
self.addEventListener("activate", function (event) {
    event.waitUntil(clients.claim());
});
