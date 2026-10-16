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

export const LOCATION_BADGE: Record<LocationState, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  stale: { label: "Stale", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  offline: { label: "Not running", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
};

export const formatLastUpdated = (updatedAt: string | null, nowMs: number) => {
  if (!updatedAt) return "No location update yet";
  const ageMs = Math.max(0, nowMs - new Date(updatedAt).getTime());
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return "Updated just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
};
