
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (studentData: { id: string; name: string; registeredRoutes: string[] }) => void;
  onBack: () => void;
}

const LoginForm = ({ onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock student database with registered routes
  const mockStudentDatabase = {
    "STU001": {
      name: "John Doe",
      registeredRoutes: ["Rajroohpur", "Kareli","Dhoomanganj"], // Rajroohpur & Kareli
    },
    "STU002": {
      name: "Jane Smith", 
      registeredRoutes: ["Kareli", "Dhoomanganj","Rajroohpur"], // Kareli & Dhoomanganj
    },
    "STU003": {
      name: "Mike Johnson",
      registeredRoutes: ["Rajroohpur","Kareli","Dhoomanganj"], // Rajroohpur only
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication with route access validation
    setTimeout(() => {
      const student = mockStudentDatabase[studentId as keyof typeof mockStudentDatabase];
      
      if (student) {
        toast({
          title: "Login Successful",
          description: `Welcome ${student.name}! Access granted to ${student.registeredRoutes.length} route(s).`,
        });
        onLogin({
          id: studentId,
          name: student.name,
          registeredRoutes: student.registeredRoutes
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid Student ID. Please check your ID and try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Student Login
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your college credentials to access your registered bus routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID (try STU001, STU002, or STU003)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}
              >
                {isLoading ? "Verifying Access..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have access?{" "}
                <span className="text-blue-600 font-medium">Contact your college administration</span>
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
