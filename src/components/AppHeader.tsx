import { ReactNode } from "react";
import { Bus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
  children?: ReactNode;
}

// Shared top bar for the student, driver and admin screens.
const AppHeader = ({ title, subtitle, onLogout, children }: AppHeaderProps) => (
  <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 bg-primary rounded-full flex items-center justify-center">
          <Bus className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onLogout && (
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </div>
  </header>
);

export default AppHeader;
