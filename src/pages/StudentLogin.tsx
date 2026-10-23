import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/Dashboard";
import { clearSession, getSession, saveSession } from "@/lib/session";

interface StudentData {
  _id?: string;
  studentId?: string;
  name: string;
  registeredRoutes: string[];
  token?: string;
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(() => {
    const saved = getSession<StudentData>("student");
    // sessions saved before login tokens existed must log in again
    return saved?.token ? saved : null;
  });

  const handleLogin = (data: StudentData) => {
    // Persist only session essentials; avoid storing password in browser storage.
    const sessionData: StudentData = {
      _id: data._id,
      studentId: data.studentId,
      name: data.name,
      registeredRoutes: data.registeredRoutes || [],
      token: data.token
    };
    setStudentData(sessionData);
    saveSession("student", sessionData);
  };

  const handleLogout = () => {
    setStudentData(null);
    clearSession("student");
  };

  // after a password change the old token stops working, so keep the new one
  const handleTokenChange = (token: string) => {
    if (!studentData) return;
    const sessionData = { ...studentData, token };
    setStudentData(sessionData);
    saveSession("student", sessionData);
  };

  if (studentData) {
    return <Dashboard studentData={studentData} onLogout={handleLogout} onTokenChange={handleTokenChange} />;
  }

  return (
    <LoginForm
      role="student"
      onLogin={handleLogin}
      onBack={() => navigate("/")}
    />
  );
};

export default StudentLogin;
