export interface TrackedBus {
  id: string;
  number: string;
  route: string;
  status: "active" | "inactive";
  coordinates: { lat: number; lng: number } | null;
  speedKmh?: number | null;
  updatedAt: string | null;
}

export type LocationState = "live" | "stale" | "offline";

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export const getLocationState = (bus: TrackedBus, nowMs: number): LocationState => {
  if (bus.status !== "active" || !bus.coordinates || !bus.updatedAt) return "offline";
  const ageMs = nowMs - new Date(bus.updatedAt).getTime();
  return ageMs > STALE_THRESHOLD_MS ? "stale" : "live";
};

export const LOCATION_BADGE: Record<
  LocationState,
  { label: string; className: string; dotClass: string; pingClass?: string }
> = {
  live: { 
    label: "Live Tracking", 
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40",
    dotClass: "bg-emerald-500",
    pingClass: "bg-emerald-400"
  },
  stale: { 
    label: "Delayed Signal", 
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40",
    dotClass: "bg-amber-500",
    pingClass: "bg-amber-400"
  },
  offline: { 
    label: "At Depot", 
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400"
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
