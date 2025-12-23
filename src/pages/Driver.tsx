import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, StopCircle } from "lucide-react";
import axios from "axios";

const Driver = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [busId, setBusId] = useState("R1"); // For demo, in real app this would be selected or from login
  const [watchId, setWatchId] = useState<number | null>(null);

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

        // Send location to backend
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
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
    setCurrentLocation(null);
  };

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
              Share your real-time location with students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge variant={isSharing ? "default" : "secondary"} className="mb-4">
                {isSharing ? "Sharing Active" : "Not Sharing"}
              </Badge>
            </div>

            {currentLocation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!isSharing ? (
                <Button
                  onClick={startSharingLocation}
                  className="w-full bg-green-600 hover:bg-green-700"
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

            <div className="text-xs text-gray-500 text-center">
              Bus ID: {busId}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Driver;