import { Megaphone, X } from "lucide-react";

export interface Announcement {
  id: string;
  message: string;
  // route name, or null for every route
  route: string | null;
  expiresAt: string;
  createdAt: string;
}

interface AnnouncementBannerProps {
  announcements: Announcement[];
  nowMs: number;
  onDismiss: (id: string) => void;
}

const postedAgo = (createdAt: string, nowMs: number) => {
  const minutes = Math.max(0, Math.floor((nowMs - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

// Messages from the transport office, shown at the top of the student dashboard.
const AnnouncementBanner = ({ announcements, nowMs, onDismiss }: AnnouncementBannerProps) => {
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Announcements">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
        >
          <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold break-words">{a.message}</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {a.route || "All routes"} · posted {postedAgo(a.createdAt, nowMs)}
            </p>
          </div>
          <button
            onClick={() => onDismiss(a.id)}
            className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
