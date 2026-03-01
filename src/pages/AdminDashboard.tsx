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
import { ArrowLeft, Plus, Edit2, Trash2, Bus, Users } from "lucide-react";
import axios from "axios";
import LoginForm from "@/components/auth/LoginForm";

interface Bus {
  _id: string;
  busNumber: string;
  route: string;
  status: "active" | "inactive";
}

interface Route {
  _id: string;
  routeName: string;
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
  registeredRoutes: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openBusDialog, setOpenBusDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [newBus, setNewBus] = useState({
    busNumber: "",
    route: ""
  });

  const [newRoute, setNewRoute] = useState({
    routeName: ""
  });

  const [selectedStudentRoutes, setSelectedStudentRoutes] = useState<string[]>([]);

  useEffect(() => {
    if (loggedIn) {
      fetchBuses();
      fetchRoutes();
      fetchStudents();
    }
  }, [loggedIn]);

  const fetchBuses = async () => {
    try {
      const response = await axios.get("/api/admin/buses");
      setBuses(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching buses:", error);
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get("/api/admin/routes");
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get("/api/admin/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleAddBus = async () => {
    if (!newBus.busNumber || !newBus.route) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (editingBus) {
        const response = await axios.put(`/api/admin/buses/${editingBus._id}`, {
          busNumber: newBus.busNumber,
          route: newBus.route
        });
        setBuses(buses.map((b) => (b._id === editingBus._id ? response.data : b)));
        setEditingBus(null);
      } else {
        const response = await axios.post("/api/admin/buses", newBus);
        setBuses([...buses, response.data]);
      }
      setNewBus({ busNumber: "", route: "" });
      setOpenBusDialog(false);
    } catch (error) {
      console.error("Error adding bus:", error);
      setOpenBusDialog(false);
      setEditingBus(null);
    }
  };

  const handleAddRoute = async () => {
    if (!newRoute.routeName) {
      alert("Please fill the route name");
      return;
    }

    try {
      if (editingRoute) {
        const response = await axios.put(`/api/admin/routes/${editingRoute._id}`, newRoute);
        setRoutes(routes.map((r) => (r._id === editingRoute._id ? response.data : r)));
        setEditingRoute(null);
      } else {
        const response = await axios.post("/api/admin/routes", newRoute);
        setRoutes([...routes, response.data]);
      }
      setNewRoute({ routeName: "" });
      setOpenRouteDialog(false);
    } catch (error) {
      console.error("Error adding route:", error);
      setNewRoute({ routeName: "" });
      setOpenRouteDialog(false);
      setEditingRoute(null);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await axios.delete(`/api/admin/buses/${id}`);
        setBuses(buses.filter((b) => b._id !== id));
      } catch (error) {
        console.error("Error deleting bus:", error);
      }
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await axios.delete(`/api/admin/routes/${id}`);
        setRoutes(routes.filter((r) => r._id !== id));
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    }
  };

  const handleEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setNewBus({
      busNumber: bus.busNumber,
      route: bus.route
    });
    setOpenBusDialog(true);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setNewRoute({
      routeName: route.routeName
    });
    setOpenRouteDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setSelectedStudentRoutes(student.registeredRoutes || []);
    setOpenStudentDialog(true);
  };

  const handleToggleStudentRoute = (routeName: string) => {
    setSelectedStudentRoutes((prev) =>
      prev.includes(routeName)
        ? prev.filter((r) => r !== routeName)
        : [...prev, routeName]
    );
  };

  const handleUpdateStudentRoutes = async () => {
    if (!editingStudent) return;

    try {
      const response = await axios.put(`/api/admin/students/${editingStudent._id}/routes`, {
        registeredRoutes: selectedStudentRoutes
      });

      setStudents(
        students.map((s) => (s._id === editingStudent._id ? response.data : s))
      );
      setOpenStudentDialog(false);
      setEditingStudent(null);
      setSelectedStudentRoutes([]);
    } catch (error) {
      console.error("Error updating student routes:", error);
    }
  };

  const handleCloseDialogs = () => {
    setOpenBusDialog(false);
    setOpenRouteDialog(false);
    setOpenStudentDialog(false);
    setEditingBus(null);
    setEditingRoute(null);
    setEditingStudent(null);
    setSelectedStudentRoutes([]);
    setNewBus({ busNumber: "", route: "" });
    setNewRoute({ routeName: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!loggedIn) {
    return (
      <LoginForm
        role="admin"
        onLogin={() => setLoggedIn(true)}
        onBack={() => navigate("/role-selection")}
      />
    );
  }

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage buses, routes and student access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bus className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{buses.length}</div>
              <p className="text-xs text-gray-400 mt-1">{buses.filter((b) => b.status === "active").length} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{routes.length}</div>
              <p className="text-xs text-gray-400 mt-1">Configured routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{students.length}</div>
              <p className="text-xs text-gray-400 mt-1">Route access managed</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-purple-50 rounded-t-lg">
            <div>
              <CardTitle>Buses</CardTitle>
              <CardDescription>Manage your bus fleet</CardDescription>
            </div>
            <Dialog
              open={openBusDialog}
              onOpenChange={(open) => {
                setOpenBusDialog(open);
                if (!open) handleCloseDialogs();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingBus(null);
                    setNewBus({ busNumber: "", route: "" });
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
                      placeholder="e.g., R1"
                      value={newBus.busNumber}
                      onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
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
                        <option key={route._id} value={route.routeName}>
                          {route.routeName}
                        </option>
                      ))}
                    </select>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((bus) => (
                  <TableRow key={bus._id}>
                    <TableCell className="font-medium">{bus.busNumber}</TableCell>
                    <TableCell>{bus.route}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bus.status)}>{bus.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditBus(bus)} className="mr-2">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBus(bus._id)}
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

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-lg">
            <div>
              <CardTitle>Routes</CardTitle>
              <CardDescription>Manage bus routes</CardDescription>
            </div>
            <Dialog
              open={openRouteDialog}
              onOpenChange={(open) => {
                setOpenRouteDialog(open);
                if (!open) handleCloseDialogs();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingRoute(null);
                    setNewRoute({ routeName: "" });
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
                      value={newRoute.routeName}
                      onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route._id}>
                    <TableCell className="font-medium">{route.routeName}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRoute(route)} className="mr-2">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route._id)}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-green-50 rounded-t-lg">
            <div>
              <CardTitle>Student Route Access</CardTitle>
              <CardDescription>Assign authorized routes to each student</CardDescription>
            </div>
            <Dialog
              open={openStudentDialog}
              onOpenChange={(open) => {
                setOpenStudentDialog(open);
                if (!open) handleCloseDialogs();
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Student Routes</DialogTitle>
                  <DialogDescription>
                    {editingStudent
                      ? `Select routes for ${editingStudent.name} (${editingStudent.studentId})`
                      : "Select routes for student"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {routes.map((route) => (
                    <label key={route._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedStudentRoutes.includes(route.routeName)}
                        onChange={() => handleToggleStudentRoute(route.routeName)}
                      />
                      <span>{route.routeName}</span>
                    </label>
                  ))}
                </div>

                <Button onClick={handleUpdateStudentRoutes} className="w-full bg-green-600 hover:bg-green-700">
                  Save Route Access
                </Button>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Authorized Routes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {student.registeredRoutes.length > 0 ? (
                          student.registeredRoutes.map((route) => (
                            <Badge key={`${student._id}-${route}`} className="bg-green-100 text-green-800">
                              {route}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No routes assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                        <Users className="w-4 h-4 mr-1" />
                        Manage Routes
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
