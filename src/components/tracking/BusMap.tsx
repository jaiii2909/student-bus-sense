import { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  MapPin, 
  Navigation, 
  Gauge, 
  Clock, 
  Crosshair, 
  Radio, 
  Compass, 
  CheckCircle2,
  Info,
  Layers,
  type LucideIcon 
} from "lucide-react";
import MapView, { MapMarker } from "../MapView";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";
import { Stop, etaText, distanceKm } from "@/lib/eta";

interface BusMapProps {
  bus: TrackedBus | null;
  nowMs: number;
  stops?: Stop[];
  myStop?: Stop | null;
}

const Placeholder = ({
  icon: Icon,
  title,
  text,
  subtext,
  badgeText,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  subtext?: string;
  badgeText?: string;
}) => (
  <div className="h-full min-h-[420px] flex items-center justify-center bg-muted/40 p-8 text-center relative overflow-hidden">
    {/* Subtle Background Pattern */}
    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
    
    <div className="max-w-sm space-y-4 relative z-10">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shadow-sm">
          <Icon className="w-7 h-7" />
        </div>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent animate-ping" />
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent" />
      </div>

      <div className="space-y-1.5">
        {badgeText && (
          <span className="inline-block text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-1">
            {badgeText}
          </span>
        )}
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
        {subtext && (
          <p className="text-2xs text-muted-foreground/80 font-mono pt-1">{subtext}</p>
        )}
      </div>
    </div>
  </div>
);

const BusMap = ({ bus, nowMs, stops = [], myStop = null }: BusMapProps) => {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const handleMapLoad = (map: google.maps.Map) => {
    mapInstanceRef.current = map;
  };

  // Re-center map to current bus coordinates
  const handleCenterOnBus = () => {
    if (mapInstanceRef.current && bus?.coordinates) {
      mapInstanceRef.current.panTo(bus.coordinates);
      mapInstanceRef.current.setZoom(16);
    }
  };

  // Fit map bounds to view all route stops and bus position
  const handleFitRouteBounds = () => {
    if (!mapInstanceRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (bus?.coordinates) {
      bounds.extend(bus.coordinates);
      hasPoints = true;
    }

    stops.forEach((stop) => {
      bounds.extend(stop);
      hasPoints = true;
    });

    if (hasPoints) {
      mapInstanceRef.current.fitBounds(bounds, 60);
    }
  };

  if (!bus) {
    return (
      <Placeholder
        icon={Bus}
        badgeText="Transit Radar Ready"
        title="Select Vehicle to Track"
        text="Choose an authorized corridor and click on any scheduled bus to view real-time satellite telemetry."
      />
    );
  }

  if (!bus.coordinates) {
    return (
      <Placeholder
        icon={Navigation}
        badgeText="GPS Standby"
        title={`Awaiting Driver GPS Broadcast`}
        text={`Bus ${bus.number} on ${bus.route} is scheduled, but the driver hasn't initiated in-cab location broadcast yet.`}
        subtext="Live radar blip will activate automatically when vehicle starts trip."
      />
    );
  }

  const locationState = getLocationState(bus, nowMs);
  const badge = LOCATION_BADGE[locationState];
  const eta = myStop && locationState === "live" ? etaText(bus, myStop) : null;

  // Prepare map markers
  const markers: MapMarker[] = [
    ...stops.map((stop, index) => ({
      id: `stop-${index}`,
      position: stop,
      title: `${index + 1}. ${stop.name}`,
      kind: (stop.name === myStop?.name ? "myStop" : "stop") as "myStop" | "stop",
      label: `${index + 1}`,
    })),
    {
      id: bus.id,
      position: bus.coordinates,
      title: `Bus ${bus.number} • ${bus.route}`,
      kind: "bus" as const,
      busNumber: bus.number,
      isLive: locationState === "live",
    },
  ];

  // Route path coordinates connecting stops
  const routePath = stops.length > 1 ? stops.map((s) => ({ lat: s.lat, lng: s.lng })) : undefined;

  // Distance to my stop if available
  const distKm = myStop && bus.coordinates ? distanceKm(bus.coordinates, myStop) : null;

  return (
    <div className="relative h-full w-full min-h-[460px] overflow-hidden rounded-xl bg-slate-900">
      {/* Map View */}
      <MapView
        center={bus.coordinates}
        markers={markers}
        routePath={routePath}
        zoom={15}
        onMapLoad={handleMapLoad}
      />

      {/* Floating Map Controls Top-Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleCenterOnBus}
          title="Center on Bus"
          className="h-9 w-9 bg-card/90 backdrop-blur border border-border shadow-md hover:bg-card text-foreground"
        >
          <Crosshair className="w-4 h-4 text-primary" />
        </Button>
        {stops.length > 0 && (
          <Button
            size="icon"
            variant="secondary"
            onClick={handleFitRouteBounds}
            title="Fit Route Network"
            className="h-9 w-9 bg-card/90 backdrop-blur border border-border shadow-md hover:bg-card text-foreground"
          >
            <Layers className="w-4 h-4 text-accent" />
          </Button>
        )}
      </div>

      {/* Floating Live Telemetry Overlay HUD at Bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="max-w-lg mx-auto sm:ml-0 bg-card/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl p-4 pointer-events-auto space-y-3">
          
          {/* Header Row: Vehicle details + Status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20 shrink-0">
                {bus.number}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Bus {bus.number}</h3>
                  <span className="text-xs text-muted-foreground font-medium">• {bus.route}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-2xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {formatLastUpdated(bus.updatedAt, nowMs)}
                  </span>
                  {bus.speedKmh !== undefined && bus.speedKmh !== null && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-2xs text-foreground font-semibold">
                        <Gauge className="w-3 h-3 text-accent" />
                        {Math.round(bus.speedKmh)} km/h
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Badge className={`${badge.className} gap-1.5 px-2.5 py-1 text-2xs font-bold shrink-0 rounded-full shadow-sm`}>
              <span className="relative flex h-2 w-2">
                {badge.pingClass && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.pingClass}`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dotClass}`} />
              </span>
              <span>{badge.label}</span>
            </Badge>
          </div>

          {/* Student Arrival Estimate Pill */}
          {myStop && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-foreground font-medium truncate">
                  Target: <strong className="text-emerald-700 dark:text-emerald-300">{myStop.name}</strong>
                </span>
              </div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300 font-mono shrink-0 pl-2">
                {eta ? eta : distKm ? `~${distKm.toFixed(1)} km away` : "Calculating ETA"}
              </div>
            </div>
          )}

          {/* Micro Map Legend Bar */}
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-2xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary border border-white inline-block shadow-xs" />
                Live Bus
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-700 inline-block" />
                Stops
              </span>
              {myStop && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  My Stop
                </span>
              )}
            </div>

            <button
              onClick={handleCenterOnBus}
              className="text-2xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              Focus Bus
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BusMap;
