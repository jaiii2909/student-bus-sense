import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Check, 
  AlertTriangle, 
  Navigation, 
  StopCircle, 
  Radio, 
  Wifi, 
  Sun, 
  Activity,
  ArrowRight
} from "lucide-react";
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
  const [wasInterrupted, setWasInterrupted] = useState(() => readStored(SHARING_FLAG_KEY) === "1");
  const [busId, setBusId] = useState<string>(() => readStored("driverBusId"));
  const [selectedRoute, setSelectedRoute] = useState<string>(() => readStored("driverRoute"));
  const [allBuses, setAllBuses] = useState<ApiBus[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSendAttemptRef = useRef(0);

  const routes = Array.from(new Set(allBuses.map((b) => b.route)));
  const availableBuses = allBuses.filter((b) => b.route === selectedRoute).map((b) => b.busNumber);

  useEffect(() => {
    if (!loggedIn) return;

    const fetchFleet = async () => {
      setIsLoadingFleet(true);
      try {
        const response = await axios.get<ApiBus[]>("/api/buses");
        const buses = response.data || [];
        setAllBuses(buses);

        if (selectedRoute && !buses.some((b) => b.route === selectedRoute)) {
          handleRouteChange("");
        } else if (busId && !buses.some((b) => b.route === selectedRoute && b.busNumber === busId)) {
          handleBusChange("");
        }
      } catch (error) {
        console.error("Error fetching driver fleet data:", error);
        toast({ title: "Could not load buses", description: "Check connection and refresh.", variant: "destructive" });
      } finally {
        setIsLoadingFleet(false);
      }
    };

    fetchFleet();
  }, [loggedIn]);

  useEffect(() => {
    if (!isSharing) return;
    const tickId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(tickId);
  }, [isSharing]);

  useEffect(() => {
    const onVisible = () => {
      if (isSharing && document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isSharing]);

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
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener("release", () => {
          setWakeLockActive(false);
        });
      }
    } catch {
      setWakeLockActive(false);
    }
  };

  const handleRouteChange = (routeName: string) => {
    setSelectedRoute(routeName);
    writeStored("driverRoute", routeName);
    handleBusChange("");
  };

  const handleBusChange = (busIdValue: string) => {
    setBusId(busIdValue);
    writeStored("driverBusId", busIdValue);
  };

  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported", description: "This device browser cannot access GPS.", variant: "destructive" });
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

        const { latitude, longitude, speed } = position.coords;
        // GPS speed is in m/s and missing on some devices; used for student ETA
        const speedKmh = typeof speed === "number" && speed >= 0 ? Math.round(speed * 3.6) : null;
        try {
          await axios.post(`/api/driver/buses/${busId}/location`, { latitude, longitude, speedKmh });
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
          title: "Cannot access location",
          description:
            error.code === error.PERMISSION_DENIED
              ? "Enable GPS / Location permissions in your mobile browser settings."
              : "Verify mobile GPS is switched on, then retry.",
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

  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setWakeLockActive(false);
    setIsSharing(false);
    writeStored(SHARING_FLAG_KEY, "");

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
          saveSession("driver", { token: data.token, name: data.name });
          setLoggedIn(true);
        }}
        onBack={() => navigate("/role-selection")}
      />
    );
  }

  const secondsSinceSent = lastSentAt ? Math.max(0, Math.round((nowMs - lastSentAt) / 1000)) : null;
  // shown in the header; missing for the old shared driver login
  const driverName = getSession<{ token?: string; name?: string }>("driver")?.name;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <AppHeader
        title="Driver In-Cab Console"
        subtitle={[driverName, busId ? `Bus ${busId} • ${selectedRoute}` : "Standby — Select Vehicle"].filter(Boolean).join(" • ")}
        roleBadge="Driver"
        onLogout={handleLogout}
      />

      <main className="container mx-auto max-w-lg p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-4">
        
        {/* Main In-Cab Control Card */}
        <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
          
          {/* Status HUD Header */}
          <div className={`p-6 text-center border-b ${
            isSharing
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              : "bg-stone-50 dark:bg-stone-900 border-border"
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${isSharing ? "bg-emerald-600 animate-bus-pulse" : "bg-stone-400"}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isSharing ? "Broadcasting Vehicle Position" : "Vehicle Stationary / Standby"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {isSharing ? `Bus ${busId} is Live` : "Prepare Trip Dispatch"}
            </h1>
            
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {isSharing
                ? "Students on this route are now tracking your live location on their map."
                : "Select route and bus number below, mount device on dashboard, and start trip."}
            </p>
          </div>

          <div className="p-6 space-y-5">
            
            {wasInterrupted && !isSharing && (
              <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Broadcasting stopped when the browser closed. Tap start to resume your scheduled trip.</span>
              </div>
            )}

            {/* In-Cab Route Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Transit Route
              </Label>
              <Select
                value={selectedRoute}
                onValueChange={handleRouteChange}
                disabled={isSharing || isLoadingFleet}
              >
                <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-md border-border">
                  <SelectValue placeholder={isLoadingFleet ? "Loading routes..." : "Choose route corridor"} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route} value={route} className="text-xs cursor-pointer py-2">
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* In-Cab Bus Selection */}
            {availableBuses.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Vehicle Number
                </Label>
                <Select value={busId} onValueChange={handleBusChange} disabled={isSharing}>
                  <SelectTrigger className="w-full h-11 text-xs font-semibold rounded-md border-border">
                    <SelectValue placeholder="Select assigned bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBuses.map((bus) => (
                      <SelectItem key={bus} value={bus} className="text-xs cursor-pointer py-2 font-bold">
                        Bus {bus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Live Telemetry Strip */}
            {isSharing && (
              <div className="border border-border rounded-lg bg-stone-50 dark:bg-stone-900 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" /> Mobile Signal
                  </span>
                  <span className={`font-semibold ${sendFailed ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {sendFailed ? "Retry in progress" : "Connected (HTTP 200)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> GPS Transmission
                  </span>
                  <span className="font-mono tabular-nums font-bold text-foreground">
                    {secondsSinceSent === null ? "Fixing coordinates..." : `Ping sent ${secondsSinceSent}s ago`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" /> Screen Lock
                  </span>
                  <span className="font-medium text-foreground">
                    {wakeLockActive ? "Wake-Lock Active (Screen on)" : "Auto Sleep"}
                  </span>
                </div>
              </div>
            )}

            {/* Giant Action Button (Min 56px height) */}
            {!isSharing ? (
              <Button
                onClick={startSharingLocation}
                disabled={!busId}
                className="w-full h-14 rounded-lg font-bold text-sm shadow-none disabled:opacity-50"
              >
                <Radio className="w-4 h-4 mr-2" />
                START LOCATION BROADCAST
              </Button>
            ) : (
              <Button
                onClick={stopSharingLocation}
                variant="destructive"
                className="w-full h-14 rounded-lg font-bold text-sm shadow-none"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                STOP SHARING LOCATION
              </Button>
            )}

            <p className="text-[11px] text-center text-muted-foreground">
              Keep this screen visible on your dashboard holder while driving.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Driver;
