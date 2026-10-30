import { useEffect, useState } from "react";
import axios from "axios";
import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import { Announcement } from "@/components/AnnouncementBanner";

interface AnnouncementsPanelProps {
  routeNames: string[];
}

const ALL_ROUTES = "__all__";
const MAX_LENGTH = 280;

// expiry choices; the API accepts up to 7 days ahead
const EXPIRY_OPTIONS: { value: string; label: string; at: () => Date }[] = [
  { value: "1h", label: "1 hour", at: () => new Date(Date.now() + 60 * 60 * 1000) },
  { value: "3h", label: "3 hours", at: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  {
    value: "today",
    label: "End of today",
    at: () => {
      const end = new Date();
      end.setHours(23, 59, 0, 0);
      return end;
    }
  },
  { value: "1d", label: "1 day", at: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  { value: "7d", label: "7 days", at: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 - 60 * 1000) }
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Admin tab: post a message to one route or all routes, and remove active ones.
const AnnouncementsPanel = ({ routeNames }: AnnouncementsPanelProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [route, setRoute] = useState(ALL_ROUTES);
  const [expiry, setExpiry] = useState("today");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios
      .get<Announcement[]>("/api/admin/announcements")
      .then((res) => setItems(res.data))
      .catch((error) => console.error("Could not load announcements", error));
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: "Write a message first", variant: "destructive" });
      return;
    }
    const option = EXPIRY_OPTIONS.find((o) => o.value === expiry) || EXPIRY_OPTIONS[0];
    setIsSaving(true);
    try {
      const response = await axios.post<Announcement>("/api/admin/announcements", {
        message: message.trim(),
        route: route === ALL_ROUTES ? null : route,
        expiresAt: option.at().toISOString()
      });
      setItems((prev) => [response.data, ...prev]);
      setMessage("");
      toast({ title: "Announcement posted", description: "Students see it right away." });
    } catch (error) {
      toast({ title: "Could not post announcement", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/admin/announcements/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      toast({ title: "Could not delete", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <SectionCard title="New Announcement" description="Shown at the top of the student dashboard until it expires">
      <form onSubmit={handlePost} className="p-4 space-y-3">

        <div className="space-y-1.5">
          <Label htmlFor="announcement-message">Message</Label>
          <textarea
            id="announcement-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
            rows={3}
            placeholder="e.g. K2 is running 15 minutes late this morning"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pointer-coarse:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-2xs text-muted-foreground text-right">{message.length}/{MAX_LENGTH}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Route</Label>
            <Select value={route} onValueChange={setRoute}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROUTES} className="text-xs">All routes</SelectItem>
                {routeNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Show for</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={isSaving} className="w-full gap-1.5">
          <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />
          {isSaving ? "Posting…" : "Post Announcement"}
        </Button>
      </form>
      </SectionCard>

      <SectionCard title={`Active (${items.length})`}>
      <div className="p-4 space-y-3">
        {items.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No active announcements</p>}
        {items.map((a) => (
          <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/80">
            <div className="flex-1 min-w-0">
              <p className="text-sm break-words">{a.message}</p>
              <p className="text-2xs text-muted-foreground mt-1">
                {a.route || "All routes"} · until {formatTime(a.expiresAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(a.id)}
              className="h-7 w-7 p-0 hover:text-destructive"
              aria-label="Delete announcement"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      </SectionCard>
    </div>
  );
};

export default AnnouncementsPanel;
