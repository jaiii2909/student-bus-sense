import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/Dashboard";

interface StudentData {
  id: string;
  name: string;
  registeredRoutes: string[];
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  const handleLogin = (data: StudentData) => {
    setStudentData(data);
  };

  const handleLogout = () => {
    setStudentData(null);
  };

  if (studentData) {
    return <Dashboard studentData={studentData} onLogout={handleLogout} />;
  }

  return (
    <LoginForm 
      onLogin={handleLogin} 
      onBack={() => navigate("/role-selection")} 
    />
  );
};

export default StudentLogin;
