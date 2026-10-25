// Filtering for the admin student directory (runs on the list already loaded).

export interface FilterableStudent {
  studentId: string;
  name: string;
  registeredRoutes: string[];
  accessValidUntil?: string | null;
}

export type PassFilter = "all" | "valid" | "expiring" | "expired" | "noEnd";

export const ALL_ROUTES = "__all__";
export const NO_ROUTE = "__none__";

export const PASS_FILTER_LABELS: Record<PassFilter, string> = {
  all: "Any pass status",
  valid: "Pass valid",
  expiring: "Expiring in 30 days",
  expired: "Pass expired",
  noEnd: "No end date"
};

const EXPIRING_SOON_MS = 30 * 24 * 60 * 60 * 1000;

const matchesPass = (s: FilterableStudent, pass: PassFilter, nowMs: number) => {
  const end = s.accessValidUntil ? new Date(s.accessValidUntil).getTime() : null;
  switch (pass) {
    case "valid":
      return end === null || end >= nowMs;
    case "expiring":
      return end !== null && end >= nowMs && end - nowMs <= EXPIRING_SOON_MS;
    case "expired":
      return end !== null && end < nowMs;
    case "noEnd":
      return end === null;
    default:
      return true;
  }
};

export interface StudentFilterState {
  search: string;
  route: string; // ALL_ROUTES, NO_ROUTE, or a route name
  pass: PassFilter;
}

export const filterStudents = <T extends FilterableStudent>(students: T[], f: StudentFilterState, nowMs: number) => {
  const search = f.search.trim().toLowerCase();
  return students.filter((s) => {
    if (search && !s.studentId.toLowerCase().includes(search) && !s.name.toLowerCase().includes(search)) return false;
    if (f.route === NO_ROUTE && s.registeredRoutes.length > 0) return false;
    if (f.route !== ALL_ROUTES && f.route !== NO_ROUTE && !s.registeredRoutes.includes(f.route)) return false;
    return matchesPass(s, f.pass, nowMs);
  });
};

export const isFiltered = (f: StudentFilterState) => !!f.search.trim() || f.route !== ALL_ROUTES || f.pass !== "all";
