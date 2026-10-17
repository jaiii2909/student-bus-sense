import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RoleSelection from "./pages/RoleSelection";
import StudentLogin from "./pages/StudentLogin";
import Driver from "./pages/Driver";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" attribute="class" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/driver-location" element={<Driver />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
</ThemeProvider>
);

export default App;
