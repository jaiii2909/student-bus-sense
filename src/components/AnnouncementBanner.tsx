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
    <div className="space-y-2.5" role="region" aria-label="Announcements">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Megaphone className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold break-words">{a.message}</p>
            <div className="flex items-center gap-2 text-2xs opacity-80 mt-1">
              <span className="font-bold px-1.5 py-px rounded-full bg-amber-500/20 text-2xs">
                {a.route || "All Campus Routes"}
              </span>
              <span>·</span>
              <span>Posted {postedAgo(a.createdAt, nowMs)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(a.id)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:p-2.5"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
