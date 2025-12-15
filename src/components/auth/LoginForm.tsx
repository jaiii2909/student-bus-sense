import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bus, Lock, User, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (studentData: { id: string; name: string; registeredRoutes: string[] }) => void;
  onBack: () => void;
}

const LoginForm = ({ onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock student database with registered routes
  const mockStudentDatabase = {
    "STU001": {
      name: "John Doe",
      registeredRoutes: ["bus-1", "bus-2"],
      password: "password123"
    },
    "STU002": {
      name: "Jane Smith", 
      registeredRoutes: ["bus-2", "bus-3"],
      password: "password123"
    },
    "STU003": {
      name: "Mike Johnson",
      registeredRoutes: ["bus-1"],
      password: "password123"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const student = mockStudentDatabase[studentId as keyof typeof mockStudentDatabase];
      
      if (student && student.password === password) {
        toast({
          title: "Welcome aboard! 🚌",
          description: `Hi ${student.name}! Access granted to ${student.registeredRoutes.length} route(s).`,
        });
        onLogin({
          id: studentId,
          name: student.name,
          registeredRoutes: student.registeredRoutes
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials or no active bus registration found",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="decorative-circle w-96 h-96 bg-primary/20 top-[-10%] right-[-10%]" />
      <div className="decorative-circle w-80 h-80 bg-secondary/20 bottom-[10%] left-[-5%]" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-elevated border-0 glass overflow-hidden">
          {/* Gradient header bar */}
          <div className="h-2 bg-gradient-primary" />
          
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow animate-bounce-subtle">
              <Bus className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Student Login
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Enter your credentials to access your bus routes
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-card-foreground">
                  Student ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    className="pl-10 py-6 border-border/50 bg-background/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 py-6 border-border/50 bg-background/50 rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground py-6 text-lg font-semibold rounded-xl shadow-glow-sm transition-smooth"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Login
                    <Sparkles className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have access?{" "}
                <span className="text-primary font-medium cursor-pointer hover:underline">Contact administration</span>
              </p>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Demo Accounts
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["STU001", "STU002", "STU003"].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setStudentId(id);
                        setPassword("password123");
                      }}
                      className="px-2 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-smooth font-medium"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
