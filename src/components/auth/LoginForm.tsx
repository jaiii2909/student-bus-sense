import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bus, Eye, EyeOff, Lock, User, ShieldCheck, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

type Role = 'student' | 'admin' | 'driver';

interface LoginFormProps {
  role: Role;
  onLogin: (data: any) => void;
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
    description: "Enter vehicle driver passkey to begin live GPS broadcasting.",
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
  const { toast } = useToast();

  const meta = roleMeta[role];
  const IconComponent = meta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let endpoint = '';
    let body: any = {};

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
        body = { password };
        break;
    }

    try {
      const response = await axios.post(endpoint, body);
      toast({
        title: "Access Verified",
        description:
          role === 'student'
            ? `Welcome ${response.data.name}. Authorized for ${response.data.registeredRoutes?.length || 0} campus route(s).`
            : 'Credentials confirmed.',
      });
      onLogin(response.data);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description:
          error.response?.data?.message ||
          (role === 'student'
            ? 'Invalid student ID or password. Check with the campus transport desk.'
            : 'Invalid credentials. Please verify your entry.'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-stone-600 dark:text-stone-300 hover:text-foreground text-xs font-semibold -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <ThemeToggle />
        </div>

        {/* Auth Card */}
        <div className="border border-border rounded-xl bg-card shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[10px] font-bold uppercase tracking-wider">
              <IconComponent className="w-3.5 h-3.5 text-primary" />
              <span>{meta.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
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
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. UGI-2023-CS-104"
                    className="pl-9 h-10 rounded-md border-border text-xs focus-visible:ring-primary"
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
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. transport_admin"
                    className="pl-9 h-10 rounded-md border-border text-xs focus-visible:ring-primary"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {role === 'driver' ? 'In-Cab Driver Passkey' : 'Password'}
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={role === 'driver' ? "Enter assigned driver passkey" : "Enter password"}
                  className="pl-9 pr-10 h-10 rounded-md border-border text-xs focus-visible:ring-primary"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-md font-semibold text-xs mt-2"
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
          </form>

          <div className="pt-4 border-t border-border text-[11px] text-muted-foreground text-center">
            Need transport pass clearance? Visit the Transport Desk at Campus Gate 1.
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
