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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm border border-border rounded-xl bg-card shadow-sm p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-primary">
          <Bus className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-foreground tabular-nums">404</span>
          <h1 className="text-base font-bold text-foreground">Transit Stop Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page or route you attempted to access is not on the university transit schedule.
          </p>
        </div>
        <Button 
          onClick={() => navigate("/")} 
          className="rounded-md w-full h-9 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Return to Campus Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
