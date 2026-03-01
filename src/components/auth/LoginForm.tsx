
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Role = 'student' | 'admin' | 'driver';

interface LoginFormProps {
  role: Role;
  onLogin: (data: any) => void; // for students returns student data, otherwise just success
  onBack: () => void;
}

const LoginForm = ({ role, onLogin, onBack }: LoginFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let endpoint = '';
    let body: any = {};

    switch (role) {
      case 'student':
        endpoint = '/api/student/login';
        body = { studentId, password };
        break;
      case 'admin':
        endpoint = '/api/admin/login';
        body = { username, password };
        break;
      case 'driver':
        endpoint = '/api/driver/login';
        body = { password };
        break;
    }

    try {
      const response = await axios.post(endpoint, body);
      toast({
        title: "Login Successful",
        description:
          role === 'student'
            ? `Welcome ${response.data.name}! Access granted to ${response.data.registeredRoutes.length} route(s).`
            : 'Credentials verified',
      });
      // when student returns the document itself, pass that along
      onLogin(role === 'student' ? response.data : response.data);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description:
          role === 'student'
            ? 'Invalid student ID or password. Please try again.'
            : 'Invalid credentials. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              {role === 'student' ? 'Student Login' : role === 'admin' ? 'Admin Login' : 'Driver Login'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {role === 'student'
                ? 'Enter your college credentials to access your registered bus routes'
                : role === 'admin'
                ? 'Enter your admin username and password'
                : 'Enter driver password to start sharing location'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
              )}

              {(role === 'student' || role === 'admin' || role === 'driver') && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

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
                {role === 'student'
                  ? "Don't have access? "
                  : ""}
                {role === 'student' && (
                  <span className="text-blue-600 font-medium">Contact your college administration</span>
                )}
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
