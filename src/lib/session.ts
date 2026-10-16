export type Role = "student" | "driver" | "admin";

const KEYS: Record<Role, string> = {
  student: "studentSession",
  driver: "driverSession",
  admin: "adminSession",
};

export interface Session {
  token?: string;
}

export const getSession = <T extends Session = Session>(role: Role): T | null => {
  try {
    const saved = localStorage.getItem(KEYS[role]);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
};

export const saveSession = (role: Role, data: Session) => {
  try {
    localStorage.setItem(KEYS[role], JSON.stringify(data));
  } catch {
    // storage unavailable: session just won't survive a refresh
  }
};

export const clearSession = (role: Role) => {
  try {
    localStorage.removeItem(KEYS[role]);
  } catch {
    // ignore
  }
};

// Which session's token an API path needs.
export const roleForPath = (url = ""): Role | null => {
  if (url.startsWith("/api/admin")) return "admin";
  if (url.startsWith("/api/driver") || url.startsWith("/api/buses")) return "driver";
  if (url.startsWith("/api/student")) return "student";
  return null;
};
