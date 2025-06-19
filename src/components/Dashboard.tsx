
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, Clock, Bus, Navigation } from "lucide-react";
import BusMap from "./tracking/BusMap";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);

  // Mock data for student's available buses
  const availableBuses = [
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
              <p className="text-sm text-gray-600">Welcome, Student</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Buses</h2>
            
            {availableBuses.map((bus) => (
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
                    <Badge 
                      variant={bus.status === 'active' ? 'default' : 'secondary'}
                      className={bus.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {bus.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
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
            ))}
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
                    ? `Tracking ${availableBuses.find(b => b.id === selectedBus)?.number}` 
                    : 'Select a bus to view its live location'}
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
