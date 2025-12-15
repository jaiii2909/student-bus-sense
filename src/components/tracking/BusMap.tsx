
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation2 } from "lucide-react";

interface Bus {
  id: string;
  route: string;
  number: string;
  status: string;
  currentLocation: string;
  estimatedArrival: string;
  nextStop: string;
}

interface BusMapProps {
  selectedBusId: string | null;
  buses: Bus[];
}

const BusMap = ({ selectedBusId, buses }: BusMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  // Mock coordinates for demonstration
  const mockBusLocations = {
    "bus-1": { lat: 40.7128, lng: -74.0060, heading: 45 },
    "bus-2": { lat: 40.7589, lng: -73.9851, heading: 135 },
    "bus-3": { lat: 40.6892, lng: -74.0445, heading: 0 },
  };

  const selectedBus = buses.find(bus => bus.id === selectedBusId);

  useEffect(() => {
    // In a real application, you would initialize a map library here
    // For now, we'll create a visual representation
    console.log('Map would be initialized here with bus tracking');
  }, [selectedBusId]);

  if (!selectedBusId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Bus</h3>
          <p className="text-gray-500">Choose an active bus from the list to view its live location</p>
        </div>
      </div>
    );
  }

  const busLocation = mockBusLocations[selectedBusId as keyof typeof mockBusLocations];

  return (
    <div className="h-full relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
      {/* Mock Map Visual */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Map background grid */}
            <div className="w-80 h-80 bg-white/20 backdrop-blur-sm rounded-lg grid grid-cols-4 grid-rows-4 gap-2 p-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bg-white/10 rounded"></div>
              ))}
            </div>
            
            {/* Bus icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Navigation2 className="w-4 h-4 text-white" style={{ transform: `rotate(${busLocation?.heading || 0}deg)` }} />
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                  {selectedBus?.number}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Info Overlay */}
      {selectedBus && (
        <Card className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{selectedBus.number}</h3>
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{selectedBus.currentLocation}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">ETA: {selectedBus.estimatedArrival}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Navigation2 className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Next: {selectedBus.nextStop}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real Map Integration Note */}
      <div className="absolute top-4 right-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-3">
            <p className="text-xs text-yellow-800">
              🗺️ Demo Mode - Real GPS integration available
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusMap;
