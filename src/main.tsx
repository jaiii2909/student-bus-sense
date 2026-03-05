import { createRoot } from 'react-dom/client'
import axios from "axios";
import App from './App.tsx'
import './index.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://student-bus-sense-4.onrender.com";
axios.defaults.baseURL = API_BASE_URL;

createRoot(document.getElementById("root")!).render(<App />);
