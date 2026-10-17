import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Compass } from "lucide-react";
import MapView from "../MapView";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";

interface BusMapProps {
  bus: TrackedBus | null;
  nowMs: number;
}

const Placeholder = ({ icon: Icon, title, text, subtext }: { icon: any; title: string; text: string; subtext?: string }) => (
  <div className="h-full min-h-[380px] flex items-center justify-center bg-stone-50/70 dark:bg-stone-900/50 p-6 text-center">
    <div className="max-w-xs space-y-2">
      <div className="w-10 h-10 rounded-md bg-stone-200 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-600 dark:text-stone-300">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
        {subtext && <p className="text-[11px] text-muted-foreground mt-1 font-mono">{subtext}</p>}
      </div>
    </div>
  </div>
);

// Clean Campus Bus Map View
const BusMap = ({ bus, nowMs }: BusMapProps) => {
  if (!bus) {
    return (
      <Placeholder
        icon={Bus}
        title="No Vehicle Selected"
        text="Choose your route pass from the sidebar to inspect active buses on that corridor."
      />
    );
  }

  if (!bus.coordinates) {
    return (
      <Placeholder
        icon={MapPin}
        title="Awaiting In-Cab Driver GPS"
        text={`Driver for Bus ${bus.number} (${bus.route}) has not started vehicle broadcast yet.`}
        subtext="Tracking will appear automatically once driver begins trip."
      />
    );
  }

  const locationState = getLocationState(bus, nowMs);
  const badge = LOCATION_BADGE[locationState];

  return (
    <div className="relative h-full w-full min-h-[380px] overflow-hidden">
      <MapView
        center={bus.coordinates}
        markers={[{ id: bus.id, position: bus.coordinates, title: `Bus ${bus.number} • ${bus.route}` }]}
        zoom={15}
      />

      {/* Flat Bottom Info Strip Over Map */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="max-w-md mx-auto sm:ml-0 bg-card border border-border shadow-sm rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Bus {bus.number}</span>
                <span className="text-xs text-muted-foreground">• {bus.route}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {bus.status === "inactive" ? "Last recorded: " : "Real-time: "}
                  {formatLastUpdated(bus.updatedAt, nowMs)}
                </span>
              </p>
            </div>

            <Badge className={`${badge.className} gap-1.5 px-2 py-0.5 text-[11px] shrink-0 rounded`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
              <span>{badge.label}</span>
            </Badge>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
            <span>Fix: {bus.coordinates.lat.toFixed(4)}° N, {bus.coordinates.lng.toFixed(4)}° E</span>
            <span className="text-foreground font-sans font-medium text-xs">Live Telemetry Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusMap;
