import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bus, Eye, EyeOff, Lock, User, ShieldCheck, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

type Role = 'student' | 'admin' | 'driver';

interface LoginResponse {
  token: string;
  name: string;
  registeredRoutes: string[];
  studentId?: string;
  _id?: string;
}

interface LoginFormProps {
  role: Role;
  onLogin: (data: LoginResponse) => void;
  onBack: () => void;
}

const roleMeta = {
  student: {
    title: "Student Pass Sign In",
    description: "Enter your university enrollment number to access your authorized corridor buses.",
    badge: "Student Commuter",
    icon: Bus,
  },
  admin: {
    title: "Fleet Supervisor Sign In",
    description: "Enter administrative credentials to manage campus routes and vehicle passes.",
    badge: "Transport Office",
    icon: ShieldCheck,
  },
  driver: {
    title: "Driver In-Cab Verification",
    description: "Enter your driver username and passkey to begin live GPS broadcasting.",
    badge: "Transport Staff",
    icon: Navigation,
  },
};

const LoginForm = ({ role, onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    axios.get("/api/health").catch(() => {});
  }, []);

  const meta = roleMeta[role];
  const IconComponent = meta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const slowTimer = window.setTimeout(() => setIsWakingServer(true), 3000);
    let endpoint = '';
    let body: Record<string, string> = {};

    switch (role) {
      case 'student':
        endpoint = '/api/student/login';
        body = { studentId: studentId.trim(), password };
        break;
      case 'admin':
        endpoint = '/api/admin/login';
        body = { username: username.trim(), password };
        break;
      case 'driver':
        endpoint = '/api/driver/login';
        body = username.trim() ? { username: username.trim(), password } : { password };
        break;
    }

    try {
      const response = await axios.post<LoginResponse>(endpoint, body);
      toast({
        title: "Access Verified",
        description:
          role === 'student'
            ? `Welcome ${response.data.name}. Authorized for ${response.data.registeredRoutes?.length || 0} campus route(s).`
            : 'Credentials confirmed.',
      });
      onLogin(response.data);
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: apiErrorMessage(
          error,
          role === 'student'
            ? 'Invalid student ID or password. Check with the campus transport desk.'
            : 'Invalid credentials. Please verify your entry.'
        ),
        variant: "destructive",
      });
    } finally {
      window.clearTimeout(slowTimer);
      setIsWakingServer(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <ThemeToggle />
        </div>

        {/* Auth Card */}
        <div className="border border-border/80 rounded-2xl bg-card shadow-xl p-7 sm:p-9 space-y-6">
          <div className="space-y-2.5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider">
              <IconComponent className="w-3.5 h-3.5" />
              <span>{meta.badge}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {meta.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'student' && (
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-xs font-semibold text-foreground">
                  Student Enrollment Number
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. UGI-2023-CS-104"
                    className="pl-10 h-10 rounded-xl border-border text-xs focus-visible:ring-primary"
                    required
                    autoComplete="username"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Printed on your physical semester bus pass slip.</p>
              </div>
            )}

            {role === 'admin' && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                  Administrator Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. transport_admin"
                    className="pl-10 h-10 rounded-xl border-border text-xs focus-visible:ring-primary"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            {role === 'driver' && (
              <div className="space-y-1.5">
                <Label htmlFor="driver-username" className="text-xs font-semibold text-foreground">
                  Driver Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="driver-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ramesh"
                    className="pl-10 h-10 rounded-xl border-border text-xs focus-visible:ring-primary"
                    autoComplete="username"
                    autoCapitalize="none"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Leave empty only if your college still uses one shared driver password.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {role === 'driver' ? 'In-Cab Driver Passkey' : 'Password'}
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'driver' ? "Enter assigned driver passkey" : "Enter password"}
                  className="pl-10 pr-10 h-10 rounded-xl border-border text-xs focus-visible:ring-primary"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs mt-3 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                role === 'driver' ? "Begin In-Cab Session" : "Verify & Sign In"
              )}
            </Button>
            {isWakingServer && (
              <p className="text-[11px] text-muted-foreground text-center animate-pulse" role="status">
                Waking up the cloud server, this can take up to a minute...
              </p>
            )}
          </form>

          <div className="pt-4 border-t border-border/80 text-[11px] text-muted-foreground text-center">
            Need transport pass clearance? Visit the Transport Desk at Campus Gate 1.
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
