// Browser notifications for the "bus is near" alert.

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

// asks once; returns true when notifications may be shown
export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // older browsers: callback form not supported, treat as denied
    }
  }
  return Notification.permission === "granted";
};

// Android only allows notifications through the service worker, so prefer it
export const showNotification = async (title: string, body: string) => {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options = { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: title };
  try {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration) {
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch (error) {
    console.error("Could not show notification", error);
  }
};
