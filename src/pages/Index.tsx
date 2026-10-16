import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Shield, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen"  
      style={{ 
        backgroundImage: 'url(/background.png)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >

    {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-10 max-w-3xl mx-auto shadow-lg">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 animate-fade-in text-gray-900">
            Track <span className="text-primary">My</span> Bus
          </h1>
          <p className="text-lg sm:text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            Track your college bus in real-time and never miss your ride again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/student-login")}
              className="px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Track Your Bus
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="border-2 border-primary text-primary hover:bg-blue-50 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300"
            >
              How It Works
            </Button>
          </div>
          <button
            onClick={() => navigate("/role-selection")}
            className="mt-6 text-sm text-gray-700 underline underline-offset-4 hover:text-gray-900"
          >
            Driver or Admin? Staff login
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                See your bus location updated in real-time with GPS precision
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Live Status</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                See whether your bus is running and when it last updated
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Only verified students with paid fees can access their registered routes
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Route-Specific Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Access only the bus routes you've registered and paid for this semester
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div id="how-it-works" className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16 scroll-mt-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Login with Student ID</h3>
              <p className="text-gray-600">Authenticate using your college credentials to verify your bus registrations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Access Your Routes</h3>
              <p className="text-gray-600">View only the bus routes you've registered and paid for this semester</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Securely</h3>
              <p className="text-gray-600">See the live location of your bus, updated as the driver moves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-2">
                <a href="mailto:help@united.ac.in" className="block text-primary hover:text-blue-800 transition-colors">
                  Mail to: help@united.ac.in
                </a>
                <a href="mailto:info@united.ac.in" className="block text-primary hover:text-blue-800 transition-colors">
                  College Mail: info@united.ac.in
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="https://united.ac.in" className="block text-primary hover:text-blue-800 transition-colors">
                  College Website
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} United Group of Institutions. All rights reserved. | College Bus Tracker System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
