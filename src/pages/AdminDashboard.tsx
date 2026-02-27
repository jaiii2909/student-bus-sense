import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit2, Trash2, Bus } from "lucide-react";
import axios from "axios";

interface Bus {
  id: string;
  number: string;
  route: string;
  capacity: number;
  status: "active" | "inactive" | "maintenance";
  driver?: string;
}

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  busos: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openBusDialog, setOpenBusDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [newBus, setNewBus] = useState({
    number: "",
    route: "",
    capacity: 50,
    driver: ""
  });

  const [newRoute, setNewRoute] = useState({
    name: "",
    startPoint: "",
    endPoint: ""
  });

  // Fetch buses and routes on component mount
  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await axios.get("/api/buses");
      setBuses(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching buses:", error);
      // Mock data for demo
      setBuses([
        {
          id: "1",
          number: "BUS-001",
          route: "Rajroohpur",
          capacity: 50,
          status: "active",
          driver: "John Doe"
        },
        {
          id: "2",
          number: "BUS-002",
          route: "Dhoomanganj",
          capacity: 45,
          status: "active",
          driver: "Jane Smith"
        },
        {
          id: "3",
          number: "BUS-003",
          route: "Kareli",
          capacity: 50,
          status: "maintenance",
          driver: ""
        }
      ]);
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get("/api/routes");
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
      // Mock data for demo
      setRoutes([
        {
          id: "1",
          name: "Rajroohpur",
          startPoint: "Main campus",
          endPoint: "Rajroohpur",
          busos: ["BUS-001"]
        },
        {
          id: "2",
          name: "Dhoomanganj",
          startPoint: "Main campus",
          endPoint: "Dhoomanganj",
          busos: ["BUS-002"]
        },
        {
          id: "3",
          name: "Kareli",
          startPoint: "Main campus",
          endPoint: "Kareli",
          busos: ["BUS-003"]
        }
      ]);
    }
  };

  const handleAddBus = async () => {
    if (!newBus.number || !newBus.route || !newBus.capacity) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (editingBus) {
        // Update existing bus
        const response = await axios.put(`/api/buses/${editingBus.id}`, {
          ...newBus,
          status: editingBus.status
        });
        setBuses(buses.map(b => b.id === editingBus.id ? response.data : b));
        setEditingBus(null);
      } else {
        // Create new bus
        const response = await axios.post("/api/buses", newBus);
        setBuses([...buses, response.data]);
      }
      setNewBus({ number: "", route: "", capacity: 50, driver: "" });
      setOpenBusDialog(false);
    } catch (error) {
      console.error("Error adding bus:", error);
      // Mock success for demo
      const bus: Bus = {
        id: (buses.length + 1).toString(),
        ...newBus,
        status: "active"
      };
      setBuses(editingBus ? buses.map(b => b.id === editingBus.id ? bus : b) : [...buses, bus]);
      setNewBus({ number: "", route: "", capacity: 50, driver: "" });
      setOpenBusDialog(false);
      setEditingBus(null);
    }
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.startPoint || !newRoute.endPoint) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (editingRoute) {
        const response = await axios.put(`/api/routes/${editingRoute.id}`, newRoute);
        setRoutes(routes.map(r => r.id === editingRoute.id ? response.data : r));
        setEditingRoute(null);
      } else {
        const response = await axios.post("/api/routes", newRoute);
        setRoutes([...routes, response.data]);
      }
      setNewRoute({ name: "", startPoint: "", endPoint: "" });
      setOpenRouteDialog(false);
    } catch (error) {
      console.error("Error adding route:", error);
      // Mock success for demo
      const route: Route = {
        id: (routes.length + 1).toString(),
        ...newRoute,
        busos: []
      };
      setRoutes(editingRoute ? routes.map(r => r.id === editingRoute.id ? route : r) : [...routes, route]);
      setNewRoute({ name: "", startPoint: "", endPoint: "" });
      setOpenRouteDialog(false);
      setEditingRoute(null);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await axios.delete(`/api/buses/${id}`);
        setBuses(buses.filter(b => b.id !== id));
      } catch (error) {
        console.error("Error deleting bus:", error);
        // Mock success for demo
        setBuses(buses.filter(b => b.id !== id));
      }
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await axios.delete(`/api/routes/${id}`);
        setRoutes(routes.filter(r => r.id !== id));
      } catch (error) {
        console.error("Error deleting route:", error);
        // Mock success for demo
        setRoutes(routes.filter(r => r.id !== id));
      }
    }
  };

  const handleEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setNewBus({
      number: bus.number,
      route: bus.route,
      capacity: bus.capacity,
      driver: bus.driver || ""
    });
    setOpenBusDialog(true);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setNewRoute({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint
    });
    setOpenRouteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenBusDialog(false);
    setOpenRouteDialog(false);
    setEditingBus(null);
    setEditingRoute(null);
    setNewBus({ number: "", route: "", capacity: 50, driver: "" });
    setNewRoute({ name: "", startPoint: "", endPoint: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage buses and routes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bus className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{buses.length}</div>
              <p className="text-xs text-gray-400 mt-1">{buses.filter(b => b.status === "active").length} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{routes.length}</div>
              <p className="text-xs text-gray-400 mt-1">Active routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{buses.reduce((sum, b) => sum + b.capacity, 0)}</div>
              <p className="text-xs text-gray-400 mt-1">Total seats</p>
            </CardContent>
          </Card>
        </div>

        {/* Buses Section */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-purple-50 rounded-t-lg">
            <div>
              <CardTitle>Buses</CardTitle>
              <CardDescription>Manage your bus fleet</CardDescription>
            </div>
            <Dialog open={openBusDialog} onOpenChange={(open) => {
              setOpenBusDialog(open);
              if (!open) handleCloseDialogs();
            }}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingBus(null);
                    setNewBus({ number: "", route: "", capacity: 50, driver: "" });
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Bus
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBus ? "Edit Bus" : "Add New Bus"}</DialogTitle>
                  <DialogDescription>
                    {editingBus ? "Update bus information" : "Add a new bus to the fleet"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bus-number">Bus Number</Label>
                    <Input
                      id="bus-number"
                      placeholder="e.g., BUS-001"
                      value={newBus.number}
                      onChange={(e) => setNewBus({ ...newBus, number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bus-route">Route</Label>
                    <select
                      id="bus-route"
                      className="w-full border rounded-md px-3 py-2"
                      value={newBus.route}
                      onChange={(e) => setNewBus({ ...newBus, route: e.target.value })}
                    >
                      <option value="">Select a route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.name}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bus-capacity">Capacity</Label>
                    <Input
                      id="bus-capacity"
                      type="number"
                      placeholder="50"
                      value={newBus.capacity}
                      onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bus-driver">Driver Name</Label>
                    <Input
                      id="bus-driver"
                      placeholder="Driver name"
                      value={newBus.driver}
                      onChange={(e) => setNewBus({ ...newBus, driver: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddBus} className="w-full bg-purple-600 hover:bg-purple-700">
                    {editingBus ? "Update Bus" : "Add Bus"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Number</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.number}</TableCell>
                    <TableCell>{bus.route}</TableCell>
                    <TableCell>{bus.capacity} seats</TableCell>
                    <TableCell>{bus.driver || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bus.status)}>
                        {bus.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBus(bus)}
                        className="mr-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBus(bus.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Routes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-lg">
            <div>
              <CardTitle>Routes</CardTitle>
              <CardDescription>Manage bus routes</CardDescription>
            </div>
            <Dialog open={openRouteDialog} onOpenChange={(open) => {
              setOpenRouteDialog(open);
              if (!open) handleCloseDialogs();
            }}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingRoute(null);
                    setNewRoute({ name: "", startPoint: "", endPoint: "" });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Route
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
                  <DialogDescription>
                    {editingRoute ? "Update route information" : "Add a new bus route"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="route-name">Route Name</Label>
                    <Input
                      id="route-name"
                      placeholder="e.g., Rajroohpur"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="route-start">Start Point</Label>
                    <Input
                      id="route-start"
                      placeholder="Main campus"
                      value={newRoute.startPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="route-end">End Point</Label>
                    <Input
                      id="route-end"
                      placeholder="Destination"
                      value={newRoute.endPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddRoute} className="w-full bg-blue-600 hover:bg-blue-700">
                    {editingRoute ? "Update Route" : "Add Route"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Start Point</TableHead>
                  <TableHead>End Point</TableHead>
                  <TableHead>Buses Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>{route.startPoint}</TableCell>
                    <TableCell>{route.endPoint}</TableCell>
                    <TableCell>{route.busos.length}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRoute(route)}
                        className="mr-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
