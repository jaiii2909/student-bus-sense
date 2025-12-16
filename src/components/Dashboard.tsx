
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, Clock, Bus, Navigation, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusMap from "./tracking/BusMap";

interface StudentData {
  id: string;
  name: string;
  registeredRoutes: string[];
}

interface DashboardProps {
  studentData: StudentData;
  onLogout: () => void;
}

const Dashboard = ({ studentData, onLogout }: DashboardProps) => {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(studentData.registeredRoutes[0] || null);

  // All available buses in the system
  const allBuses = [
    {
      id: "bus-1",
      route: "Route A - Main Campus",
      number: "MC-101",
      status: "active",
      currentLocation: "Near Library",
      estimatedArrival: "5 mins",
      nextStop: "Engineering Block",
    },
    {
      id: "bus-2", 
      route: "Route B - Hostel Express",
      number: "HE-201",
      status: "active",
      currentLocation: "Sports Complex",
      estimatedArrival: "12 mins",
      nextStop: "Hostel Block A",
    },
    {
      id: "bus-3",
      route: "Route C - City Center",
      number: "CC-301",
      status: "inactive",
      currentLocation: "Depot",
      estimatedArrival: "Not running",
      nextStop: "Service break",
    },
  ];

  // Filter buses based on student's registered routes
  const availableBuses = allBuses.filter(bus => 
    studentData.registeredRoutes.some(route => bus.route.includes(route))
  );

  const routes = [...new Set(availableBuses.map(bus => bus.route))];

  const filteredBuses = selectedRoute ? availableBuses.filter(bus => bus.route === selectedRoute) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
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
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bus List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Buses</h2>
              <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Verified Access</span>
              </Badge>
            </div>
            
            <div className="mb-4">
              <Select value={selectedRoute || ""} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map(route => (
                    <SelectItem key={route} value={route}>{route}</SelectItem>
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
                    You don't have access to any bus routes. Please contact administration to register for bus services.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBuses.map((bus) => (
                <Card 
                  key={bus.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    selectedBus === bus.id 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-transparent hover:border-blue-200'
                  } ${bus.status === 'inactive' ? 'opacity-60' : ''}`}
                  onClick={() => bus.status === 'active' && setSelectedBus(bus.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {bus.number}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Badge 
                          variant={bus.status === 'active' ? 'default' : 'secondary'}
                          className={bus.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {bus.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Authorized
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="font-medium text-gray-700">
                      {bus.route}
                    </CardDescription>
                  </CardHeader>
                  
                  {bus.status === 'active' && (
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{bus.currentLocation}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {bus.estimatedArrival}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Navigation className="w-4 h-4" />
                        <span>Next: {bus.nextStop}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}

            {filteredBuses.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">
                      Secure Access: You can only view buses you're registered for
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-full min-h-[600px] border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Live Bus Tracking</span>
                </CardTitle>
                <CardDescription>
                  {selectedBus 
                    ? `Tracking ${filteredBuses.find(b => b.id === selectedBus)?.number}` 
                    : filteredBuses.length > 0 
                      ? 'Select a bus to view its live location'
                      : 'Register for bus services to start tracking'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full p-0">
                <BusMap selectedBusId={selectedBus} buses={availableBuses} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
