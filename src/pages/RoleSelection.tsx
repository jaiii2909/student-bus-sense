import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Navigation } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 text-gray-600 hover:text-gray-900 justify-start"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Select Your Role</h1>
          <p className="text-lg text-gray-600">Choose your role to continue with the bus tracking system</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Student Card */}
          <Card className="border-2 border-transparent hover:border-blue-500 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
            onClick={() => navigate("/student-login")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-center text-gray-600">
                Track your college bus in real-time.
              </CardDescription>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>✓ Real-time bus tracking</li>
                <li>✓ Running / not running status</li>
                <li>✓ Route information</li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                Continue as Student
              </Button>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card className="border-2 border-transparent hover:border-green-500 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
            onClick={() => navigate("/driver-location")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Navigation className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Driver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-center text-gray-600">
                Share your bus location with students in one tap.
              </CardDescription>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>✓ Share live location</li>
                <li>✓ Pick your route and bus</li>
                <li>✓ Students see you instantly</li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white mt-4">
                Continue as Driver
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="border-2 border-transparent hover:border-purple-500 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
            onClick={() => navigate("/admin-dashboard")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-center text-gray-600">
                Manage buses, routes, and monitor the entire fleet.
              </CardDescription>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>✓ Bus management</li>
                <li>✓ Route & student access</li>
                <li>✓ Live fleet map</li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4">
                Continue as Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
