import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  Calendar,
  AlertCircle
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Institutional Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground font-bold shrink-0">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-foreground tracking-tight">UGI Campus Transit</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Official Portal
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">United Group of Institutions, Prayagraj</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("routes-schedule")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden md:inline-flex text-xs font-semibold text-stone-600 dark:text-stone-300"
            >
              Route Network
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/role-selection")}
              className="text-xs font-semibold text-stone-600 dark:text-stone-300"
            >
              Staff & Driver
            </Button>
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate("/student-login")}
              className="text-xs font-semibold px-4 rounded-md"
            >
              Student Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        
        {/* SECTION 1: Split Hero Section */}
        <section className="py-14 sm:py-20 border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Plain, Direct Headline & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  <span>Semester 2026 Transit Schedule Active</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                  Track your college bus in real-time. Arrive at your stop with confidence.
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Live satellite telemetry from campus bus drivers straight to your phone. Check accurate vehicle locations, route departures, and verify your registered bus pass.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate("/student-login")}
                    className="h-12 px-6 rounded-md font-semibold text-sm shadow-none"
                  >
                    Track My Bus
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/role-selection")}
                    className="h-12 px-6 rounded-md font-semibold text-sm border-border bg-card hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Driver & Fleet Admin
                  </Button>
                </div>

                {/* Practical Trust Points */}
                <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Real-time GPS updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Official semester passes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Works on 3G & 4G mobile</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic Product UI Mockup (Actual Transit Card) */}
              <div className="lg:col-span-5">
                <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
                  
                  {/* Top Bar of Bus Card */}
                  <div className="p-4 border-b border-border bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                        04
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">Bus 04 (UP-70-BT-4412)</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">Route 01 • Civil Lines Express</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-semibold gap-1.5 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                      On Route
                    </Badge>
                  </div>

                  {/* Timetable / Stops Sequence */}
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-700 mt-0.5"></div>
                          <div className="w-0.5 h-7 bg-stone-200 dark:bg-stone-800"></div>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <div>
                            <p className="font-semibold text-foreground">Civil Lines Bus Station</p>
                            <p className="text-[11px] text-muted-foreground">Departed on schedule</p>
                          </div>
                          <span className="font-mono text-muted-foreground tabular-nums">07:45 AM</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-background mt-0.5 animate-bus-pulse"></div>
                          <div className="w-0.5 h-7 bg-stone-200 dark:bg-stone-800"></div>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <div>
                            <p className="font-bold text-primary">High Court Crossing</p>
                            <p className="text-[11px] text-muted-foreground font-medium">Next stop • Approx. 4 mins</p>
                          </div>
                          <span className="font-mono font-bold text-primary tabular-nums">08:02 AM</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-700 mt-0.5"></div>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <div>
                            <p className="font-semibold text-foreground">Campus Gate 1 (UGI Naini)</p>
                            <p className="text-[11px] text-muted-foreground">Final destination</p>
                          </div>
                          <span className="font-mono text-muted-foreground tabular-nums">08:35 AM</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Strip */}
                    <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Driver Status</span>
                        <span className="font-semibold text-foreground">Rajesh K. (In-Cab)</span>
                      </div>
                      <div className="p-2 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">GPS Telemetry</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">Synced 6s ago</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate("/student-login")} 
                      className="w-full text-xs font-semibold h-9 rounded"
                    >
                      Open Live Map View
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: Full-Width Dark Band (Campus Fleet Statistics) */}
        <section className="bg-stone-900 text-stone-100 py-12 border-y border-stone-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-primary tabular-nums">18</p>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Campus Transit Routes</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">42</p>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">GPS-Monitored Buses</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">3,400+</p>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Enrolled Commuters</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tabular-nums">99.2%</p>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">On-Time Morning Arrival</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Alternating Image/Text Rows (Practical Campus Value) */}
        <section id="routes-schedule" className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl space-y-20">
            
            {/* Row 1: Student Live Tracking */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">01. For Students</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Know exactly when to step out to your stop
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Morning traffic across Phaphamau bridge or Civil Lines can vary daily. Instead of standing outside in extreme heat or winter fog, watch your bus move continuously down your corridor.
                </p>
                <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2.5 pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Live satellite location updates transmitted every 5 seconds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Direct status flags: "On Route", "Signal Delayed", or "At Depot"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Quick mobile-friendly tracking with low data consumption</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-6">
                <div className="border border-border rounded-xl p-5 bg-card space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Sample Corridor: Route 03 (Kareli Line)</span>
                    <span className="text-[10px] font-mono text-muted-foreground">Departed: 07:30 AM</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Bus 12 (UP-70-AT-1290)</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">At GTB Nagar (4 stops away)</span>
                    </div>
                    <div className="p-2.5 rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Bus 15 (UP-70-BT-1504)</span>
                      <span className="text-stone-500 font-mono">Scheduled 08:00 AM (Depot)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Route Security & Pass Verification */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 order-2 md:order-1">
                <div className="border border-border rounded-xl p-5 bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold text-foreground">Verified Transport Pass</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Active: Sem 6</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-foreground">Student ID: UGI-2023-CS-104</p>
                    <p className="text-muted-foreground">Authorized Route: <strong className="text-foreground">Route 01 (Civil Lines)</strong></p>
                    <p className="text-[11px] text-muted-foreground">Fee clearance verified via Academic Accounts Desk.</p>
                  </div>
                  <div className="p-2 rounded bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-300">
                    Restricts bus tracking exclusively to registered route pass-holders to prevent route overcrowding.
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 order-1 md:order-2 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">02. Route Governance</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Authorized passes prevent route overcrowding
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Campus transport safety requires accountability. Only students with verified bus passes for a specific route can view and board that route's buses.
                </p>
                <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2.5 pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
                    <span>Single university enrollment ID for bus pass verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
                    <span>Admin portal for adding and reallocating student corridor seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
                    <span>Eliminates unauthorized passengers and guarantees seats</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Row 3: Driver In-Cab Console */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">03. In-Cab Safety</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Designed for drivers with zero in-traffic distractions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bus drivers need full focus on the road. The driver console is designed with large touch controls, automatic screen wake-lock, and one-tap trip starting.
                </p>
                <ul className="text-xs text-stone-700 dark:text-stone-300 space-y-2.5 pt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Large 56px buttons operable from a phone dashboard mount</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Automatic screen wake-lock prevents the phone from going to sleep</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                    <span>Throttled location sync preserves mobile data and battery life</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-6">
                <div className="border border-border rounded-xl p-5 bg-card space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Driver In-Cab HUD</span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Screen Wake-Lock: On</span>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">BROADCASTING ROUTE 01</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Bus 04 • Next Stop: High Court</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 border border-border rounded">
                      <span className="text-[10px] text-muted-foreground block">GPS Signal</span>
                      <span className="font-bold text-foreground">Strong (±3m)</span>
                    </div>
                    <div className="p-2 border border-border rounded">
                      <span className="text-[10px] text-muted-foreground block">Transmission Rate</span>
                      <span className="font-bold text-foreground font-mono">1 ping / 5s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: Role Gateways (Clean 3-Block Grid) */}
        <section className="py-14 bg-stone-100/70 dark:bg-stone-900/50 border-t border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-md mx-auto mb-8 space-y-1">
              <h2 className="text-xl font-bold text-foreground">Access Portals</h2>
              <p className="text-xs text-muted-foreground">Select your portal to continue with campus transport.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div 
                onClick={() => navigate("/student-login")}
                className="border border-border rounded-xl p-5 bg-card hover:border-primary transition-colors cursor-pointer text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-primary">Student Commuter</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">Student Portal</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sign in with enrollment number to track assigned buses and view route timetables.
                </p>
              </div>

              <div 
                onClick={() => navigate("/driver-location")}
                className="border border-border rounded-xl p-5 bg-card hover:border-primary transition-colors cursor-pointer text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-stone-600 dark:text-stone-400">Transport Staff</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">Driver Console</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  One-tap live GPS broadcasting for scheduled morning and evening transit trips.
                </p>
              </div>

              <div 
                onClick={() => navigate("/admin-dashboard")}
                className="border border-border rounded-xl p-5 bg-card hover:border-primary transition-colors cursor-pointer text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-stone-600 dark:text-stone-400">Administration</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">Fleet Supervisor</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manage routes, assign vehicles, monitor live fleet radar, and enroll student passes.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-border bg-card py-10 text-xs text-stone-600 dark:text-stone-400">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-2">
              <p className="font-bold text-foreground text-sm">Transport Control Office</p>
              <p className="leading-relaxed">
                United Group of Institutions, Campus Gate 1<br />
                UPSIDC Industrial Area, Naini, Prayagraj, UP 211010
              </p>
              <p className="text-[11px] text-muted-foreground">Office Hours: Monday – Saturday, 07:00 AM – 06:00 PM</p>
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

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500">
            <p>© {new Date().getFullYear()} United Group of Institutions. Official Campus Transit Management System.</p>
            <p className="text-[11px]">System Status: GPS Dispatch & WebSocket Servers Operational</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
