
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Navigation2 } from "lucide-react";
import MapView from "../MapView";

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
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Set initial markers from active buses
    setMarkers(buses.filter(bus => bus.status === 'active').map(bus => ({
      position: bus.coordinates,
      title: bus.id
    })));

    // Connect to socket for real-time updates
    const socket = io('http://localhost:5001');

    socket.on('busUpdates', (updatedBuses) => {
      setMarkers(updatedBuses.map(bus => ({
        position: bus.coordinates,
        title: bus.id
      })));
    });

    return () => socket.disconnect();
  }, [buses]);

  const selectedBus = buses.find(bus => bus.id === selectedBusId);

  // Center map on selected bus or default location
  const mapCenter = selectedBus && selectedBus.coordinates
    ? { lat: selectedBus.coordinates.lat, lng: selectedBus.coordinates.lng }
    : { lat: 25.4358, lng: 81.8463 }; // Prayagraj/Allahabad center

  if (!selectedBusId || buses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {buses.length === 0 ? "Select a Route" : "Select a Bus"}
          </h3>
          <p className="text-gray-500">
            {buses.length === 0 
              ? "Choose a route from the dropdown to view available buses" 
              : "Choose an active bus from the list to view its live location"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <MapView 
        center={mapCenter} 
        markers={markers}
        zoom={15}
      />

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

      {/* Status Note */}
      <div className="absolute top-4 right-4">
        <Card className="bg-green-50 border-green-200">
          <div className="p-3">
            <p className="text-xs text-green-800">
              🗺️ Live GPS Tracking Active
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusMap;
