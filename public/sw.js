// Service worker: makes the app installable and shows "bus is near" notifications.
// It intentionally caches nothing, so every deploy is picked up right away.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// tapping a notification brings the open app to the front, or opens it
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      return open ? open.focus() : self.clients.openWindow("/student-login");
    })
  );
});
