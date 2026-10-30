import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Bus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: Non-existent route path:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm border border-border/80 rounded-xl bg-card shadow-xl p-8 text-center space-y-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs border border-primary/20">
          <Bus className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="text-4xl font-extrabold text-foreground tabular-nums tracking-tight">404</span>
          <h1 className="text-base font-bold text-foreground">Transit Stop Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page or route you attempted to access is not on the university transit schedule.
          </p>
        </div>
        <Button 
          onClick={() => navigate("/")} 
          className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Return to Campus Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
