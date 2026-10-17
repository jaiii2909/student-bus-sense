export interface TrackedBus {
  id: string;
  number: string;
  route: string;
  status: "active" | "inactive";
  coordinates: { lat: number; lng: number } | null;
  updatedAt: string | null;
}

export type LocationState = "live" | "stale" | "offline";

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export const getLocationState = (bus: TrackedBus, nowMs: number): LocationState => {
  if (bus.status !== "active" || !bus.coordinates || !bus.updatedAt) return "offline";
  const ageMs = nowMs - new Date(bus.updatedAt).getTime();
  return ageMs > STALE_THRESHOLD_MS ? "stale" : "live";
};

export const LOCATION_BADGE: Record<LocationState, { label: string; className: string; dotClass: string }> = {
  live: { 
    label: "On Route", 
    className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-600 dark:bg-emerald-400"
  },
  stale: { 
    label: "Signal Delayed", 
    className: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-600 dark:bg-amber-400"
  },
  offline: { 
    label: "At Depot", 
    className: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700",
    dotClass: "bg-stone-400"
  },
};

export const formatLastUpdated = (updatedAt: string | null, nowMs: number) => {
  if (!updatedAt) return "No location fix yet";
  const ageMs = Math.max(0, nowMs - new Date(updatedAt).getTime());
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 10) return "GPS synced just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
