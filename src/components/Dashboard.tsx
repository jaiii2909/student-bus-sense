import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, Bus, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusMap from "./tracking/BusMap";

interface StudentData {
  _id?: string;
  studentId?: string;
  name: string;
  registeredRoutes: string[];
}

interface DashboardProps {
  studentData: StudentData;
  onLogout: () => void;
}

interface AuthorizedBus {
  id: string;
  number: string;
  route: string;
  status: "active" | "inactive";
  coordinates: { lat: number; lng: number } | null;
  updatedAt: string | null;
}

interface AuthorizedBusesResponse {
  studentId: string;
  registeredRoutes: string[];
  buses: AuthorizedBus[];
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

const Dashboard = ({ studentData, onLogout }: DashboardProps) => {
  const [selectedBus, setSelectedBus] = useState<string | null>(() => {
    const saved = localStorage.getItem("selectedBus");
    return saved ? saved : null;
  });
  const [selectedRoute, setSelectedRoute] = useState<string | null>(() => {
    const saved = localStorage.getItem("selectedRoute");
    return saved || null;
  });

  const [buses, setBuses] = useState<AuthorizedBus[]>([]);
  const [authorizedRoutes, setAuthorizedRoutes] = useState<string[]>(
    studentData.registeredRoutes || []
  );
  const [nowMs, setNowMs] = useState(Date.now());

  const getLocationState = (bus: AuthorizedBus): "pending" | "live" | "stale" => {
    if (!bus.coordinates || !bus.updatedAt) return "pending";
    const ageMs = nowMs - new Date(bus.updatedAt).getTime();
    return ageMs > STALE_THRESHOLD_MS ? "stale" : "live";
  };

  const formatLastUpdated = (updatedAt: string | null) => {
    if (!updatedAt) return "No location update yet";
    const updatedMs = new Date(updatedAt).getTime();
    const ageMs = Math.max(0, nowMs - updatedMs);
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return "Updated just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Updated ${days}d ago`;
  };

  useEffect(() => {
    if (!studentData.studentId) return;

    const fetchAuthorizedBuses = () => {
      axios
        .get<AuthorizedBusesResponse>(`/api/student/${studentData.studentId}/authorized-buses`)
        .then((res) => {
          setBuses(res.data.buses || []);
          setAuthorizedRoutes(res.data.registeredRoutes || []);
        })
        .catch((err) => console.error("Error fetching authorized buses:", err));
    };

    fetchAuthorizedBuses();
    const pollId = window.setInterval(fetchAuthorizedBuses, 15000);
    return () => window.clearInterval(pollId);
  }, [studentData.studentId]);

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    if (selectedRoute && !authorizedRoutes.includes(selectedRoute)) {
      setSelectedRoute(null);
      localStorage.removeItem("selectedRoute");
    }
  }, [selectedRoute, authorizedRoutes]);

  useEffect(() => {
    if (!selectedBus) return;
    const exists = buses.some((b) => b.id === selectedBus);
    if (!exists) {
      setSelectedBus(null);
      localStorage.removeItem("selectedBus");
    }
  }, [selectedBus, buses]);

  const handleLogout = () => {
    localStorage.removeItem("selectedBus");
    localStorage.removeItem("selectedRoute");
    onLogout();
  };

  const filteredBuses = selectedRoute
    ? buses.filter((bus) => bus.route === selectedRoute)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bus Tracker</h1>
              <p className="text-sm text-gray-600">Welcome, {studentData.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Buses</h2>
              <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Verified Access</span>
              </Badge>
            </div>

            <div className="mb-4">
              <Select
                value={selectedRoute || ""}
                onValueChange={(val) => {
                  setSelectedRoute(val);
                  localStorage.setItem("selectedRoute", val);
                  setSelectedBus(null);
                  localStorage.removeItem("selectedBus");
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
            </div>

            {filteredBuses.length === 0 ? (
              <Card className="text-center p-6">
                <CardContent>
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bus Access</h3>
                  <p className="text-gray-500 text-sm">
                    You don&apos;t have access to any bus routes. Please contact administration to register for bus services.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBuses.map((bus) => (
                <Card
                  key={bus.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    selectedBus === bus.id ? "border-blue-500 shadow-lg" : "border-transparent hover:border-blue-200"
                  } ${bus.status === "inactive" ? "opacity-60" : ""}`}
                  onClick={() => {
                    if (bus.status === "active") {
                      setSelectedBus(bus.id);
                      localStorage.setItem("selectedBus", bus.id);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">{bus.number}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge
                          variant={bus.status === "active" ? "default" : "secondary"}
                          className={bus.status === "active" ? "bg-green-100 text-green-800" : ""}
                        >
                          {bus.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Authorized
                        </Badge>
                        {getLocationState(bus) === "live" && (
                          <Badge className="bg-emerald-100 text-emerald-800">Live</Badge>
                        )}
                        {getLocationState(bus) === "stale" && (
                          <Badge className="bg-amber-100 text-amber-800">Stale</Badge>
                        )}
                        {getLocationState(bus) === "pending" && (
                          <Badge className="bg-gray-100 text-gray-700">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="font-medium text-gray-700">{bus.route}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Bus ID: {bus.id}</p>
                        <p className="text-xs text-gray-500">Route: {bus.route}</p>
                        <p className="text-xs text-gray-500">
                          {bus.coordinates ? "Live location available" : "Waiting for driver location"}
                        </p>
                        <p className="text-xs text-gray-500">{formatLastUpdated(bus.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {filteredBuses.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Secure Access: You can only view buses you&apos;re registered for</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full min-h-[600px] border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Live Bus Tracking</span>
                </CardTitle>
                <CardDescription>
                  {selectedBus
                    ? `Tracking ${filteredBuses.find((b) => b.id === selectedBus)?.number}`
                    : filteredBuses.length > 0
                    ? "Select a bus to view its live location"
                    : "Register for bus services to start tracking"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <BusMap selectedBusId={selectedBus} buses={buses} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
