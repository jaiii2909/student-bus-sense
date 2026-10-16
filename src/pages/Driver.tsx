import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, Navigation, StopCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/hooks/use-toast";
import { clearSession, getSession, saveSession } from "@/lib/session";

interface ApiBus {
  _id: string;
  busNumber: string;
  route: string;
  status: "active" | "inactive";
}

// send at most one location update per interval to save data and battery
const SEND_INTERVAL_MS = 5000;
const SHARING_FLAG_KEY = "driverSharing";

const readStored = (key: string) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeStored = (key: string, value: string) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const Driver = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loggedIn, setLoggedIn] = useState<boolean>(() => !!getSession("driver")?.token);
  const [isSharing, setIsSharing] = useState(false);
  // true when the page was closed or refreshed while sharing
  const [wasInterrupted, setWasInterrupted] = useState(() => readStored(SHARING_FLAG_KEY) === "1");
  const [busId, setBusId] = useState<string>(() => readStored("driverBusId"));
  const [selectedRoute, setSelectedRoute] = useState<string>(() => readStored("driverRoute"));
  const [allBuses, setAllBuses] = useState<ApiBus[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSendAttemptRef = useRef(0);

  const routes = Array.from(new Set(allBuses.map((b) => b.route)));
  const availableBuses = allBuses.filter((b) => b.route === selectedRoute).map((b) => b.busNumber);

  /* Fetch routes and buses from API after login */
  useEffect(() => {
    if (!loggedIn) return;

    const fetchFleet = async () => {
      setIsLoadingFleet(true);
      try {
        const response = await axios.get<ApiBus[]>("/api/buses");
        const buses = response.data || [];
        setAllBuses(buses);

        // Restore persisted route/bus only if they still exist.
        if (selectedRoute && !buses.some((b) => b.route === selectedRoute)) {
          handleRouteChange("");
        } else if (busId && !buses.some((b) => b.route === selectedRoute && b.busNumber === busId)) {
          handleBusChange("");
        }
      } catch (error) {
        console.error("Error fetching driver fleet data:", error);
        toast({ title: "Could not load buses", description: "Check your internet and refresh.", variant: "destructive" });
      } finally {
        setIsLoadingFleet(false);
      }
    };

    fetchFleet();
  }, [loggedIn]);

  // tick so "last sent Xs ago" stays current
  useEffect(() => {
    if (!isSharing) return;
    const tickId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(tickId);
  }, [isSharing]);

  // the browser drops the wake lock when the tab is hidden; take it again on return
  useEffect(() => {
    const onVisible = () => {
      if (isSharing && document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isSharing]);

  // stop GPS when leaving the page
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // not supported or denied: sharing still works while the screen is on
    }
  };

  /* ---------------- ROUTE HANDLER ---------------- */
  const handleRouteChange = (routeName: string) => {
    setSelectedRoute(routeName);
    writeStored("driverRoute", routeName);
    // Reset bus when route changes
    handleBusChange("");
  };

  /* Handle bus selection with persistence */
  const handleBusChange = (busIdValue: string) => {
    setBusId(busIdValue);
    writeStored("driverBusId", busIdValue);
  };

  /* ---------------- START SHARING ---------------- */
  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported", description: "This browser cannot share location.", variant: "destructive" });
      return;
    }

    setIsSharing(true);
    setWasInterrupted(false);
    setSendFailed(false);
    setLastSentAt(null);
    lastSendAttemptRef.current = 0;
    writeStored(SHARING_FLAG_KEY, "1");
    requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSendAttemptRef.current < SEND_INTERVAL_MS) return;
        lastSendAttemptRef.current = now;

        const { latitude, longitude } = position.coords;
        try {
          await axios.post(`/api/driver/buses/${busId}/location`, { latitude, longitude });
          setLastSentAt(Date.now());
          setSendFailed(false);
        } catch (error) {
          console.error("Error sending location:", error);
          setSendFailed(true);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Can't get your location",
          description:
            error.code === error.PERMISSION_DENIED
              ? "Allow location access for this site in your browser settings, then try again."
              : "Make sure GPS is on, then try again.",
          variant: "destructive"
        });
        stopSharingLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  /* ---------------- STOP SHARING ---------------- */
  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setIsSharing(false);
    writeStored(SHARING_FLAG_KEY, "");

    // tell students the bus is no longer running
    if (busId) {
      axios.post(`/api/driver/buses/${busId}/stop`).catch((error) => {
        console.error("Error marking bus stopped:", error);
      });
    }
  };

  const handleLogout = () => {
    if (isSharing) stopSharingLocation();
    clearSession("driver");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <LoginForm
        role="driver"
        onLogin={(data) => {
          saveSession("driver", { token: data.token });
          setLoggedIn(true);
        }}
        onBack={() => navigate("/role-selection")}
      />
    );
  }

  const secondsSinceSent = lastSentAt ? Math.max(0, Math.round((nowMs - lastSentAt) / 1000)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader title="Driver" subtitle={busId ? `Bus ${busId}` : "Location sharing"} onLogout={handleLogout} />

      <div className="container mx-auto max-w-md p-4">
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
            {wasInterrupted && !isSharing && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                Sharing stopped when the page was closed. Tap Start to resume.
              </div>
            )}

            {/* ROUTE SELECTION */}
            <div className="space-y-2">
              <Label>Select Route</Label>
              <Select
                value={selectedRoute}
                onValueChange={handleRouteChange}
                disabled={isSharing || isLoadingFleet}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingFleet ? "Loading..." : "Select route"} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BUS SELECTION */}
            {availableBuses.length > 0 && (
              <div className="space-y-2">
                <Label>Select Bus</Label>
                <Select value={busId} onValueChange={handleBusChange} disabled={isSharing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBuses.map((bus) => (
                      <SelectItem key={bus} value={bus}>
                        {bus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* SHARING STATUS */}
            {isSharing && (
              <div
                className={`rounded-lg p-4 text-center ${sendFailed ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
              >
                {sendFailed ? (
                  <>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Sending failed</p>
                    <p className="text-sm">Check your internet. We'll keep trying.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">You're live</p>
                    <p className="text-sm">
                      {secondsSinceSent === null ? "Getting your location..." : `Last sent ${secondsSinceSent}s ago`}
                    </p>
                  </>
                )}
                <p className="text-xs mt-2 opacity-80">Keep this screen open while driving.</p>
              </div>
            )}

            {/* ACTION BUTTON */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Driver;
