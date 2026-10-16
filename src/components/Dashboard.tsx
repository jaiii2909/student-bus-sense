import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Shield, Route as RouteIcon, Bus as BusIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "./AppHeader";
import BusMap from "./tracking/BusMap";
import { TrackedBus, LOCATION_BADGE, getLocationState, formatLastUpdated } from "@/lib/busStatus";
import { connectBusSocket } from "@/lib/socket";

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
}

interface AuthorizedBusesResponse {
  studentId: string;
  registeredRoutes: string[];
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

const EmptyState = ({ icon: Icon, title, text }: { icon: typeof Shield; title: string; text: string }) => (
  <Card className="text-center p-6">
    <CardContent>
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{text}</p>
    </CardContent>
  </Card>
);

const Dashboard = ({ studentData, onLogout }: DashboardProps) => {
  const [selectedBus, setSelectedBusState] = useState<string | null>(() => readStored("selectedBus"));
  const [selectedRoute, setSelectedRouteState] = useState<string | null>(() => readStored("selectedRoute"));
  const [buses, setBuses] = useState<TrackedBus[]>([]);
  const [authorizedRoutes, setAuthorizedRoutes] = useState<string[]>(studentData.registeredRoutes || []);
  const [isLoading, setIsLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const mapRef = useRef<HTMLDivElement>(null);

  const setSelectedBus = (id: string | null) => {
    setSelectedBusState(id);
    writeStored("selectedBus", id);
  };

  const setSelectedRoute = (route: string | null) => {
    setSelectedRouteState(route);
    writeStored("selectedRoute", route);
  };

  // regular refresh as a fallback to the live socket
  useEffect(() => {
    if (!studentData.studentId) return;

    const fetchAuthorizedBuses = () => {
      axios
        .get<AuthorizedBusesResponse>(`/api/student/${studentData.studentId}/authorized-buses`)
        .then((res) => {
          setBuses(res.data.buses || []);
          setAuthorizedRoutes(res.data.registeredRoutes || []);
        })
        .catch((err) => console.error("Error fetching authorized buses:", err))
        .finally(() => setIsLoading(false));
    };

    fetchAuthorizedBuses();
    const pollId = window.setInterval(fetchAuthorizedBuses, 15000);
    return () => window.clearInterval(pollId);
  }, [studentData.studentId]);

  // live updates for buses on this student's routes
  useEffect(() => {
    if (!studentData.token) return;
    const socket = connectBusSocket(studentData.token);
    socket.on("busUpdate", (update: TrackedBus) => {
      setBuses((prev) => prev.map((bus) => (bus.id === update.id ? update : bus)));
    });
    return () => {
      socket.disconnect();
    };
  }, [studentData.token]);

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(tickId);
  }, []);

  // drop a saved route that is no longer authorized; auto-pick when there is only one
  useEffect(() => {
    if (selectedRoute && !authorizedRoutes.includes(selectedRoute)) {
      setSelectedRoute(null);
    } else if (!selectedRoute && authorizedRoutes.length === 1) {
      setSelectedRoute(authorizedRoutes[0]);
    }
  }, [selectedRoute, authorizedRoutes]);

  const filteredBuses = useMemo(
    () => (selectedRoute ? buses.filter((bus) => bus.route === selectedRoute) : []),
    [buses, selectedRoute]
  );

  // drop a saved bus that no longer exists; auto-pick when only one bus is running
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
    // on small screens the map sits below the list
    if (window.innerWidth < 1024) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = () => {
    setSelectedBus(null);
    setSelectedRoute(null);
    onLogout();
  };

  const trackedBus = filteredBuses.find((b) => b.id === selectedBus) || null;

  const renderBusList = () => {
    if (isLoading) {
      return [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />);
    }
    if (authorizedRoutes.length === 0) {
      return (
        <EmptyState
          icon={Shield}
          title="No Bus Access"
          text="You don't have access to any bus routes. Please contact administration to register for bus services."
        />
      );
    }
    if (!selectedRoute) {
      return <EmptyState icon={RouteIcon} title="Pick a route" text="Choose one of your routes above to see its buses." />;
    }
    if (filteredBuses.length === 0) {
      return <EmptyState icon={BusIcon} title="No buses yet" text="No buses are assigned to this route yet." />;
    }
    return filteredBuses.map((bus) => {
      const badge = LOCATION_BADGE[getLocationState(bus, nowMs)];
      return (
        <Card
          key={bus.id}
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
            selectedBus === bus.id ? "border-primary shadow-lg" : "border-transparent hover:border-blue-200"
          } ${bus.status === "inactive" ? "opacity-70" : ""}`}
          onClick={() => handleSelectBus(bus.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">{bus.number}</CardTitle>
              <Badge className={badge.className}>{badge.label}</Badge>
            </div>
            <CardDescription className="font-medium text-gray-700">{bus.route}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-500">
              {bus.status === "inactive" ? "Driver is not sharing location right now" : formatLastUpdated(bus.updatedAt, nowMs)}
            </p>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader title="Bus Tracker" subtitle={`Welcome, ${studentData.name}`} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Buses</h2>

            {authorizedRoutes.length > 0 && (
              <Select
                value={selectedRoute || ""}
                onValueChange={(val) => {
                  setSelectedRoute(val);
                  setSelectedBus(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {authorizedRoutes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {renderBusList()}
          </div>

          <div className="lg:col-span-2 scroll-mt-4" ref={mapRef}>
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Live Bus Tracking</span>
                </CardTitle>
                <CardDescription>
                  {trackedBus ? `Tracking ${trackedBus.number}` : "Select a bus to view its live location"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[420px] lg:h-[560px]">
                <BusMap bus={trackedBus} nowMs={nowMs} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
