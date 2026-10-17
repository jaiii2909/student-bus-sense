import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Bus, Users, Navigation, ShieldCheck, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Top Bar with Return link and ThemeToggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-stone-600 dark:text-stone-300 hover:text-foreground text-xs font-semibold -ml-2"
          >
            <ArrowLeft className="mr-1.5 w-4 h-4" />
            Back to Campus Home
          </Button>
          <ThemeToggle />
        </div>

        {/* Section Header */}
        <div className="space-y-2 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground font-bold mb-1">
            <Bus className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Campus Transit Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Select your transit role to access real-time route tracking, in-cab GPS broadcasting, or fleet supervision.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          
          {/* Card 1: Student Commuter */}
          <div 
            onClick={() => navigate("/student-login")}
            className="border border-border rounded-xl p-6 bg-card hover:border-primary transition-colors cursor-pointer flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-foreground font-bold">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded border-stone-200 dark:border-stone-700">
                  Pass Required
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">Student Commuter</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Track your designated corridor buses, view morning & evening timetables, and monitor arrivals.
                </p>
              </div>

              <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2 pt-2 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Real-time GPS bus tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Fee-verified corridor pass access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Active vs depot vehicle status</span>
                </li>
              </ul>
            </div>

            <Button className="w-full text-xs font-semibold h-10 rounded-md">
              Sign In as Student
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Card 2: Transport Driver */}
          <div 
            onClick={() => navigate("/driver-location")}
            className="border border-border rounded-xl p-6 bg-card hover:border-primary transition-colors cursor-pointer flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-foreground font-bold">
                  <Navigation className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded border-stone-200 dark:border-stone-700">
                  In-Cab Mobile
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">Transport Driver</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Transmit vehicle location to student commuters while operating scheduled morning & evening routes.
                </p>
              </div>

              <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2 pt-2 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>One-tap live GPS broadcasting</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Automatic screen wake-lock</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Low mobile battery & data overhead</span>
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-md border-border hover:bg-stone-100 dark:hover:bg-stone-800">
              Open Driver Console
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Card 3: Fleet Supervisor / Admin */}
          <div 
            onClick={() => navigate("/admin-dashboard")}
            className="border border-border rounded-xl p-6 bg-card hover:border-primary transition-colors cursor-pointer flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-foreground font-bold">
                  <ShieldCheck className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded border-stone-200 dark:border-stone-700">
                  Staff Only
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">Fleet Supervisor</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Manage university routes, assign bus vehicles, monitor the live fleet radar, and manage student passes.
                </p>
              </div>

              <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2 pt-2 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Full campus fleet radar map</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Bus vehicle & route allocation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Semester student pass database</span>
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-md border-border hover:bg-stone-100 dark:hover:bg-stone-800">
              Enter Admin Portal
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RoleSelection;
