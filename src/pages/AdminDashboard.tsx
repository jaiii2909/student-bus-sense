import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  MapPin, 
  Bus as BusIcon, 
  Route as RouteIcon, 
  Radio, 
  Search, 
  Loader2,
  RefreshCw,
  ShieldCheck,
  Check,
  Megaphone,
  IdCard,
  Download
} from "lucide-react";
import axios from "axios";
import LoginForm from "@/components/auth/LoginForm";
import AppHeader from "@/components/AppHeader";
import MapView from "@/components/LazyMapView";
import RouteStopsDialog from "@/components/admin/RouteStopsDialog";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import AnnouncementsPanel from "@/components/admin/AnnouncementsPanel";
import ImportStudentsDialog from "@/components/admin/ImportStudentsDialog";
import DriversPanel from "@/components/admin/DriversPanel";
import TripsPanel from "@/components/admin/TripsPanel";
import StudentBulkActions from "@/components/admin/StudentBulkActions";
import { ALL_ROUTES, NO_ROUTE, PASS_FILTER_LABELS, PassFilter, filterStudents, isFiltered } from "@/lib/studentFilters";
import { downloadCsv, endOfDayIso, toDateInput } from "@/lib/csv";
import { Stop } from "@/lib/eta";
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
  stops?: Stop[];
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
  registeredRoutes: string[];
  accessValidUntil?: string | null;
}

const formatPassDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

interface PendingDelete {
  title: string;
  description: string;
  run: () => Promise<void>;
}

const EMPTY_STUDENT = { studentId: "", name: "", password: "" };

const TAB_TRIGGER =
  "rounded-md text-xs font-bold px-3 py-1.5 gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(() => getSession("admin")?.token || null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [locations, setLocations] = useState<TrackedBus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openBusDialog, setOpenBusDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [stopsRoute, setStopsRoute] = useState<Route | null>(null);
  const [resetStudent, setResetStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentRouteFilter, setStudentRouteFilter] = useState(ALL_ROUTES);
  const [studentPassFilter, setStudentPassFilter] = useState<PassFilter>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [busSearch, setBusSearch] = useState("");
  const [activeTab, setActiveTab] = useState("radar");

  const [newBus, setNewBus] = useState({
    busNumber: "",
    route: ""
  });

  const [newRoute, setNewRoute] = useState({
    routeName: ""
  });

  const [newStudent, setNewStudent] = useState(EMPTY_STUDENT);
  const [selectedStudentRoutes, setSelectedStudentRoutes] = useState<string[]>([]);
  // pass end date as "YYYY-MM-DD" ("" = no expiry), for both add and edit
  const [studentValidUntil, setStudentValidUntil] = useState("");

  const showError = (error: unknown, fallback: string) => {
    console.error(fallback, error);
    toast({ title: fallback, description: apiErrorMessage(error, "Please verify inputs and retry."), variant: "destructive" });
  };

  const fetchAll = async () => {
    setIsRefreshing(true);
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
      showError(error, "Could not load transport data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

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
      toast({ title: "Please fill bus number and select route", variant: "destructive" });
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
      toast({ title: editingBus ? "Bus record updated" : "Vehicle registered in fleet" });
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
      showError(error, "Could not change status");
    }
  };

  const handleDeleteBus = (bus: Bus) => {
    setPendingDelete({
      title: `Remove Bus ${bus.busNumber}?`,
      description: "Students will no longer see this vehicle on their corridor list. This action cannot be reversed.",
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
      toast({ title: "Please enter a route corridor name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const body = { routeName: newRoute.routeName.trim() };
      if (editingRoute) {
        await axios.put(`/api/admin/routes/${editingRoute._id}`, body);
        await fetchAll();
      } else {
        const response = await axios.post("/api/admin/routes", body);
        setRoutes([...routes, response.data]);
      }
      handleCloseDialogs();
      toast({ title: editingRoute ? "Route corridor updated" : "Route created" });
    } catch (error) {
      showError(error, editingRoute ? "Could not update route" : "Could not add route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = (route: Route) => {
    setPendingDelete({
      title: `Delete Route ${route.routeName}?`,
      description: "This will remove the route corridor from all associated buses and enrolled student passes.",
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
    setStudentValidUntil("");
    setOpenStudentDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setNewStudent({ ...EMPTY_STUDENT, name: student.name });
    setSelectedStudentRoutes(student.registeredRoutes || []);
    setStudentValidUntil(toDateInput(student.accessValidUntil));
    setOpenStudentDialog(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setPendingDelete({
      title: `Delete ${student.name} (${student.studentId})?`,
      description: "The student is logged out and can no longer sign in. This cannot be undone.",
      run: async () => {
        await axios.delete(`/api/admin/students/${student._id}`);
        setStudents((prev) => prev.filter((s) => s._id !== student._id));
      }
    });
  };

  // backup / sharing copy of the student list (passwords are never included)
  const handleExportStudents = () => {
    downloadCsv(`students-${toDateInput(new Date().toISOString())}.csv`, [
      ["studentId", "name", "routes", "passValidUntil"],
      ...students.map((s) => [s.studentId, s.name, s.registeredRoutes.join(";"), toDateInput(s.accessValidUntil)])
    ]);
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
        if (!newStudent.name.trim()) {
          toast({ title: "Name cannot be empty", variant: "destructive" });
          return;
        }
        const response = await axios.put(`/api/admin/students/${editingStudent._id}/routes`, {
          name: newStudent.name.trim(),
          registeredRoutes: selectedStudentRoutes,
          accessValidUntil: endOfDayIso(studentValidUntil)
        });
        setStudents(students.map((s) => (s._id === editingStudent._id ? response.data : s)));
        toast({ title: "Student pass routes updated" });
      } else {
        if (!newStudent.studentId.trim() || !newStudent.name.trim() || !newStudent.password) {
          toast({ title: "Please fill student enrollment, name and password", variant: "destructive" });
          return;
        }
        const response = await axios.post("/api/admin/students", {
          studentId: newStudent.studentId.trim(),
          name: newStudent.name.trim(),
          password: newStudent.password,
          registeredRoutes: selectedStudentRoutes,
          accessValidUntil: endOfDayIso(studentValidUntil)
        });
        setStudents([...students, response.data]);
        toast({ title: "Student enrolled in transport registry" });
      }
      handleCloseDialogs();
    } catch (error) {
      showError(error, editingStudent ? "Could not update pass" : "Could not enroll student");
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
    setStudentValidUntil("");
    setNewBus({ busNumber: "", route: "" });
    setNewRoute({ routeName: "" });
    setNewStudent(EMPTY_STUDENT);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await pendingDelete.run();
      toast({ title: "Record removed" });
    } catch (error) {
      showError(error, "Could not delete record");
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Connecting to Transport Control Registry...</p>
        </div>
      </div>
    );
  }

  const studentFilter = { search: studentSearch, route: studentRouteFilter, pass: studentPassFilter };
  const studentsFiltered = isFiltered(studentFilter);
  const visibleStudents = filterStudents(students, studentFilter, Date.now());
  // only ids that still exist count as selected
  const selectedStudents = students.filter((s) => selectedStudentIds.has(s._id));
  const visibleSelectedCount = visibleStudents.filter((s) => selectedStudentIds.has(s._id)).length;
  const allVisibleSelected = visibleStudents.length > 0 && visibleSelectedCount === visibleStudents.length;

  const toggleStudentSelected = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // header checkbox: select every student currently shown, or unselect them
  const toggleAllVisibleStudents = () => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      visibleStudents.forEach((s) => (allVisibleSelected ? next.delete(s._id) : next.add(s._id)));
      return next;
    });
  };

  const clearStudentFilters = () => {
    setStudentSearch("");
    setStudentRouteFilter(ALL_ROUTES);
    setStudentPassFilter("all");
  };

  const bSearch = busSearch.trim().toLowerCase();
  const visibleBuses = bSearch
    ? buses.filter(
        (b) => b.busNumber.toLowerCase().includes(bSearch) || b.route.toLowerCase().includes(bSearch)
      )
    : buses;

  const busesWithLocation = locations.filter((l) => l.coordinates);
  const activeBusesCount = buses.filter((b) => b.status === "active").length;

  // Row pieces shared by the desktop tables and the stacked phone cards
  const renderBusStatus = (bus: Bus) => (
    <div className="flex items-center gap-2">
      <Switch
        checked={bus.status === "active"}
        onCheckedChange={() => handleToggleBusStatus(bus)}
        aria-label={`Toggle status for Bus ${bus.busNumber}`}
      />
      <span className={`text-xs font-semibold ${bus.status === "active" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {bus.status === "active" ? "On Route" : "At Depot"}
      </span>
    </div>
  );

  const renderBusActions = (bus: Bus) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEditBus(bus)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Edit vehicle"
        aria-label={`Edit Bus ${bus.busNumber}`}
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteBus(bus)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        title="Delete vehicle"
        aria-label={`Delete Bus ${bus.busNumber}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </>
  );

  const renderRouteStops = (route: Route) => (
    <Button variant="outline" size="sm" onClick={() => setStopsRoute(route)} className="h-7 text-xs gap-1">
      <MapPin className="w-3.5 h-3.5" />
      {route.stops?.length ? `${route.stops.length} stop(s)` : "Add stops"}
    </Button>
  );

  const renderRouteActions = (route: Route) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEditRoute(route)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Edit route"
        aria-label={`Edit ${route.routeName}`}
      >
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteRoute(route)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        title="Delete route"
        aria-label={`Delete ${route.routeName}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </>
  );

  const renderPassValidity = (student: Student) =>
    student.accessValidUntil &&
    (new Date(student.accessValidUntil).getTime() < Date.now() ? (
      <span className="block text-2xs font-semibold text-destructive">Pass expired</span>
    ) : (
      <span className="block text-2xs text-muted-foreground">Valid until {formatPassDate(student.accessValidUntil)}</span>
    ));

  const renderStudentRoutes = (student: Student) => (
    <div className="flex flex-wrap gap-1">
      {student.registeredRoutes.length > 0 ? (
        student.registeredRoutes.map((r) => (
          <Badge
            key={`${student._id}-${r}`}
            variant="outline"
            className="text-2xs font-semibold px-1.5 py-0 rounded-md border-border/80 bg-muted/50"
          >
            {r}
          </Badge>
        ))
      ) : (
        <span className="text-2xs text-muted-foreground italic">No route pass assigned</span>
      )}
    </div>
  );

  const renderStudentActions = (student: Student) => (
    <>
      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)} className="h-7 text-xs border-border">
        Manage Pass
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setResetStudent(student)} className="h-7 text-xs">
        Reset Password
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteStudent(student)}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        title="Delete student"
        aria-label={`Delete ${student.name}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </>
  );

  const emptyListText = (text: string) => <li className="py-8 text-center text-xs text-muted-foreground">{text}</li>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <AppHeader 
        title="Fleet Supervisor Portal" 
        subtitle="United Group of Institutions • Transport Control Registry" 
        roleBadge="Admin" 
        onLogout={handleLogout} 
      >
        <ChangePasswordDialog
          endpoint="/api/admin/password"
          minLength={8}
          onChanged={(data) => {
            // other admin sessions end; keep this one with the new token
            if (data.token) {
              saveSession("admin", { token: data.token });
              setToken(data.token);
            }
          }}
        />
      </AppHeader>

      <main className="container mx-auto px-4 py-6 max-w-6xl flex-1 space-y-6">
        
        {/* Short Summary Strip with Strong Hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <StatCard
            label="Active Vehicles"
            value={activeBusesCount}
            unit={`/ ${buses.length} total buses`}
            hint={activeBusesCount > 0 ? "Operating on campus corridors" : "All vehicles at depot"}
            hintClassName="font-semibold text-emerald-600 dark:text-emerald-400"
          />
          <StatCard label="Campus Corridors" value={routes.length} hint="Configured transit lines" />
          <StatCard label="Enrolled Commuters" value={students.length} hint="Verified student passes" />
          <StatCard
            label="Live Telemetry Fixes"
            value={busesWithLocation.length}
            valueClassName="text-emerald-600 dark:text-emerald-400"
            hint="Transmitting in-cab signals"
          />
        </div>

        {/* Tabbed Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3 gap-2">
            {/* tabs scroll sideways on narrow screens; the fade on the right hints there is more */}
            <div className="relative min-w-0 flex-1 lg:flex-none">
              <TabsList className="bg-muted p-1 rounded-lg h-11 border border-border/80 w-full lg:w-auto overflow-x-auto justify-start [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsTrigger value="radar" className={TAB_TRIGGER}>
                  <Radio className="w-3.5 h-3.5 text-primary" />
                  <span>Fleet Radar</span>
                </TabsTrigger>
                <TabsTrigger value="buses" className={TAB_TRIGGER}>
                  <BusIcon className="w-3.5 h-3.5 text-accent" />
                  <span>Buses ({buses.length})</span>
                </TabsTrigger>
                <TabsTrigger value="routes" className={TAB_TRIGGER}>
                  <RouteIcon className="w-3.5 h-3.5" />
                  <span>Routes ({routes.length})</span>
                </TabsTrigger>
                <TabsTrigger value="students" className={TAB_TRIGGER}>
                  <Users className="w-3.5 h-3.5" />
                  <span>Student Directory ({students.length})</span>
                </TabsTrigger>
                <TabsTrigger value="announcements" className={TAB_TRIGGER}>
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Announcements</span>
                </TabsTrigger>
                <TabsTrigger value="drivers" className={TAB_TRIGGER}>
                  <IdCard className="w-3.5 h-3.5" />
                  <span>Drivers & Trips</span>
                </TabsTrigger>
              </TabsList>
              <div className="pointer-events-none absolute inset-y-px right-px w-10 rounded-r-lg bg-gradient-to-l from-muted to-transparent lg:hidden" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAll}
              disabled={isRefreshing}
              className="text-xs h-9 w-9 sm:w-auto px-0 sm:px-3 shrink-0 border-border gap-1.5 font-semibold hover:bg-muted"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh Telemetry</span>
            </Button>
          </div>

          {/* TAB 1: FLEET RADAR MAP */}
          <TabsContent value="radar" className="m-0 focus-visible:ring-0">
            <SectionCard
              icon={Radio}
              title="Prayagraj Campus Fleet Radar"
              description={
                busesWithLocation.length > 0
                  ? `Displaying ${busesWithLocation.length} active vehicle GPS fixes across university routes`
                  : "No drivers currently broadcasting GPS signals"
              }
              actions={
                busesWithLocation.length > 0 && (
                  <Badge variant="outline" className="text-2xs font-mono text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                    {busesWithLocation.length} Live
                  </Badge>
                )
              }
            >
              <div className="h-[460px] sm:h-[560px] relative">
                {busesWithLocation.length > 0 ? (
                  <MapView
                    center={busesWithLocation[0].coordinates!}
                    markers={busesWithLocation.map((l) => ({
                      id: l.id,
                      position: l.coordinates!,
                      title: `Bus ${l.number} • ${l.route}`,
                      kind: "bus" as const,
                      busNumber: l.number,
                      isLive: l.status === "active",
                    }))}
                    zoom={13}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted/40 p-6">
                    <EmptyState
                      icon={MapPin}
                      title="Fleet in Depot"
                      text="Vehicles will populate this radar as soon as drivers begin morning or evening shifts from the Driver Console."
                      className="border-0 bg-transparent shadow-none"
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          </TabsContent>

          {/* TAB 2: BUS VEHICLES */}
          <TabsContent value="buses" className="m-0 focus-visible:ring-0">
            <SectionCard
              title="Registered Bus Vehicles"
              description="Manage bus numbers, assigned routes, and operational status"
              actions={
                <>
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search bus or route..."
                      value={busSearch}
                      onChange={(e) => setBusSearch(e.target.value)}
                      className="pl-8 h-8 text-xs w-full sm:w-44 border-border"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingBus(null);
                      setNewBus({ busNumber: "", route: "" });
                      setOpenBusDialog(true);
                    }}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Register Bus
                  </Button>
                </>
              }
            >
              {/* phones: stacked cards */}
              <ul className="divide-y divide-border/80 md:hidden">
                {visibleBuses.length === 0
                  ? emptyListText(bSearch ? "No matching buses found" : "No vehicles registered in fleet")
                  : visibleBuses.map((bus) => (
                      <li key={bus._id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0 space-y-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground">Bus {bus.busNumber}</p>
                            <p className="truncate text-xs text-muted-foreground">{bus.route}</p>
                          </div>
                          {renderBusStatus(bus)}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">{renderBusActions(bus)}</div>
                      </li>
                    ))}
              </ul>

              {/* md+: table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Bus Identifier</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Assigned Corridor</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Operational Switch</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                        {bSearch ? "No matching buses found" : "No vehicles registered in fleet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleBuses.map((bus) => (
                      <TableRow key={bus._id} className="border-border hover:bg-muted/40">
                        <TableCell className="font-bold text-xs text-foreground">Bus {bus.busNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{bus.route}</TableCell>
                        <TableCell>{renderBusStatus(bus)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">{renderBusActions(bus)}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>

          {/* TAB 3: TRANSIT CORRIDORS (ROUTES) */}
          <TabsContent value="routes" className="m-0 focus-visible:ring-0">
            <SectionCard
              title="Campus Transit Corridors"
              description="Manage designated university transit lines"
              actions={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRoute(null);
                    setNewRoute({ routeName: "" });
                    setOpenRouteDialog(true);
                  }}
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Route
                </Button>
              }
            >
              {/* phones: stacked cards */}
              <ul className="divide-y divide-border/80 md:hidden">
                {routes.length === 0
                  ? emptyListText("No transit routes configured yet")
                  : routes.map((route) => (
                      <li key={route._id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0 space-y-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{route.routeName}</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {buses.filter((b) => b.route === route.routeName).length} vehicle(s)
                            </p>
                          </div>
                          {renderRouteStops(route)}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">{renderRouteActions(route)}</div>
                      </li>
                    ))}
              </ul>

              {/* md+: table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Route Corridor Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Assigned Fleet</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Stops</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                        No transit routes configured yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => {
                      const assignedBuses = buses.filter((b) => b.route === route.routeName);
                      return (
                        <TableRow key={route._id} className="border-border hover:bg-muted/40">
                          <TableCell className="font-bold text-xs text-foreground">{route.routeName}</TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">
                              {assignedBuses.length} vehicle(s)
                            </span>
                          </TableCell>
                          <TableCell>{renderRouteStops(route)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">{renderRouteActions(route)}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>

          {/* TAB 4: STUDENT PASS DIRECTORY */}
          <TabsContent value="students" className="m-0 focus-visible:ring-0">
            <SectionCard
              title="Student Pass Directory"
              description="Enroll commuters and assign authorized corridor passes"
              actions={
                <>
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search ID or name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-8 h-8 text-xs w-full sm:w-44 border-border"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportStudents}
                    disabled={students.length === 0}
                    className="h-8 text-xs font-semibold gap-1"
                    title="Download the student list as CSV (no passwords)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </Button>
                  <ImportStudentsDialog onImported={fetchAll} />
                  <Button
                    size="sm"
                    onClick={handleNewStudent}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Enroll Student
                  </Button>
                </>
              }
            >
              {/* Filters */}
              <div className="px-4 py-2.5 border-b border-border/80 flex flex-wrap items-center gap-2">
                <Select value={studentRouteFilter} onValueChange={setStudentRouteFilter}>
                  <SelectTrigger className="h-8 w-44 text-xs" aria-label="Filter by route">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ROUTES} className="text-xs">All routes</SelectItem>
                    <SelectItem value={NO_ROUTE} className="text-xs">No route assigned</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r._id} value={r.routeName} className="text-xs">{r.routeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={studentPassFilter} onValueChange={(v) => setStudentPassFilter(v as PassFilter)}>
                  <SelectTrigger className="h-8 w-44 text-xs" aria-label="Filter by pass status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PASS_FILTER_LABELS) as PassFilter[]).map((key) => (
                      <SelectItem key={key} value={key} className="text-xs">{PASS_FILTER_LABELS[key]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {studentsFiltered && (
                  <Button size="sm" variant="ghost" onClick={clearStudentFilters} className="h-8 text-xs">
                    Clear filters
                  </Button>
                )}
                <span className="text-2xs text-muted-foreground ml-auto">
                  Showing {visibleStudents.length} of {students.length}
                </span>
              </div>

              <StudentBulkActions
                selected={selectedStudents}
                routeNames={routes.map((r) => r.routeName)}
                onDone={fetchAll}
                onClear={() => setSelectedStudentIds(new Set())}
              />

              {/* phones: stacked cards, with a select-all row since there is no table header */}
              <div className="md:hidden">
                {visibleStudents.length > 0 && (
                  <label className="flex items-center gap-3 border-b border-border/80 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                    <Checkbox
                      checked={allVisibleSelected ? true : visibleSelectedCount > 0 ? "indeterminate" : false}
                      onCheckedChange={toggleAllVisibleStudents}
                    />
                    Select all shown
                  </label>
                )}
                <ul className="divide-y divide-border/80">
                  {visibleStudents.length === 0
                    ? emptyListText(studentsFiltered ? "No students match these filters" : "No students enrolled in transport registry")
                    : visibleStudents.map((student) => (
                        <li
                          key={student._id}
                          className={`flex gap-3 p-4 ${selectedStudentIds.has(student._id) ? "bg-muted/50" : ""}`}
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selectedStudentIds.has(student._id)}
                            onCheckedChange={() => toggleStudentSelected(student._id)}
                            aria-label={`Select ${student.name}`}
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">{student.name}</p>
                              <p className="truncate font-mono text-xs text-muted-foreground">{student.studentId}</p>
                              {renderPassValidity(student)}
                            </div>
                            {renderStudentRoutes(student)}
                            <div className="flex flex-wrap items-center gap-1">{renderStudentActions(student)}</div>
                          </div>
                        </li>
                      ))}
                </ul>
              </div>

              {/* md+: table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected ? true : visibleSelectedCount > 0 ? "indeterminate" : false}
                        onCheckedChange={toggleAllVisibleStudents}
                        aria-label="Select all shown students"
                        disabled={visibleStudents.length === 0}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Enrollment ID</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Student Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider">Authorized Route Passes</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Pass Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        {studentsFiltered ? "No students match these filters" : "No students enrolled in transport registry"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleStudents.map((student) => (
                      <TableRow
                        key={student._id}
                        data-state={selectedStudentIds.has(student._id) ? "selected" : undefined}
                        className="border-border hover:bg-muted/40"
                      >
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selectedStudentIds.has(student._id)}
                            onCheckedChange={() => toggleStudentSelected(student._id)}
                            aria-label={`Select ${student.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {student.studentId}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-foreground">
                          {student.name}
                          {renderPassValidity(student)}
                        </TableCell>
                        <TableCell>{renderStudentRoutes(student)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">{renderStudentActions(student)}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>

          {/* TAB 5: ANNOUNCEMENTS */}
          <TabsContent value="announcements" className="m-0 focus-visible:ring-0">
            <AnnouncementsPanel routeNames={routes.map((r) => r.routeName)} />
          </TabsContent>

          {/* TAB 6: DRIVERS & TRIPS */}
          <TabsContent value="drivers" className="m-0 focus-visible:ring-0 space-y-4">
            <DriversPanel />
            <TripsPanel />
          </TabsContent>

        </Tabs>
      </main>

      {/* BUS MODAL */}
      <Dialog open={openBusDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editingBus ? "Edit Vehicle" : "Register Campus Bus"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingBus ? "Update bus identifier and corridor assignment" : "Enter vehicle details for university transit roster"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label htmlFor="bus-number">Bus Identifier / License Code</Label>
              <Input
                id="bus-number"
                placeholder="e.g. 04 (UP-70-BT-4412)"
                value={newBus.busNumber}
                onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned Corridor Route</Label>
              <Select value={newBus.route} onValueChange={(route) => setNewBus({ ...newBus, route })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={routes.length ? "Select corridor" : "Create a route first"} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route._id} value={route.routeName} className="text-xs">
                      {route.routeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddBus} disabled={isSaving} className="w-full h-9 text-xs font-semibold mt-2">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {editingBus ? "Save Vehicle Record" : "Register Bus in Fleet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ROUTE MODAL */}
      <Dialog open={openRouteDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editingRoute ? "Edit Corridor" : "New Transit Corridor"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingRoute 
                ? "Renaming will automatically update all associated buses and active student passes." 
                : "Add a university bus route corridor to the campus network."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label htmlFor="route-name">Corridor Route Name</Label>
              <Input
                id="route-name"
                placeholder="e.g. Route 01 - Civil Lines Express"
                value={newRoute.routeName}
                onChange={(e) => setNewRoute({ ...newRoute, routeName: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <Button onClick={handleAddRoute} disabled={isSaving} className="w-full h-9 text-xs font-semibold mt-2">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {editingRoute ? "Save Corridor Changes" : "Create Transit Corridor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STUDENT PASS MODAL */}
      <Dialog open={openStudentDialog} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingStudent ? `Corridor Pass: ${editingStudent.name}` : "Enroll Commuter"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingStudent 
                ? "Select verified routes authorized on this student's semester pass." 
                : "Enroll student in the university transport database."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            {!editingStudent && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="student-id">Student Enrollment ID</Label>
                  <Input
                    id="student-id"
                    placeholder="e.g. UGI-2023-CS-104"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="student-name">Full Legal Name</Label>
              <Input
                id="student-name"
                placeholder="e.g. Rajesh Kumar"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {!editingStudent && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="student-pwd">Passkey / Password</Label>
                  <Input
                    id="student-pwd"
                    type="password"
                    placeholder="Set student login password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Authorized Corridor Routes</Label>
              <div className="border border-border/80 rounded-lg p-3 max-h-44 overflow-y-auto space-y-2 bg-muted/50">
                {routes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No corridors configured</p>
                ) : (
                  routes.map((route) => (
                    <div key={route._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`route-${route._id}`}
                        checked={selectedStudentRoutes.includes(route.routeName)}
                        onCheckedChange={() => handleToggleStudentRoute(route.routeName)}
                      />
                      <label htmlFor={`route-${route._id}`} className="text-xs font-medium cursor-pointer">
                        {route.routeName}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="student-valid-until">Pass valid until (optional)</Label>
              <Input
                id="student-valid-until"
                type="date"
                value={studentValidUntil}
                onChange={(e) => setStudentValidUntil(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-2xs text-muted-foreground">After this date the student can't log in. Leave empty for no expiry.</p>
            </div>

            <Button onClick={handleSaveStudent} disabled={isSaving} className="w-full h-9 text-xs font-semibold mt-2">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {editingStudent ? "Save Corridor Pass" : "Complete Enrollment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESET STUDENT PASSWORD */}
      <ResetPasswordDialog
        person={resetStudent ? { name: resetStudent.name, detail: resetStudent.studentId } : null}
        endpoint={resetStudent ? `/api/admin/students/${resetStudent._id}/password` : null}
        onClose={() => setResetStudent(null)}
      />

      {/* ROUTE STOPS EDITOR */}
      <RouteStopsDialog
        route={stopsRoute}
        onClose={() => setStopsRoute(null)}
        onSaved={(saved) => setRoutes((prev) => prev.map((r) => (r._id === saved._id ? { ...r, stops: saved.stops } : r)))}
      />

      {/* CONFIRM DELETE DIALOG */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">{pendingDelete?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {pendingDelete?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="text-xs bg-destructive hover:bg-destructive/90 text-white font-semibold">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
