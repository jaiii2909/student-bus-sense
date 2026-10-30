import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Bell,
  BellOff,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Gauge,
  Wifi,
  Sparkles,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SectionCard } from "@/components/ui/section-card";
import AppHeader from "./AppHeader";
import ChangePasswordDialog from "./ChangePasswordDialog";
import AnnouncementBanner, { Announcement } from "./AnnouncementBanner";
import BusMap from "./tracking/BusMap";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";
import { connectBusSocket } from "@/lib/socket";
import { Stop, etaMinutes, etaText } from "@/lib/eta";
import { notificationsSupported, requestNotificationPermission, showNotification } from "@/lib/notify";
import { useToast } from "@/hooks/use-toast";
import { plural } from "@/lib/utils";

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

// summary tiles: fixed width in the phone swipe row, grid cells from md up
const STAT_CARD = "w-40 shrink-0 snap-start md:w-auto";

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

const Dashboard = ({ studentData, onLogout, onTokenChange }: DashboardProps) => {
  const [selectedBus, setSelectedBusState] = useState<string | null>(() => readStored("selectedBus"));
  const [selectedRoute, setSelectedRouteState] = useState<string | null>(() => readStored("selectedRoute"));
  const [buses, setBuses] = useState<TrackedBus[]>([]);
  const [authorizedRoutes, setAuthorizedRoutes] = useState<string[]>(studentData.registeredRoutes || []);
  const [stopsByRoute, setStopsByRoute] = useState<Record<string, Stop[]>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "live">("all");

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
  // phones show one pane at a time; start on the list until a route is chosen, since the route picker lives there
  const [mobileView, setMobileView] = useState<"map" | "list">(() => (readStored("selectedRoute") ? "map" : "list"));
  const [socketConnected, setSocketConnected] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // "bus is near my stop" alert, remembered on this device
  const [nearAlertOn, setNearAlertOn] = useState(() => readStored("nearAlert") === "1");
  // buses already alerted for this approach, so each approach alerts once
  const alertedBusIdsRef = useRef<Set<string>>(new Set());

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
    
    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

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

  const filteredBuses = useMemo(() => {
    if (!selectedRoute) return [];
    let list = buses.filter((bus) => bus.route === selectedRoute);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.number.toLowerCase().includes(q));
    }

    if (statusFilter === "active") {
      list = list.filter((b) => b.status === "active");
    } else if (statusFilter === "live") {
      list = list.filter((b) => getLocationState(b, nowMs) === "live");
    }

    return list;
  }, [buses, selectedRoute, searchQuery, statusFilter, nowMs]);

  useEffect(() => {
    if (isLoading) return;
    if (selectedBus && !filteredBuses.some((b) => b.id === selectedBus)) {
      // keep bus if search filtered it, or clear if entirely removed
      const existsInRoute = buses.some((b) => b.route === selectedRoute && b.id === selectedBus);
      if (!existsInRoute) setSelectedBus(null);
    } else if (!selectedBus) {
      const running = filteredBuses.filter((b) => b.status === "active");
      if (running.length === 1) setSelectedBus(running[0].id);
    }
  }, [selectedBus, filteredBuses, isLoading, buses, selectedRoute]);

  // a different stop or route starts fresh
  useEffect(() => {
    alertedBusIdsRef.current.clear();
  }, [selectedRoute, myStopName]);

  // alert once when a running bus on this route gets within NEAR_MINUTES of my stop
  useEffect(() => {
    if (!nearAlertOn || !myStop) return;
    const NEAR_MINUTES = 5;
    const REARM_MINUTES = 10;
    filteredBuses.forEach((bus) => {
      const minutes = getLocationState(bus, Date.now()) === "live" ? etaMinutes(bus, myStop) : null;
      const alerted = alertedBusIdsRef.current;
      if (minutes !== null && minutes <= NEAR_MINUTES && !alerted.has(bus.id)) {
        alerted.add(bus.id);
        const text = etaText(bus, myStop) || "";
        toast({ title: `Bus ${bus.number} is approaching`, description: text });
        showNotification(`Bus ${bus.number} is approaching`, text);
      } else if ((minutes === null || minutes > REARM_MINUTES) && alerted.has(bus.id)) {
        alerted.delete(bus.id);
      }
    });
  }, [filteredBuses, myStop, nearAlertOn, toast]);

  const handleToggleNearAlert = async () => {
    if (nearAlertOn) {
      setNearAlertOn(false);
      writeStored("nearAlert", null);
      return;
    }
    const allowed = await requestNotificationPermission();
    setNearAlertOn(true);
    writeStored("nearAlert", "1");
    alertedBusIdsRef.current.clear();
    toast({
      title: "Approach Alert Activated",
      description: allowed
        ? "You'll be alerted when a bus is approximately 5 mins from your stop. Keep this tab active."
        : notificationsSupported()
        ? "Desktop notifications are blocked. You will receive in-app alerts while this tab is open."
        : "You will receive in-app alerts while this tab is open.",
    });
  };

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
    const next = [...dismissedIds.filter((d) => announcements.some((a) => a.id === d)), id];
    setDismissedIds(next);
    writeStored("dismissedAnnouncements", JSON.stringify(next));
  };

  const handleLogout = () => {
    setSelectedBus(null);
    setSelectedRoute(null);
    onLogout();
  };

  const allRouteBuses = selectedRoute ? buses.filter((b) => b.route === selectedRoute) : [];
  const trackedBus = allRouteBuses.find((b) => b.id === selectedBus) || null;
  const activeBusesCount = allRouteBuses.filter((b) => b.status === "active").length;
  const liveBusesCount = allRouteBuses.filter((b) => getLocationState(b, nowMs) === "live").length;

  const renderBusList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36 rounded" />
              <div className="pt-2 border-t border-border/60 flex justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (authorizedRoutes.length === 0) {
      return (
        <EmptyState
          icon={ShieldAlert}
          title="No Semester Pass Registered"
          text="You have no fee-cleared bus passes on file for this academic semester. Please visit the Campus Transport Office at Gate 1."
        />
      );
    }

    if (!selectedRoute) {
      return (
        <EmptyState
          icon={RouteIcon}
          title="Choose a Route Corridor"
          text="Select your authorized campus transit corridor from the dropdown above to display active vehicles."
        />
      );
    }

    if (allRouteBuses.length === 0) {
      return (
        <EmptyState
          icon={BusIcon}
          title="No Scheduled Buses"
          text="No vehicles are assigned to this corridor today. Please review morning or evening transit timings."
        />
      );
    }

    if (filteredBuses.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="No Matching Vehicles"
          text="No buses match your current search or filter criteria. Try resetting the filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs h-8"
            >
              Reset Filters
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-2.5">
        {filteredBuses.map((bus) => {
          const isSelected = selectedBus === bus.id;
          const locationState = getLocationState(bus, nowMs);
          const badge = LOCATION_BADGE[locationState];
          const eta = myStop && locationState === "live" ? etaText(bus, myStop) : null;

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
              className={`p-3.5 rounded-xl border transition cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-primary/80 shadow-md"
                  : "bg-card border-border/80 hover:border-muted-foreground/40 shadow-xs hover:shadow-sm"
              } ${bus.status === "inactive" ? "opacity-70" : ""}`}
            >
              {/* Header: Bus ID, Route, and Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {bus.number}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Bus {bus.number}</span>
                      {isSelected && (
                        <span className="text-2xs text-primary font-bold px-1.5 py-px rounded-full bg-primary/10">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-2xs text-muted-foreground truncate max-w-[140px] sm:max-w-[180px]">
                      {bus.route}
                    </p>
                  </div>
                </div>

                <Badge className={`${badge.className} text-2xs font-bold gap-1 px-2 py-0.5 rounded-full shrink-0`}>
                  <span className="relative flex h-1.5 w-1.5">
                    {badge.pingClass && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.pingClass}`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${badge.dotClass}`} />
                  </span>
                  <span>{badge.label}</span>
                </Badge>
              </div>

              {/* ETA Highlight Strip if available */}
              {eta && (
                <div className="mb-2 py-1 px-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-2xs font-semibold flex items-center justify-between">
                  <span>Approach ETA</span>
                  <span className="font-mono font-bold">{eta}</span>
                </div>
              )}

              {/* Bottom Telemetry Strip */}
              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-2xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  {bus.status === "inactive"
                    ? "Driver off-duty"
                    : formatLastUpdated(bus.updatedAt, nowMs)}
                </span>

                {bus.speedKmh !== undefined && bus.speedKmh !== null && locationState === "live" ? (
                  <span className="font-mono text-2xs text-accent font-semibold flex items-center gap-1">
                    <Gauge className="w-3 h-3" aria-hidden="true" />
                    {Math.round(bus.speedKmh)} km/h
                  </span>
                ) : isSelected ? (
                  <span className="text-primary font-bold text-2xs flex items-center gap-1">
                    <Check className="w-3 h-3" aria-hidden="true" /> Tracking on Map
                  </span>
                ) : (
                  <span className="text-muted-foreground text-2xs flex items-center gap-0.5">
                    Tap to track <ChevronRight className="w-3 h-3" aria-hidden="true" />
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
        title="Student Bus Tracking Radar"
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

      <main id="main-content" tabIndex={-1} className="focus:outline-none container mx-auto px-4 py-6 max-w-7xl flex-1 space-y-5">
        <AnnouncementBanner
          announcements={visibleAnnouncements}
          nowMs={nowMs}
          onDismiss={handleDismissAnnouncement}
        />

        {/* Mobility Telemetry Metric Strip */}
        {/* phones: one swipeable row instead of a 2×2 block above the map; md+: 4-column grid */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          <StatCard className={STAT_CARD} label="Corridor Fleet Status" value={activeBusesCount} unit={`Active / ${allRouteBuses.length} Scheduled`} />

          <StatCard className={STAT_CARD} label="Live Satellite GPS">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {liveBusesCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveBusesCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
              </span>
              <span className="truncate text-xs font-bold text-foreground">
                {liveBusesCount > 0 ? `${plural(liveBusesCount, "Vehicle")} Live` : "No live GPS signal"}
              </span>
            </div>
          </StatCard>

          <StatCard className={STAT_CARD} label="Authorized Pass">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <RouteIcon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate">{selectedRoute || `${plural(authorizedRoutes.length, "Route")} Verified`}</span>
            </div>
          </StatCard>

          <StatCard className={STAT_CARD} label="Telemetry Server">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Wifi className={`w-3.5 h-3.5 shrink-0 ${socketConnected ? "text-emerald-500" : "text-amber-500"}`} aria-hidden="true" />
              <span className="truncate">{socketConnected ? "Live Socket Synced" : "Polling Gateway (15s)"}</span>
            </div>
          </StatCard>
        </div>

        {/* Mobile View Toggle Switcher */}
        <SegmentedControl
          aria-label="Show map or vehicle list"
          className="lg:hidden"
          value={mobileView}
          onChange={setMobileView}
          options={[
            { value: "map", label: "Interactive Map", icon: MapPin },
            { value: "list", label: `Vehicles (${filteredBuses.length})`, icon: BusIcon },
          ]}
        />

        {/* Master Split Grid: Sidebar & Map Display */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Route Controls & Bus Directory */}
          <div className={`lg:col-span-4 space-y-4 ${mobileView === "map" ? "hidden lg:block" : "block"}`}>
            
            {/* Route & Stop Selection Card */}
            <SectionCard
              title="Transit Corridors"
              description="Select your verified route"
              actions={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchAuthorizedBuses}
                  disabled={isRefreshing}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Refresh bus telemetry"
                  aria-label="Refresh bus telemetry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} aria-hidden="true" />
                </Button>
              }
            >
              {authorizedRoutes.length > 0 && (
                <div className="space-y-3 p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="route-select">Corridor Route</Label>
                    <Select
                      value={selectedRoute || ""}
                      onValueChange={(val) => {
                        setSelectedRoute(val);
                        setSelectedBus(null);
                      }}
                    >
                      <SelectTrigger id="route-select" className="w-full h-10 border-border text-xs font-semibold">
                        <SelectValue placeholder="Choose route corridor…" />
                      </SelectTrigger>
                      <SelectContent>
                        {authorizedRoutes.map((route) => (
                          <SelectItem key={route} value={route} className="text-xs cursor-pointer">
                            {route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRoute && routeStops.length > 0 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="stop-select">Your Destination Stop</Label>
                      <Select value={myStop?.name || ""} onValueChange={handleSelectStop}>
                        <SelectTrigger id="stop-select" className="w-full h-10 border-border text-xs">
                          <SelectValue placeholder="Choose your stop for ETA…" />
                        </SelectTrigger>
                        <SelectContent>
                          {routeStops.map((stop, index) => (
                            <SelectItem key={`${index}-${stop.name}`} value={stop.name} className="text-xs cursor-pointer">
                              {index + 1}. {stop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedRoute && myStop && (
                    <Button
                      variant={nearAlertOn ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleNearAlert}
                      aria-pressed={nearAlertOn}
                      className={`w-full h-9 text-xs font-semibold gap-2 transition ${
                        nearAlertOn ? "bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {nearAlertOn ? <Bell className="w-3.5 h-3.5 text-accent animate-bounce" aria-hidden="true" /> : <BellOff className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
                      <span>{nearAlertOn ? "Alerts Enabled (~5 min approach)" : "Alert Me When Bus Is Near"}</span>
                    </Button>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Vehicle Directory & Search Filter */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  Corridor Vehicles
                </span>
                {allRouteBuses.length > 0 && (
                  <span className="text-2xs text-muted-foreground font-mono">
                    {allRouteBuses.length} scheduled
                  </span>
                )}
              </div>

              {/* Search & Filter Controls */}
              {allRouteBuses.length > 0 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="search"
                      name="bus-search"
                      aria-label="Search bus number"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Search bus number…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs border-border bg-card"
                    />
                  </div>

                  <SegmentedControl
                    aria-label="Filter vehicles by status"
                    size="sm"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "all", label: `All (${allRouteBuses.length})` },
                      { value: "active", label: `Active (${activeBusesCount})` },
                      { value: "live", label: `Live GPS (${liveBusesCount})` },
                    ]}
                  />
                </div>
              )}

              {/* Bus Card List */}
              {renderBusList()}
            </div>
          </div>

          {/* Right Column: Centerpiece Map Canvas */}
          <div 
            className={`lg:col-span-8 scroll-mt-20 ${mobileView === "list" ? "hidden lg:block" : "block"}`}
            ref={mapRef}
          >
            <SectionCard
              icon={MapPin}
              title={trackedBus ? `Live Telemetry: Bus ${trackedBus.number}` : "Campus Route Network"}
              description={
                trackedBus
                  ? `${trackedBus.route} • ${LOCATION_BADGE[getLocationState(trackedBus, nowMs)].label}`
                  : "Select an active vehicle to stream real-time GPS telemetry"
              }
              actions={
                trackedBus && (
                  <span className="hidden sm:inline-block text-xs font-mono tabular-nums text-muted-foreground px-2.5 py-1 rounded-md bg-card border border-border/70">
                    {formatLastUpdated(trackedBus.updatedAt, nowMs)}
                  </span>
                )
              }
            >
              {/* Map Canvas Container */}
              {/* phones: fill most of the screen below the sticky header; desktop: fixed height */}
              <div className="h-[70dvh] min-h-[340px] max-h-[620px] sm:h-[620px] relative">
                <BusMap
                  bus={trackedBus}
                  nowMs={nowMs}
                  stops={routeStops}
                  myStop={myStop}
                />
              </div>
            </SectionCard>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
