import { TrackedBus } from "./busStatus";

export interface Stop {
  name: string;
  lat: number;
  lng: number;
}

// straight-line distance between two points in km
export const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// roads are longer than a straight line; this is a common rough factor
const ROAD_FACTOR = 1.3;
const FALLBACK_SPEED_KMH = 25;
const ARRIVING_KM = 0.15;

// Rough ETA from the bus to a stop. Uses the phone GPS speed when the bus is
// moving at a normal speed, otherwise a typical city bus speed.
export const etaText = (bus: TrackedBus, stop: Stop) => {
  if (!bus.coordinates) return null;
  const km = distanceKm(bus.coordinates, stop) * ROAD_FACTOR;
  if (km <= ARRIVING_KM) return `Arriving at ${stop.name}`;

  const speed = bus.speedKmh && bus.speedKmh >= 10 ? Math.min(bus.speedKmh, 60) : FALLBACK_SPEED_KMH;
  const minutes = Math.max(1, Math.round((km / speed) * 60));
  return `~${minutes} min to ${stop.name}`;
};
