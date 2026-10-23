import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bus, LogOut, ArrowLeft } from "lucide-react";
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
  <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
    <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between gap-4">
      {/* Brand & Wayfinding Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link 
          to="/" 
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold shrink-0 hover:bg-primary/90 transition-colors"
          title="Return to Campus Portal"
        >
          <Bus className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
              {title}
            </h1>
            {roleBadge && (
              <Badge 
                variant="outline" 
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900"
              >
                {roleBadge === "Admin" ? "Fleet Supervisor" : roleBadge === "Driver" ? "Driver Console" : "Student Pass"}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {children}
        <ThemeToggle />
        {onLogout && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLogout}
            className="h-8 px-3 rounded-md text-xs font-semibold border-border hover:bg-stone-100 dark:hover:bg-stone-800"
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
