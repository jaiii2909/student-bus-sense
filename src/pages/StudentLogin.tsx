import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/Dashboard";

interface StudentData {
  _id?: string;
  studentId?: string;
  name: string;
  password?: string;
  registeredRoutes: string[];
}

const STUDENT_SESSION_KEY = "studentSession";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(() => {
    const saved = localStorage.getItem(STUDENT_SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as StudentData;
    } catch {
      localStorage.removeItem(STUDENT_SESSION_KEY);
      return null;
    }
  });

  const handleLogin = (data: StudentData) => {
    // Persist only session essentials; avoid storing password in browser storage.
    const sessionData: StudentData = {
      _id: data._id,
      studentId: data.studentId,
      name: data.name,
      registeredRoutes: data.registeredRoutes || []
    };
    setStudentData(sessionData);
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    setStudentData(null);
    localStorage.removeItem(STUDENT_SESSION_KEY);
  };

  if (studentData) {
    return <Dashboard studentData={studentData} onLogout={handleLogout} />;
  }

  return (
    <LoginForm 
      role="student"
      onLogin={handleLogin} 
      onBack={() => navigate("/role-selection")} 
    />
  );
};

export default StudentLogin;
