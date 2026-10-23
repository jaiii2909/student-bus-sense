import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  ShieldAlert, 
  Route as RouteIcon, 
  Bus as BusIcon, 
  Radio, 
  Clock, 
  Navigation, 
  Check, 
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "./AppHeader";
import ChangePasswordDialog from "./ChangePasswordDialog";
import AnnouncementBanner, { Announcement } from "./AnnouncementBanner";
import BusMap from "./tracking/BusMap";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";
import { connectBusSocket } from "@/lib/socket";
import { Stop, etaText } from "@/lib/eta";

interface StudentData {
  _id?: string;
  studentId?: string;
  name: string;
  registeredRoutes: string[];
  token?: string;
}

interface DashboardProps {
  studentData: StudentData;
  onLogout: () => void;
  onTokenChange: (token: string) => void;
}

interface AuthorizedBusesResponse {
  studentId: string;
  registeredRoutes: string[];
  routes?: { routeName: string; stops: Stop[] }[];
  announcements?: Announcement[];
  buses: TrackedBus[];
}

const readStored = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const EmptyState = ({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) => (
  <div className="text-center p-8 border border-border bg-card rounded-lg space-y-2">
    <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-500">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{text}</p>
  </div>
);

const Dashboard = ({ studentData, onLogout, onTokenChange }: DashboardProps) => {
  const [selectedBus, setSelectedBusState] = useState<string | null>(() => readStored("selectedBus"));
  const [selectedRoute, setSelectedRouteState] = useState<string | null>(() => readStored("selectedRoute"));
  const [buses, setBuses] = useState<TrackedBus[]>([]);
  const [authorizedRoutes, setAuthorizedRoutes] = useState<string[]>(studentData.registeredRoutes || []);
  const [stopsByRoute, setStopsByRoute] = useState<Record<string, Stop[]>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // dismissed announcement ids, remembered on this device
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(readStored("dismissedAnnouncements") || "[]");
    } catch {
      return [];
    }
  });
  // the student's stop per route, remembered on this device
  const [myStopName, setMyStopName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const mapRef = useRef<HTMLDivElement>(null);

  const setSelectedBus = (id: string | null) => {
    setSelectedBusState(id);
    writeStored("selectedBus", id);
  };

  const setSelectedRoute = (route: string | null) => {
    setSelectedRouteState(route);
    writeStored("selectedRoute", route);
  };

  const fetchAuthorizedBuses = () => {
    if (!studentData.studentId) return;
    setIsRefreshing(true);
    axios
      .get<AuthorizedBusesResponse>(`/api/student/${studentData.studentId}/authorized-buses`)
      .then((res) => {
        setBuses(res.data.buses || []);
        setAuthorizedRoutes(res.data.registeredRoutes || []);
        setAnnouncements(res.data.announcements || []);
        setStopsByRoute(
          Object.fromEntries((res.data.routes || []).map((r) => [r.routeName, r.stops || []]))
        );
      })
      .catch((err) => console.error("Error fetching authorized buses:", err))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAuthorizedBuses();
    const pollId = window.setInterval(fetchAuthorizedBuses, 15000);
    return () => window.clearInterval(pollId);
  }, [studentData.studentId]);

  useEffect(() => {
    if (!studentData.token) return;
    const socket = connectBusSocket(studentData.token);
    socket.on("busUpdate", (update: TrackedBus) => {
      setBuses((prev) => prev.map((bus) => (bus.id === update.id ? update : bus)));
    });
    socket.on("announcement", (item: Announcement) => {
      setAnnouncements((prev) => (prev.some((a) => a.id === item.id) ? prev : [item, ...prev]));
    });
    socket.on("announcementDeleted", ({ id }: { id: string }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });
    return () => {
      socket.disconnect();
    };
  }, [studentData.token]);

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), 15000);
    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (selectedRoute && !authorizedRoutes.includes(selectedRoute)) {
      setSelectedRoute(null);
    } else if (!selectedRoute && authorizedRoutes.length === 1) {
      setSelectedRoute(authorizedRoutes[0]);
    }
  }, [selectedRoute, authorizedRoutes]);

  useEffect(() => {
    setMyStopName(selectedRoute ? readStored(`myStop:${selectedRoute}`) : null);
  }, [selectedRoute]);

  const routeStops = selectedRoute ? stopsByRoute[selectedRoute] || [] : [];
  const myStop = routeStops.find((stop) => stop.name === myStopName) || null;

  const handleSelectStop = (name: string) => {
    setMyStopName(name);
    if (selectedRoute) writeStored(`myStop:${selectedRoute}`, name);
  };

  const filteredBuses = useMemo(
    () => (selectedRoute ? buses.filter((bus) => bus.route === selectedRoute) : []),
    [buses, selectedRoute]
  );

  useEffect(() => {
    if (isLoading) return;
    if (selectedBus && !filteredBuses.some((b) => b.id === selectedBus)) {
      setSelectedBus(null);
    } else if (!selectedBus) {
      const running = filteredBuses.filter((b) => b.status === "active");
      if (running.length === 1) setSelectedBus(running[0].id);
    }
  }, [selectedBus, filteredBuses, isLoading]);

  const handleSelectBus = (id: string) => {
    setSelectedBus(id);
    setMobileView("map");
    if (window.innerWidth < 1024) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id) && new Date(a.expiresAt).getTime() > nowMs
  );

  const handleDismissAnnouncement = (id: string) => {
    // keep the list short: only ids of announcements that still exist
    const next = [...dismissedIds.filter((d) => announcements.some((a) => a.id === d)), id];
    setDismissedIds(next);
    writeStored("dismissedAnnouncements", JSON.stringify(next));
  };

  const handleLogout = () => {
    setSelectedBus(null);
    setSelectedRoute(null);
    onLogout();
  };

  const trackedBus = filteredBuses.find((b) => b.id === selectedBus) || null;
  const activeBusesCount = filteredBuses.filter((b) => b.status === "active").length;

  const renderBusList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (authorizedRoutes.length === 0) {
      return (
        <EmptyState
          icon={ShieldAlert}
          title="No Route Pass Registered"
          text="You have no fee-cleared bus passes on file for this semester. Contact the Transport Office at Gate 1."
        />
      );
    }

    if (!selectedRoute) {
      return (
        <EmptyState
          icon={RouteIcon}
          title="Select Route Corridor"
          text="Pick your registered transit route from the dropdown above to view assigned buses."
        />
      );
    }

    if (filteredBuses.length === 0) {
      return (
        <EmptyState
          icon={BusIcon}
          title="No Scheduled Buses"
          text="No vehicles are assigned to this route today. Check morning or evening transit timings."
        />
      );
    }

    return (
      <div className="space-y-2">
        {filteredBuses.map((bus) => {
          const isSelected = selectedBus === bus.id;
          const locationState = getLocationState(bus, nowMs);
          const badge = LOCATION_BADGE[locationState];

          return (
            <div
              key={bus.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Bus ${bus.number}, ${bus.route}, ${badge.label}`}
              onClick={() => handleSelectBus(bus.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectBus(bus.id);
                }
              }}
              className={`p-3.5 rounded-lg border transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "bg-stone-50 dark:bg-stone-900 border-primary ring-1 ring-primary"
                  : "bg-card border-border hover:border-stone-400"
              } ${bus.status === "inactive" ? "opacity-75" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-stone-100 dark:bg-stone-800 text-foreground"
                  }`}>
                    {bus.number}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Bus {bus.number}</h3>
                    <p className="text-[11px] text-muted-foreground">{bus.route}</p>
                  </div>
                </div>

                <Badge className={`${badge.className} text-[10px] font-semibold gap-1 px-1.5 py-0.5 rounded`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                  <span>{badge.label}</span>
                </Badge>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {bus.status === "inactive"
                    ? "Driver off duty"
                    : myStop && locationState === "live"
                    ? <span className="font-semibold text-foreground">{etaText(bus, myStop)}</span>
                    : formatLastUpdated(bus.updatedAt, nowMs)}
                </span>
                {isSelected && (
                  <span className="text-primary font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Selected on Radar
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <AppHeader
        title="Student Bus Tracker"
        subtitle={`Pass: ${studentData.name} • ID: ${studentData.studentId || ""}`}
        roleBadge="Student"
        onLogout={handleLogout}
      >
        <ChangePasswordDialog
          endpoint="/api/student/password"
          minLength={6}
          onChanged={(data) => data.token && onTokenChange(data.token)}
        />
      </AppHeader>

      <main className="container mx-auto px-4 py-6 max-w-6xl flex-1 space-y-5">
        <AnnouncementBanner
          announcements={visibleAnnouncements}
          nowMs={nowMs}
          onDismiss={handleDismissAnnouncement}
        />

        {/* Short Summary Strip of Key Metrics with Clear Hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg bg-card p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Route Status</span>
            <span className="text-xl font-extrabold text-foreground tabular-nums mt-0.5 block">
              {activeBusesCount} <span className="text-xs font-normal text-muted-foreground">Active Now</span>
            </span>
          </div>

          <div className="border border-border rounded-lg bg-card p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Selected Corridor</span>
            <span className="text-xs font-bold text-foreground truncate mt-1 block">
              {selectedRoute || "Select route"}
            </span>
          </div>

          <div className="border border-border rounded-lg bg-card p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Verified Passes</span>
            <span className="text-xs font-bold text-foreground mt-1 block">
              {authorizedRoutes.length} Route(s)
            </span>
          </div>

          <div className="border border-border rounded-lg bg-card p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">GPS Dispatch</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Live Telemetry
            </span>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="lg:hidden flex items-center p-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-border">
          <button
            onClick={() => setMobileView("map")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 ${
              mobileView === "map"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Transit Map</span>
          </button>
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 ${
              mobileView === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BusIcon className="w-3.5 h-3.5" />
            <span>Bus List ({filteredBuses.length})</span>
          </button>
        </div>

        {/* Master Split Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Route Switcher & Bus Selector */}
          <div className={`lg:col-span-4 space-y-4 ${mobileView === "map" ? "hidden lg:block" : "block"}`}>
            <div className="border border-border rounded-lg bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Assigned Routes</h2>
                  <p className="text-[11px] text-muted-foreground">Select to filter buses</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchAuthorizedBuses}
                  disabled={isRefreshing}
                  className="h-7 w-7 text-stone-500 hover:text-foreground"
                  title="Refresh bus telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {authorizedRoutes.length > 0 && (
                <div className="space-y-1.5">
                  <Select
                    value={selectedRoute || ""}
                    onValueChange={(val) => {
                      setSelectedRoute(val);
                      setSelectedBus(null);
                    }}
                  >
                    <SelectTrigger className="w-full h-10 rounded-md border-border text-xs font-semibold">
                      <SelectValue placeholder="Choose route corridor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {authorizedRoutes.map((route) => (
                        <SelectItem key={route} value={route} className="text-xs cursor-pointer">
                          {route}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedRoute && routeStops.length > 0 && (
                    <Select value={myStop?.name || ""} onValueChange={handleSelectStop}>
                      <SelectTrigger className="w-full h-10 rounded-md border-border text-xs" aria-label="My stop">
                        <SelectValue placeholder="Choose your stop for ETA..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routeStops.map((stop, index) => (
                          <SelectItem key={`${index}-${stop.name}`} value={stop.name} className="text-xs cursor-pointer">
                            {index + 1}. {stop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedRoute && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-muted-foreground">
                      <span>{filteredBuses.length} bus(es) scheduled</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {activeBusesCount} on route
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of buses for selected route */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Corridor Vehicles
                </span>
                {filteredBuses.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {filteredBuses.length} total
                  </span>
                )}
              </div>
              {renderBusList()}
            </div>
          </div>

          {/* Right Column: Clean Map View */}
          <div 
            className={`lg:col-span-8 ${mobileView === "list" ? "hidden lg:block" : "block"}`}
            ref={mapRef}
          >
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="p-3.5 border-b border-border bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-foreground">
                      {trackedBus ? `Tracking Bus ${trackedBus.number}` : "Campus Route Map"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {trackedBus ? `${trackedBus.route} • Live Telemetry` : "Pick an active bus to follow location"}
                    </p>
                  </div>
                </div>

                {trackedBus && (
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {formatLastUpdated(trackedBus.updatedAt, nowMs)}
                  </span>
                )}
              </div>

              <div className="h-[460px] sm:h-[540px] relative">
                <BusMap bus={trackedBus} nowMs={nowMs} stops={routeStops} myStop={myStop} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
