import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Bus, Users, Navigation, ShieldCheck, Check, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl space-y-8 relative z-10">
        
        {/* Top Bar with Return link and ThemeToggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold -ml-2"
          >
            <ArrowLeft className="mr-1.5 w-4 h-4" />
            Back to Campus Home
          </Button>
          <ThemeToggle />
        </div>

        {/* Section Header */}
        <div className="space-y-2 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold mb-2 shadow-xs border border-primary/20">
            <Bus className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Campus Transit Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Choose your designated transit role to access real-time satellite tracking, in-cab broadcast tools, or fleet management.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1: Student Commuter */}
          <div 
            onClick={() => navigate("/student-login")}
            className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-2xs border border-primary/20">
                  <Users className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-2xs uppercase font-bold tracking-wider rounded-full border-primary/30 bg-primary/5 text-primary">
                  Pass Required
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Student Commuter
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Track your designated corridor buses, inspect live vehicle telemetry, and monitor arrival countdowns.
                </p>
              </div>

              <ul className="text-xs text-muted-foreground space-y-2.5 pt-3 border-t border-border/80">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Real-time GPS bus tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Fee-verified corridor pass access</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Approach alerts when bus is near</span>
                </li>
              </ul>
            </div>

            <Button className="w-full text-xs font-bold h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs group-hover:shadow-md transition-all">
              Sign In as Student
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Card 2: Transport Driver */}
          <div 
            onClick={() => navigate("/driver-location")}
            className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold shadow-2xs border border-border">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-2xs uppercase font-bold tracking-wider rounded-full border-border bg-muted/50 text-muted-foreground">
                  In-Cab Mobile
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Transport Driver
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Transmit vehicle location to student commuters while operating scheduled morning & evening routes.
                </p>
              </div>

              <ul className="text-xs text-muted-foreground space-y-2.5 pt-3 border-t border-border/80">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>One-tap live GPS broadcasting</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Automatic screen wake-lock</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Low mobile battery & data overhead</span>
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full text-xs font-semibold h-10 border-border hover:bg-muted transition-colors">
              Open Driver Console
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Card 3: Fleet Supervisor / Admin */}
          <div 
            onClick={() => navigate("/admin-dashboard")}
            className="border border-border/80 rounded-xl p-6 bg-card hover:border-primary/60 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-muted/40 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold shadow-2xs border border-border">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-2xs uppercase font-bold tracking-wider rounded-full border-border bg-muted/50 text-muted-foreground">
                  Staff Only
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Fleet Supervisor
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Manage university routes, assign bus vehicles, monitor the live fleet radar, and verify student passes.
                </p>
              </div>

              <ul className="text-xs text-muted-foreground space-y-2.5 pt-3 border-t border-border/80">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Full campus fleet radar map</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Bus vehicle & route allocation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Semester student pass database</span>
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full text-xs font-semibold h-10 border-border hover:bg-muted transition-colors">
              Enter Admin Portal
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RoleSelection;
