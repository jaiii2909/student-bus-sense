import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, StopCircle } from "lucide-react";
import axios from "axios";

/* ---------------- ROUTE → BUS CONFIG ---------------- */
const ROUTES = [
  {
    name: "Rajroohpur",
    buses: ["R1"]
  },
  {
    name: "City Center",
    buses: ["C1", "C2"]
  }
];

const Driver = () => {
  /* ---------------- EXISTING STATES ---------------- */
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [busId, setBusId] = useState<string>("");
  const [watchId, setWatchId] = useState<number | null>(null);

  /* ---------------- NEW STATES ---------------- */
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [availableBuses, setAvailableBuses] = useState<string[]>([]);

  /* ---------------- ROUTE HANDLER ---------------- */
  const handleRouteChange = (routeName: string) => {
    setSelectedRoute(routeName);

    const route = ROUTES.find(r => r.name === routeName);
    setAvailableBuses(route ? route.buses : []);

    // Reset bus when route changes
    setBusId("");
  };

  /* ---------------- START SHARING (UNCHANGED LOGIC) ---------------- */
  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsSharing(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        try {
          await axios.post(`/api/buses/${busId}/location`, {
            lat: latitude,
            lng: longitude
          });
        } catch (error) {
          console.error("Error sending location:", error);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Error getting location. Please check permissions.");
        setIsSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  /* ---------------- STOP SHARING (UNCHANGED) ---------------- */
  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
    setCurrentLocation(null);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="container mx-auto max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Navigation className="w-6 h-6" />
              Driver Location Sharing
            </CardTitle>
            <CardDescription>
              Select route & bus, then share your live location
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STATUS */}
            <div className="text-center">
              <Badge variant={isSharing ? "default" : "secondary"}>
                {isSharing ? "Sharing Active" : "Not Sharing"}
              </Badge>
            </div>

            {/* ROUTE SELECTION */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Route</label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedRoute}
                onChange={(e) => handleRouteChange(e.target.value)}
                disabled={isSharing}
              >
                <option value="">-- Select Route --</option>
                {ROUTES.map(route => (
                  <option key={route.name} value={route.name}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BUS SELECTION */}
            {availableBuses.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Bus</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  disabled={isSharing}
                >
                  <option value="">-- Select Bus --</option>
                  {availableBuses.map(bus => (
                    <option key={bus} value={bus}>
                      {bus}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LOCATION INFO */}
            {currentLocation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Lat: {currentLocation.lat.toFixed(6)}, Lng:{" "}
                    {currentLocation.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <div className="space-y-3">
              {!isSharing ? (
                <Button
                  onClick={startSharingLocation}
                  disabled={!busId}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  size="lg"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Sharing Location
                </Button>
              ) : (
                <Button
                  onClick={stopSharingLocation}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Sharing
                </Button>
              )}
            </div>

            {/* FOOTER INFO */}
            {busId && (
              <div className="text-xs text-gray-500 text-center">
                Route: {selectedRoute} | Bus ID: {busId}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Driver;
