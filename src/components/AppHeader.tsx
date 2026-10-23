import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bus, LogOut, Radio, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  roleBadge?: "Student" | "Driver" | "Admin";
  onLogout?: () => void;
  children?: ReactNode;
}

const AppHeader = ({ title, subtitle, roleBadge, onLogout, children }: AppHeaderProps) => (
  <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/85 backdrop-blur-md">
    <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between gap-4">
      {/* Brand & Wayfinding Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link 
          to="/" 
          className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold shrink-0 hover:bg-primary/90 transition-all shadow-xs group"
          title="Return to Campus Portal"
        >
          <Bus className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-card animate-pulse" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate tracking-tight">
              {title}
            </h1>
            {roleBadge && (
              <Badge 
                variant="outline" 
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                  roleBadge === "Admin"
                    ? "border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40"
                    : roleBadge === "Driver"
                    ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40"
                    : "border-primary/30 text-primary bg-primary/5"
                }`}
              >
                {roleBadge === "Admin" ? "Fleet Supervisor" : roleBadge === "Driver" ? "Driver In-Cab" : "Student Pass"}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {children}
        <ThemeToggle />
        {onLogout && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLogout}
            className="h-8 px-3 rounded-lg text-xs font-semibold border-border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        )}
      </div>
    </div>
  </header>
);

export default AppHeader;
