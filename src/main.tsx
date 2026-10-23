import { createRoot } from 'react-dom/client'
import axios from "axios";
import App from './App.tsx'
import './index.css'
import { API_BASE_URL } from "./lib/config";
import { clearSession, getSession, roleForPath } from "./lib/session";

axios.defaults.baseURL = API_BASE_URL;

// attach the logged-in user's token to API calls
axios.interceptors.request.use((config) => {
  const role = roleForPath(config.url);
  const token = role ? getSession(role)?.token : undefined;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// expired or missing session: drop it and show the login screen again
axios.interceptors.response.use(undefined, (error) => {
  const url: string = error.config?.url || "";
  const role = roleForPath(url);
  if (error.response?.status === 401 && role && !url.endsWith("/login")) {
    clearSession(role);
    window.location.reload();
  }
  return Promise.reject(error);
});

createRoot(document.getElementById("root")!).render(<App />);

// makes the app installable and lets it show "bus is near" notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker failed:", error));
  });
}
