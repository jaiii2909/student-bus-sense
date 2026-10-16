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
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Users, MapPin } from "lucide-react";
import axios from "axios";
import LoginForm from "@/components/auth/LoginForm";
import AppHeader from "@/components/AppHeader";
import MapView from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import { clearSession, getSession, saveSession } from "@/lib/session";
import { connectBusSocket } from "@/lib/socket";
import { TrackedBus } from "@/lib/busStatus";

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

interface PendingDelete {
  title: string;
  description: string;
  run: () => Promise<void>;
}

const EMPTY_STUDENT = { studentId: "", name: "", password: "" };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(() => getSession("admin")?.token || null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [locations, setLocations] = useState<TrackedBus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openBusDialog, setOpenBusDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  // null while adding a new student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const [newBus, setNewBus] = useState({
    busNumber: "",
    route: ""
  });

  const [newRoute, setNewRoute] = useState({
    routeName: ""
  });

  const [newStudent, setNewStudent] = useState(EMPTY_STUDENT);
  const [selectedStudentRoutes, setSelectedStudentRoutes] = useState<string[]>([]);

  const showError = (error: unknown, fallback: string) => {
    console.error(fallback, error);
    toast({ title: fallback, description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
  };

  const fetchAll = async () => {
    try {
      const [busRes, routeRes, studentRes, locationRes] = await Promise.all([
        axios.get("/api/admin/buses"),
        axios.get("/api/admin/routes"),
        axios.get("/api/admin/students"),
        axios.get("/api/admin/locations")
      ]);
      setBuses(busRes.data);
      setRoutes(routeRes.data);
      setStudents(studentRes.data);
      setLocations(locationRes.data);
    } catch (error) {
      showError(error, "Could not load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  // live fleet updates
  useEffect(() => {
    if (!token) return;
    const socket = connectBusSocket(token);
    socket.on("busUpdate", (update: TrackedBus) => {
      setLocations((prev) =>
        update.coordinates ? [...prev.filter((l) => l.id !== update.id), update] : prev
      );
      setBuses((prev) => prev.map((b) => (b._id === update.id ? { ...b, status: update.status } : b)));
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleLogout = () => {
    clearSession("admin");
    setToken(null);
  };

  /* ---------------- BUSES ---------------- */
  const handleAddBus = async () => {
    if (!newBus.busNumber.trim() || !newBus.route) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingBus) {
        const response = await axios.put(`/api/admin/buses/${editingBus._id}`, {
          busNumber: newBus.busNumber.trim(),
          route: newBus.route
        });
        setBuses(buses.map((b) => (b._id === editingBus._id ? response.data : b)));
      } else {
        const response = await axios.post("/api/admin/buses", { ...newBus, busNumber: newBus.busNumber.trim() });
        setBuses([...buses, response.data]);
      }
      handleCloseDialogs();
      toast({ title: editingBus ? "Bus updated" : "Bus added" });
    } catch (error) {
      showError(error, editingBus ? "Could not update bus" : "Could not add bus");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBusStatus = async (bus: Bus) => {
    const status = bus.status === "active" ? "inactive" : "active";
    try {
      const response = await axios.put(`/api/admin/buses/${bus._id}`, { status });
      setBuses((prev) => prev.map((b) => (b._id === bus._id ? response.data : b)));
    } catch (error) {
      showError(error, "Could not change bus status");
    }
  };

  const handleDeleteBus = (bus: Bus) => {
    setPendingDelete({
      title: `Delete bus ${bus.busNumber}?`,
      description: "Students will no longer see this bus. This cannot be undone.",
      run: async () => {
        await axios.delete(`/api/admin/buses/${bus._id}`);
        setBuses((prev) => prev.filter((b) => b._id !== bus._id));
        setLocations((prev) => prev.filter((l) => l.id !== bus._id));
      }
    });
  };

  const handleEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setNewBus({
      busNumber: bus.busNumber,
      route: bus.route
    });
    setOpenBusDialog(true);
  };

  /* ---------------- ROUTES ---------------- */
  const handleAddRoute = async () => {
    if (!newRoute.routeName.trim()) {
      toast({ title: "Please fill the route name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const body = { routeName: newRoute.routeName.trim() };
      if (editingRoute) {
        await axios.put(`/api/admin/routes/${editingRoute._id}`, body);
        // a rename also updates buses and students, so reload everything
        await fetchAll();
      } else {
        const response = await axios.post("/api/admin/routes", body);
        setRoutes([...routes, response.data]);
      }
      handleCloseDialogs();
      toast({ title: editingRoute ? "Route updated" : "Route added" });
    } catch (error) {
      showError(error, editingRoute ? "Could not update route" : "Could not add route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = (route: Route) => {
    setPendingDelete({
      title: `Delete route ${route.routeName}?`,
      description: "It will also be removed from every student's access list.",
      run: async () => {
        await axios.delete(`/api/admin/routes/${route._id}`);
        await fetchAll();
      }
    });
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setNewRoute({
      routeName: route.routeName
    });
    setOpenRouteDialog(true);
  };

  /* ---------------- STUDENTS ---------------- */
  const handleNewStudent = () => {
    setEditingStudent(null);
    setNewStudent(EMPTY_STUDENT);
    setSelectedStudentRoutes([]);
    setOpenStudentDialog(true);
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

  const handleSaveStudent = async () => {
    setIsSaving(true);
    try {
      if (editingStudent) {
        const response = await axios.put(`/api/admin/students/${editingStudent._id}/routes`, {
          registeredRoutes: selectedStudentRoutes
        });
        setStudents(students.map((s) => (s._id === editingStudent._id ? response.data : s)));
        toast({ title: "Route access saved" });
      } else {
        if (!newStudent.studentId.trim() || !newStudent.name.trim() || !newStudent.password) {
          toast({ title: "Please fill student ID, name and password", variant: "destructive" });
          return;
        }
        const response = await axios.post("/api/admin/students", {
          studentId: newStudent.studentId.trim(),
          name: newStudent.name.trim(),
          password: newStudent.password,
          registeredRoutes: selectedStudentRoutes
        });
        setStudents([...students, response.data]);
        toast({ title: "Student added" });
      }
      handleCloseDialogs();
    } catch (error) {
      showError(error, editingStudent ? "Could not save route access" : "Could not add student");
    } finally {
      setIsSaving(false);
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
    setNewStudent(EMPTY_STUDENT);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await pendingDelete.run();
      toast({ title: "Deleted" });
    } catch (error) {
      showError(error, "Could not delete");
    } finally {
      setPendingDelete(null);
    }
  };

  if (!token) {
    return (
      <LoginForm
        role="admin"
        onLogin={(data) => {
          saveSession("admin", { token: data.token });
          setIsLoading(true);
          setToken(data.token);
        }}
        onBack={() => navigate("/role-selection")}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const search = studentSearch.trim().toLowerCase();
  const visibleStudents = search
    ? students.filter(
        (s) => s.studentId.toLowerCase().includes(search) || s.name.toLowerCase().includes(search)
      )
    : students;
  const busesWithLocation = locations.filter((l) => l.coordinates);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader title="Admin Dashboard" subtitle="Manage buses, routes and student access" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Buses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{buses.length}</div>
              <p className="text-xs text-gray-400 mt-1">{buses.filter((b) => b.status === "active").length} running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{routes.length}</div>
              <p className="text-xs text-gray-400 mt-1">Configured routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{students.length}</div>
              <p className="text-xs text-gray-400 mt-1">Route access managed</p>
            </CardContent>
          </Card>
        </div>

        {/* LIVE FLEET */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Live Fleet
            </CardTitle>
            <CardDescription>
              {busesWithLocation.length > 0
                ? `Last known location of ${busesWithLocation.length} bus(es)`
                : "No bus has shared a location yet"}
            </CardDescription>
          </CardHeader>
          {busesWithLocation.length > 0 && (
            <CardContent className="p-0 h-[360px]">
              <MapView
                center={busesWithLocation[0].coordinates!}
                markers={busesWithLocation.map((l) => ({
                  id: l.id,
                  position: l.coordinates!,
                  title: `${l.number} (${l.status === "active" ? "running" : "not running"})`
                }))}
                zoom={12}
              />
            </CardContent>
          )}
        </Card>

        {/* BUSES */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Buses</CardTitle>
              <CardDescription>Manage your bus fleet</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingBus(null);
                setNewBus({ busNumber: "", route: "" });
                setOpenBusDialog(true);
              }}
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Bus
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Number</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Running</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">No buses yet</TableCell>
                  </TableRow>
                )}
                {buses.map((bus) => (
                  <TableRow key={bus._id}>
                    <TableCell className="font-medium">{bus.busNumber}</TableCell>
                    <TableCell>{bus.route}</TableCell>
                    <TableCell>
                      <Switch
                        checked={bus.status === "active"}
                        onCheckedChange={() => handleToggleBusStatus(bus)}
                        aria-label={`Bus ${bus.busNumber} running`}
                      />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleEditBus(bus)} className="mr-2" aria-label="Edit bus">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBus(bus)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Delete bus"
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

        {/* ROUTES */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Routes</CardTitle>
              <CardDescription>Manage bus routes</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingRoute(null);
                setNewRoute({ routeName: "" });
                setOpenRouteDialog(true);
              }}
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Route
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Buses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">No routes yet</TableCell>
                  </TableRow>
                )}
                {routes.map((route) => (
                  <TableRow key={route._id}>
                    <TableCell className="font-medium">{route.routeName}</TableCell>
                    <TableCell>{buses.filter((b) => b.route === route.routeName).length}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRoute(route)} className="mr-2" aria-label="Edit route">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Delete route"
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

        {/* STUDENTS */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>Add students and assign their routes</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search ID or name"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="sm:w-56"
              />
              <Button onClick={handleNewStudent}>
                <Plus className="mr-2 w-4 h-4" />
                Add Student
              </Button>
            </div>
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
                {visibleStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      {search ? "No matching students" : "No students yet"}
                    </TableCell>
                  </TableRow>
                )}
                {visibleStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {student.registeredRoutes.length > 0 ? (
                          student.registeredRoutes.map((route) => (
                            <Badge key={`${student._id}-${route}`} className="bg-green-100 text-green-800 hover:bg-green-100">
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

      {/* BUS DIALOG */}
      <Dialog open={openBusDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBus ? "Edit Bus" : "Add New Bus"}</DialogTitle>
            <DialogDescription>
              {editingBus ? "Update bus information" : "Add a new bus to the fleet"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bus-number">Bus Number</Label>
              <Input
                id="bus-number"
                placeholder="e.g., R1"
                value={newBus.busNumber}
                onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={newBus.route} onValueChange={(route) => setNewBus({ ...newBus, route })}>
                <SelectTrigger>
                  <SelectValue placeholder={routes.length ? "Select a route" : "Add a route first"} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route._id} value={route.routeName}>
                      {route.routeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddBus} disabled={isSaving} className="w-full">
              {editingBus ? "Update Bus" : "Add Bus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ROUTE DIALOG */}
      <Dialog open={openRouteDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
            <DialogDescription>
              {editingRoute ? "Renaming also updates its buses and students" : "Add a new bus route"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input
                id="route-name"
                placeholder="e.g., Rajroohpur"
                value={newRoute.routeName}
                onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
              />
            </div>
            <Button onClick={handleAddRoute} disabled={isSaving} className="w-full">
              {editingRoute ? "Update Route" : "Add Route"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STUDENT DIALOG (add or edit routes) */}
      <Dialog open={openStudentDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Update Student Routes" : "Add Student"}</DialogTitle>
            <DialogDescription>
              {editingStudent
                ? `Select routes for ${editingStudent.name} (${editingStudent.studentId})`
                : "Create a login for a student and choose their routes"}
            </DialogDescription>
          </DialogHeader>

          {!editingStudent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="e.g., STU004"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name">Name</Label>
                <Input
                  id="student-name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  autoComplete="new-password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-72 overflow-y-auto">
            <Label>Routes</Label>
            {routes.length === 0 && <p className="text-sm text-gray-500">No routes yet</p>}
            {routes.map((route) => (
              <label key={route._id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedStudentRoutes.includes(route.routeName)}
                  onCheckedChange={() => handleToggleStudentRoute(route.routeName)}
                />
                <span>{route.routeName}</span>
              </label>
            ))}
          </div>

          <Button onClick={handleSaveStudent} disabled={isSaving} className="w-full">
            {editingStudent ? "Save Route Access" : "Add Student"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDelete?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
