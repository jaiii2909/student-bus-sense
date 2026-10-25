import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { downloadCsv, toDateInput } from "@/lib/csv";

interface TripRow {
  id: string;
  busNumber: string;
  route: string;
  driverName: string;
  startedAt: string;
  endedAt: string | null;
  endReason: "stopped" | "admin" | "timeout" | "driverChange" | null;
}

const END_LABEL: Record<NonNullable<TripRow["endReason"]>, string> = {
  stopped: "Stopped by driver",
  admin: "Switched off by admin",
  timeout: "No GPS, auto-ended",
  driverChange: "Another driver took over"
};

const formatClock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const formatDuration = (fromIso: string, toIso: string) => {
  const minutes = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

// Admin: which bus ran when, and who drove it, for one day.
const TripsPanel = () => {
  const [day, setDay] = useState(() => toDateInput(new Date().toISOString()));
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(() => {
    if (!day) return;
    // the chosen day in the admin's own time zone
    const from = new Date(`${day}T00:00:00`);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    setIsLoading(true);
    axios
      .get<TripRow[]>("/api/admin/trips", { params: { from: from.toISOString(), to: to.toISOString() } })
      .then((res) => setTrips(res.data))
      .catch((error) => console.error("Could not load trips", error))
      .finally(() => setIsLoading(false));
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  const busCount = new Set(trips.map((t) => t.busNumber)).size;

  const handleExport = () => {
    downloadCsv(`trips-${day}.csv`, [
      ["bus", "route", "driver", "started", "ended", "minutes", "status"],
      ...trips.map((t) => [
        t.busNumber,
        t.route,
        t.driverName,
        new Date(t.startedAt).toLocaleString(),
        t.endedAt ? new Date(t.endedAt).toLocaleString() : "",
        t.endedAt ? Math.round((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 60000) : "",
        t.endedAt ? (t.endReason ? END_LABEL[t.endReason] : "Ended") : "Running"
      ])
    ]);
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Trip log</h2>
          <p className="text-[11px] text-muted-foreground">
            {trips.length} trip(s) by {busCount} bus(es). A trip runs from the driver's Start to Stop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="h-8 text-xs w-40" aria-label="Day" />
          <Button variant="outline" size="sm" onClick={handleExport} disabled={trips.length === 0} className="h-8 text-xs gap-1" title="Download this day's trips as CSV">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading} className="h-8 w-8 p-0" aria-label="Refresh trips">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-bold uppercase tracking-wider">Bus</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Driver</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Time</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                {isLoading ? "Loading..." : "No trips on this day"}
              </TableCell>
            </TableRow>
          ) : (
            trips.map((trip) => (
              <TableRow key={trip.id} className="border-border">
                <TableCell className="text-xs">
                  <span className="font-bold">{trip.busNumber}</span>
                  <span className="block text-[11px] text-muted-foreground">{trip.route}</span>
                </TableCell>
                <TableCell className="text-xs">{trip.driverName}</TableCell>
                <TableCell className="text-xs font-mono tabular-nums">
                  {formatClock(trip.startedAt)} – {trip.endedAt ? formatClock(trip.endedAt) : "now"}
                  <span className="block text-[11px] text-muted-foreground font-sans">
                    {formatDuration(trip.startedAt, trip.endedAt || new Date().toISOString())}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  {trip.endedAt ? (
                    <span className="text-muted-foreground">{trip.endReason ? END_LABEL[trip.endReason] : "Ended"}</span>
                  ) : (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Running</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripsPanel;
