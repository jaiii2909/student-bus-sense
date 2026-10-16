import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import MapView from "../MapView";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";

interface BusMapProps {
  bus: TrackedBus | null;
  nowMs: number;
}

const Placeholder = ({ title, text }: { title: string; text: string }) => (
  <div className="h-full flex items-center justify-center bg-gray-50 p-6">
    <div className="text-center">
      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-500">{text}</p>
    </div>
  </div>
);

// Map for the one bus the student selected.
const BusMap = ({ bus, nowMs }: BusMapProps) => {
  if (!bus) {
    return <Placeholder title="Select a Bus" text="Choose a bus from the list to view its location" />;
  }

  if (!bus.coordinates) {
    return (
      <Placeholder
        title="Location Pending"
        text={`Driver for ${bus.number} has not started sharing location yet.`}
      />
    );
  }

  const badge = LOCATION_BADGE[getLocationState(bus, nowMs)];

  return (
    <div className="relative h-full">
      <MapView
        center={bus.coordinates}
        markers={[{ id: bus.id, position: bus.coordinates, title: bus.number }]}
        zoom={15}
      />

      {/* Bus Info Overlay */}
      <Card className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{bus.number}</h3>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
          <p className="text-xs text-gray-600">
            {bus.status === "inactive" ? "Last known location. " : ""}
            {formatLastUpdated(bus.updatedAt, nowMs)}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default BusMap;
