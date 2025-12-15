import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, Clock, Bus, Navigation, Shield, Sparkles, Radio } from "lucide-react";
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

  const studentBuses = allBuses.filter(bus => 
    studentData.registeredRoutes.includes(bus.id)
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="decorative-circle w-96 h-96 bg-primary/10 top-[-5%] right-[-10%]" />
      <div className="decorative-circle w-64 h-64 bg-secondary/10 bottom-[20%] left-[-5%]" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm">
              <Bus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CampusRide</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Welcome, {studentData.name}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="flex items-center gap-2 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-smooth"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bus List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Your Buses</h2>
              <Badge className="status-active flex items-center gap-1 px-3 py-1">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            </div>
            
            {studentBuses.length === 0 ? (
              <Card className="text-center p-8 border-0 shadow-card glass">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2">No Bus Access</h3>
                  <p className="text-muted-foreground text-sm">
                    You don't have access to any bus routes. Please contact administration to register.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {studentBuses.map((bus, index) => (
                  <Card 
                    key={bus.id}
                    className={`cursor-pointer card-hover border-0 shadow-card glass animate-fade-in ${
                      selectedBus === bus.id 
                        ? 'ring-2 ring-primary shadow-glow-sm' 
                        : ''
                    } ${bus.status === 'inactive' ? 'opacity-60' : ''}`}
                    onClick={() => bus.status === 'active' && setSelectedBus(bus.id)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            bus.status === 'active' ? 'bg-gradient-primary' : 'bg-muted'
                          }`}>
                            <Bus className={`w-5 h-5 ${bus.status === 'active' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-card-foreground">
                              {bus.number}
                            </CardTitle>
                            <CardDescription className="font-medium text-muted-foreground text-xs">
                              {bus.route}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={bus.status === 'active' ? 'status-active' : 'status-inactive'}>
                            {bus.status === 'active' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
                            {bus.status === 'active' ? 'Live' : 'Offline'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {bus.status === 'active' && (
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-3 p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-2 text-sm text-card-foreground">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current Location</p>
                              <p className="font-medium">{bus.currentLocation}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-card-foreground">
                            <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                              <p className="font-medium">{bus.estimatedArrival}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-card-foreground">
                            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                              <Navigation className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Next Stop</p>
                              <p className="font-medium">{bus.nextStop}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {studentBuses.length > 0 && (
              <Card className="border-0 bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">
                      Secure Access: Only your registered routes are visible
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-full min-h-[600px] border-0 shadow-elevated glass overflow-hidden">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary-foreground" />
                      </div>
                      Live Tracking
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedBus 
                        ? `Tracking ${studentBuses.find(b => b.id === selectedBus)?.number}` 
                        : studentBuses.length > 0 
                          ? 'Select a bus to view its live location'
                          : 'Register for bus services to start tracking'}
                    </CardDescription>
                  </div>
                  {selectedBus && (
                    <Badge className="status-active animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <BusMap selectedBusId={selectedBus} buses={studentBuses} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
