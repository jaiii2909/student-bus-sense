import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Navigation2, Radio, Bus } from "lucide-react";

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

  const mockBusLocations = {
    "bus-1": { lat: 40.7128, lng: -74.0060, heading: 45 },
    "bus-2": { lat: 40.7589, lng: -73.9851, heading: 135 },
    "bus-3": { lat: 40.6892, lng: -74.0445, heading: 0 },
  };

  const selectedBus = buses.find(bus => bus.id === selectedBusId);

  useEffect(() => {
    console.log('Map would be initialized here with bus tracking');
  }, [selectedBusId]);

  if (!selectedBusId) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted relative overflow-hidden">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="text-center relative z-10 p-8">
          <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow animate-bounce-subtle">
            <MapPin className="w-12 h-12 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Select a Bus</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Choose an active bus from the list to view its live location on the map
          </p>
        </div>
      </div>
    );
  }

  const busLocation = mockBusLocations[selectedBusId as keyof typeof mockBusLocations];

  return (
    <div className="h-full relative overflow-hidden">
      {/* Animated map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        {/* Road network pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="roads" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 L100 50 M50 0 L50 100" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="8" fill="hsl(var(--primary) / 0.2)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#roads)" />
        </svg>
        
        {/* Animated circles representing area */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-2 border-primary/20 animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full border-2 border-secondary/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full border-2 border-accent/20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Central bus marker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse" />
          </div>
          
          {/* Bus marker */}
          <div className="relative w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow bus-pulse">
            <Bus 
              className="w-8 h-8 text-primary-foreground transition-transform duration-300" 
              style={{ transform: `rotate(${busLocation?.heading || 0}deg)` }} 
            />
          </div>
          
          {/* Bus number label */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1.5 text-sm font-bold shadow-lg">
              {selectedBus?.number}
            </Badge>
          </div>
        </div>
      </div>

      {/* Location markers */}
      <div className="absolute top-8 left-8 flex items-center gap-2 p-3 glass rounded-xl animate-fade-in">
        <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
        <span className="text-sm font-medium text-foreground">Start: Main Gate</span>
      </div>
      
      <div className="absolute top-8 right-8 flex items-center gap-2 p-3 glass rounded-xl animate-fade-in">
        <div className="w-3 h-3 bg-destructive rounded-full" />
        <span className="text-sm font-medium text-foreground">End: Campus Center</span>
      </div>

      {/* Bus Info Overlay */}
      {selectedBus && (
        <Card className="absolute bottom-4 left-4 right-4 border-0 glass shadow-elevated animate-slide-in-right">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-card-foreground">{selectedBus.number}</h3>
                  <p className="text-xs text-muted-foreground">{selectedBus.route}</p>
                </div>
              </div>
              <Badge className="status-active flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                Live Tracking
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-semibold text-card-foreground">{selectedBus.currentLocation}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-sm font-semibold text-card-foreground">{selectedBus.estimatedArrival}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Navigation2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Stop</p>
                  <p className="text-sm font-semibold text-card-foreground">{selectedBus.nextStop}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Demo Mode Indicator */}
      <div className="absolute top-20 right-8">
        <Card className="border-0 bg-warning/10 border-warning/30">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-warning flex items-center gap-1">
              <span>🗺️</span>
              Demo Mode - Real GPS integration ready
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusMap;
