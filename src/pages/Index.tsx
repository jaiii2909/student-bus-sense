import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Shield, Users, Bus, Sparkles, Zap, ArrowRight } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/Dashboard";

interface StudentData {
  id: string;
  name: string;
  registeredRoutes: string[];
}

const Index = () => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (data: StudentData) => {
    setStudentData(data);
  };

  const handleLogout = () => {
    setStudentData(null);
    setShowLogin(false);
  };

  if (studentData) {
    return <Dashboard studentData={studentData} onLogout={handleLogout} />;
  }

  if (showLogin) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onBack={() => setShowLogin(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="decorative-circle w-96 h-96 bg-primary/20 top-[-10%] right-[-10%]" />
      <div className="decorative-circle w-80 h-80 bg-secondary/20 bottom-[10%] left-[-5%]" />
      <div className="decorative-circle w-64 h-64 bg-accent/20 top-[40%] right-[20%]" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm">
              <Bus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">CampusRide</span>
          </div>
          <Button 
            onClick={() => setShowLogin(true)}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow-sm transition-smooth"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Real-time GPS Tracking
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Track Your Campus Bus
            <span className="block text-gradient-primary">In Real-Time</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Never miss your ride again. Get live bus locations, accurate ETAs, and smart notifications designed for students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowLogin(true)}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-2xl shadow-glow transition-smooth group"
            >
              Start Tracking
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-primary/30 text-foreground hover:bg-primary/10 px-8 py-6 text-lg font-semibold rounded-2xl transition-smooth"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            {
              icon: MapPin,
              title: "Live Tracking",
              description: "See your bus moving in real-time with GPS precision",
              gradient: "bg-gradient-primary",
              delay: "stagger-1"
            },
            {
              icon: Clock,
              title: "Smart ETAs",
              description: "AI-powered arrival predictions that adapt to traffic",
              gradient: "bg-gradient-secondary",
              delay: "stagger-2"
            },
            {
              icon: Shield,
              title: "Secure Access",
              description: "View only your registered routes with verified credentials",
              gradient: "bg-gradient-accent",
              delay: "stagger-3"
            },
            {
              icon: Zap,
              title: "Instant Alerts",
              description: "Get notified when your bus is approaching your stop",
              gradient: "bg-gradient-warm",
              delay: "stagger-4"
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className={`card-hover border-0 shadow-card bg-card/80 glass animate-fade-in-up ${feature.delay}`}
            >
              <CardHeader className="text-center pb-2">
                <div className={`w-14 h-14 ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg font-bold text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="glass rounded-3xl shadow-elevated p-8 md:p-12 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "1",
                title: "Login with Student ID",
                description: "Authenticate using your college credentials to verify your bus registrations",
                color: "primary"
              },
              {
                step: "2",
                title: "View Your Routes",
                description: "Access only the bus routes you've registered and paid for this semester",
                color: "secondary"
              },
              {
                step: "3",
                title: "Track & Arrive",
                description: "See live location and arrival estimates for your authorized buses",
                color: "accent"
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className={`w-20 h-20 bg-${item.color} text-${item.color}-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg animate-bounce-subtle`}
                  style={{ 
                    background: index === 0 ? 'var(--gradient-primary)' : 
                               index === 1 ? 'var(--gradient-secondary)' : 
                               'var(--gradient-accent)'
                  }}
                >
                  {item.step}
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: "15+", label: "Active Buses" },
            { value: "2000+", label: "Students" },
            { value: "50+", label: "Routes" },
            { value: "99.9%", label: "Uptime" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl glass card-hover">
              <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">{stat.value}</div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center py-12">
          <div className="inline-block p-8 md:p-12 rounded-3xl bg-gradient-primary shadow-glow">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Never Miss Your Bus?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Join thousands of students who track their campus buses in real-time.
            </p>
            <Button 
              onClick={() => setShowLogin(true)}
              size="lg"
              variant="secondary"
              className="bg-card text-foreground hover:bg-card/90 px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg transition-smooth"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 glass">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 CampusRide. Designed for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
