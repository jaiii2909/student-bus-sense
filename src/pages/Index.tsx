import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { 
  Bus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Navigation, 
  Check, 
  Phone, 
  Mail, 
  ExternalLink,
  Radio,
  Gauge,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Users,
  Compass,
  Zap,
  Activity
} from "lucide-react";

interface SampleCorridor {
  id: string;
  name: string;
  busNumber: string;
  plate: string;
  driver: string;
  departure: string;
  currentStop: string;
  nextStop: string;
  eta: string;
  speed: string;
  status: "live" | "ontime";
  stops: { name: string; time: string; status: "passed" | "current" | "upcoming" }[];
}

const sampleCorridors: SampleCorridor[] = [
  {
    id: "route-01",
    name: "Route 01 • Civil Lines Express",
    busNumber: "04",
    plate: "UP-70-BT-4412",
    driver: "Rajesh K. (In-Cab)",
    departure: "07:45 AM",
    currentStop: "High Court Crossing",
    nextStop: "Medical College Gate",
    eta: "4 mins",
    speed: "38 km/h",
    status: "live",
    stops: [
      { name: "Civil Lines Central Depot", time: "07:45 AM", status: "passed" },
      { name: "High Court Crossing", time: "08:02 AM", status: "current" },
      { name: "Medical College Gate", time: "08:14 AM", status: "upcoming" },
      { name: "Campus Gate 1 (UGI Naini)", time: "08:35 AM", status: "upcoming" },
    ],
  },
  {
    id: "route-02",
    name: "Route 02 • Phaphamau Bridge Line",
    busNumber: "08",
    plate: "UP-70-BT-1890",
    driver: "Surendra V. (In-Cab)",
    departure: "07:30 AM",
    currentStop: "Teliyarganj Chauraha",
    nextStop: "Balson Crossing",
    eta: "7 mins",
    speed: "42 km/h",
    status: "live",
    stops: [
      { name: "Phaphamau Bus Terminal", time: "07:30 AM", status: "passed" },
      { name: "Teliyarganj Chauraha", time: "07:55 AM", status: "current" },
      { name: "Balson Crossing", time: "08:10 AM", status: "upcoming" },
      { name: "Campus Gate 1 (UGI Naini)", time: "08:40 AM", status: "upcoming" },
    ],
  },
  {
    id: "route-03",
    name: "Route 03 • Kareli & GTB Nagar",
    busNumber: "12",
    plate: "UP-70-AT-1290",
    driver: "Amitabh S. (In-Cab)",
    departure: "07:40 AM",
    currentStop: "GTB Nagar Market",
    nextStop: "Kareli Police Chowki",
    eta: "3 mins",
    speed: "32 km/h",
    status: "live",
    stops: [
      { name: "Kareli Main Depot", time: "07:40 AM", status: "passed" },
      { name: "GTB Nagar Market", time: "08:00 AM", status: "current" },
      { name: "Kareli Police Chowki", time: "08:12 AM", status: "upcoming" },
      { name: "Campus Gate 1 (UGI Naini)", time: "08:35 AM", status: "upcoming" },
    ],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [activeCorridor, setActiveCorridor] = useState<SampleCorridor>(sampleCorridors[0]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Institutional Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold shrink-0 shadow-xs">
              <Bus className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-card animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-foreground tracking-tight">UGI Campus Transit</span>
                <span className="text-2xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                  Live Dispatch
                </span>
              </div>
              <p className="text-2xs text-muted-foreground hidden sm:block">United Group of Institutions, Prayagraj</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("routes-schedule")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden md:inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Route Network
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/role-selection")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Staff & Driver
            </Button>
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate("/student-login")}
              className="text-xs font-bold px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              Student Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        
        {/* SECTION 1: Split Hero Section */}
        <section className="py-14 sm:py-20 border-b border-border/80 relative overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Direct Headline & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  <span>Semester 2026 Live GPS Telemetry Active</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                  Track your college bus in real-time. Arrive at your stop with confidence.
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Real-time satellite coordinates streamed directly from campus bus drivers to your phone. Monitor live vehicle speeds, upcoming stops, and accurate arrival estimates.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate("/student-login")}
                    className="h-12 px-6 font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg"
                  >
                    Track My Bus
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/role-selection")}
                    className="h-12 px-6 font-semibold text-sm border-border/80 bg-card hover:bg-muted transition-colors"
                  >
                    Driver & Fleet Admin
                  </Button>
                </div>

                {/* Practical Trust Points */}
                <div className="pt-4 border-t border-border/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-foreground">5-Second GPS Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-foreground">Verified Pass Clearance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-foreground">Low Mobile Data Usage</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Live Corridor Telemetry Mockup */}
              <div className="lg:col-span-5">
                <div className="border border-border/80 rounded-xl bg-card shadow-xl overflow-hidden transition-all">
                  
                  {/* Top Bar of Bus Card */}
                  <div className="p-4 border-b border-border/80 bg-muted/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-xs">
                        {activeCorridor.busNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">Bus {activeCorridor.busNumber} ({activeCorridor.plate})</span>
                        </div>
                        <p className="text-2xs text-muted-foreground font-mono">{activeCorridor.name}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-2xs font-bold gap-1.5 px-2.5 py-1 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span>Live Telemetry</span>
                    </Badge>
                  </div>

                  {/* Corridor Selector Tabs */}
                  <div className="p-2 border-b border-border/70">
                    <SegmentedControl
                      aria-label="Sample bus"
                      size="sm"
                      value={activeCorridor.id}
                      onChange={(id) => setActiveCorridor(sampleCorridors.find((c) => c.id === id) || sampleCorridors[0])}
                      options={sampleCorridors.map((c) => ({ value: c.id, label: `Bus ${c.busNumber}` }))}
                    />
                  </div>

                  {/* Timetable / Stops Sequence */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-3">
                      {activeCorridor.stops.map((stop, i) => (
                        <div key={stop.name} className="flex items-start gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            {stop.status === "current" ? (
                              <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center animate-bus-pulse mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              </div>
                            ) : stop.status === "passed" ? (
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5 text-white">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/30 mt-0.5" />
                            )}
                            {i < activeCorridor.stops.length - 1 && (
                              <div className="w-0.5 h-7 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 flex justify-between items-baseline">
                            <div>
                              <p className={`font-semibold ${stop.status === "current" ? "text-primary font-bold" : "text-foreground"}`}>
                                {stop.name}
                              </p>
                              <p className="text-2xs text-muted-foreground">
                                {stop.status === "current" ? `Next stop • Approx. ${activeCorridor.eta}` : stop.status === "passed" ? "Departed on schedule" : "Upcoming stop"}
                              </p>
                            </div>
                            <span className="font-mono text-muted-foreground tabular-nums text-2xs">
                              {stop.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Operational Telemetry Strip */}
                    <div className="border-t border-border/80 pt-3 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/50 border border-border/80">
                        <span className="text-2xs uppercase font-bold text-muted-foreground block">In-Cab Speed</span>
                        <span className="font-mono text-foreground font-bold tabular-nums text-xs">{activeCorridor.speed}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/50 border border-border/80">
                        <span className="text-2xs uppercase font-bold text-muted-foreground block">GPS Telemetry</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums text-xs">Synced 4s ago</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate("/student-login")} 
                      className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    >
                      Open Live Radar Dashboard
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: Campus Fleet Statistics Dark Band */}
        <section className="bg-slate-900 text-slate-100 py-14 border-y border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1.5 p-3">
                <p className="text-3xl sm:text-5xl font-extrabold text-sky-400 tabular-nums">18</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Transit Routes</p>
              </div>
              <div className="space-y-1.5 p-3">
                <p className="text-3xl sm:text-5xl font-extrabold text-white tabular-nums">42</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GPS-Monitored Buses</p>
              </div>
              <div className="space-y-1.5 p-3">
                <p className="text-3xl sm:text-5xl font-extrabold text-white tabular-nums">3,400+</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Commuters</p>
              </div>
              <div className="space-y-1.5 p-3">
                <p className="text-3xl sm:text-5xl font-extrabold text-emerald-400 tabular-nums">99.2%</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On-Time Morning Arrival</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Alternating Value Proposition Rows */}
        <section id="routes-schedule" className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-7xl space-y-20">
            
            {/* Row 1: Student Live Tracking */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">01. For Students</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Know exactly when to step out to your stop
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Morning traffic across Phaphamau bridge or Civil Lines varies daily. Instead of standing outside in extreme summer heat or winter fog, watch your bus move continuously down your designated transit corridor.
                </p>
                <ul className="text-xs text-foreground space-y-3 pt-2">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Satellite location updates transmitted every 5 seconds</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Direct status flags: "Live Tracking", "Delayed Signal", or "At Depot"</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Proximity alert triggers when vehicle is ~5 minutes from your stop</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-6">
                <div className="border border-border/80 rounded-xl p-6 bg-card shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/80">
                    <span className="text-xs font-bold text-foreground">Sample Corridor: Route 03 (Kareli Line)</span>
                    <span className="text-2xs font-mono text-muted-foreground">Departed: 07:30 AM</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/80 flex justify-between items-center">
                      <span className="font-bold text-foreground">Bus 12 (UP-70-AT-1290)</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">At GTB Nagar (4 stops away)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border/80 flex justify-between items-center">
                      <span className="font-bold text-foreground">Bus 15 (UP-70-BT-1504)</span>
                      <span className="text-muted-foreground font-mono">Scheduled 08:00 AM (Depot)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Route Security & Pass Verification */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 order-2 md:order-1">
                <div className="border border-border/80 rounded-xl p-6 bg-card shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-foreground">Verified Transport Pass</span>
                    </div>
                    <span className="text-2xs font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">Active: Sem 6</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-foreground">Student ID: UGI-2023-CS-104</p>
                    <p className="text-muted-foreground">Authorized Route: <strong className="text-foreground">Route 01 (Civil Lines)</strong></p>
                    <p className="text-2xs text-muted-foreground">Fee clearance verified via Academic Accounts Desk.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted text-2xs text-muted-foreground leading-relaxed">
                    Restricts bus tracking exclusively to registered route pass-holders to prevent route overcrowding and ensure student safety.
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 order-1 md:order-2 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">02. Route Governance</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Authorized passes prevent route overcrowding
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Campus transport safety requires accountability. Only students with verified bus passes for a specific route can view and board that corridor's buses.
                </p>
                <ul className="text-xs text-foreground space-y-3 pt-2">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Single university enrollment ID for bus pass verification</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Admin portal for adding and reallocating student corridor seats</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Eliminates unauthorized boarding and guarantees seat availability</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Row 3: Driver In-Cab Console */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">03. In-Cab Safety</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  Designed for drivers with zero in-traffic distractions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bus drivers need full focus on the road. The driver console is designed with large touch controls, automatic screen wake-lock, and one-tap trip starting.
                </p>
                <ul className="text-xs text-foreground space-y-3 pt-2">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Large 56px touch controls operable from a phone dashboard mount</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Automatic screen wake-lock keeps the broadcast screen active</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Throttled location sync preserves driver mobile data and battery life</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-6">
                <div className="border border-border/80 rounded-xl p-6 bg-card shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/80">
                    <span className="text-xs font-bold text-foreground">Driver In-Cab HUD</span>
                    <span className="text-2xs font-mono text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">Screen Wake-Lock: Active</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                    <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">BROADCASTING ROUTE 01</p>
                    <p className="text-2xs text-emerald-600 dark:text-emerald-400">Bus 04 • Next Stop: High Court</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 border border-border/80 rounded-xl bg-muted/50">
                      <span className="text-2xs text-muted-foreground block">GPS Fix</span>
                      <span className="font-bold text-foreground">Strong (±3m)</span>
                    </div>
                    <div className="p-2.5 border border-border/80 rounded-xl bg-muted/50">
                      <span className="text-2xs text-muted-foreground block">Transmission Rate</span>
                      <span className="font-bold text-foreground font-mono">1 ping / 5s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: Role Gateways (Clean 3-Block Grid) */}
        <section className="py-16 bg-muted/40 border-t border-border/80">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-md mx-auto mb-10 space-y-1.5">
              <h2 className="text-2xl font-bold text-foreground">Access Portals</h2>
              <p className="text-xs text-muted-foreground">Select your portal to continue with campus transport.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div 
                onClick={() => navigate("/student-login")}
                className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer text-left space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Enter <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Student Portal</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Sign in with your enrollment number to track assigned corridor buses and view real-time arrival estimates.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => navigate("/driver-location")}
                className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer text-left space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Enter <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Driver Console</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    One-tap live GPS broadcasting for scheduled morning and evening transit trips with zero driving distraction.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => navigate("/admin-dashboard")}
                className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer text-left space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Enter <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Fleet Supervisor</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Manage routes, assign vehicles, monitor live fleet radar, and verify student semester pass clearances.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border/80 bg-card py-12 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-2">
              <p className="font-bold text-foreground text-sm">Transport Control Office</p>
              <p className="leading-relaxed">
                United Group of Institutions, Campus Gate 1<br />
                UPSIDC Industrial Area, Naini, Prayagraj, UP 211010
              </p>
              <p className="text-2xs text-muted-foreground">Office Hours: Monday – Saturday, 07:00 AM – 06:00 PM</p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-foreground text-sm">Emergency & Lost Transit Items</p>
              <div className="space-y-1">
                <a href="tel:+915322687140" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="w-3.5 h-3.5" /> +91 (532) 268-7140 (Transport Desk)
                </a>
                <a href="mailto:transport@united.ac.in" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5" /> transport@united.ac.in
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-foreground text-sm">Official University Links</p>
              <div className="space-y-1">
                <a href="https://united.ac.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  UGI Official Portal <ExternalLink className="w-3 h-3" />
                </a>
                <a href="/role-selection" className="block hover:text-primary transition-colors">
                  Staff & Driver Access
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground">
            <p>© {new Date().getFullYear()} United Group of Institutions. Official Campus Transit Management Platform.</p>
            <p className="text-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              GPS Dispatch & WebSocket Servers Operational
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
