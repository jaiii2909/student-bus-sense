import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import MapView from "@/components/LazyMapView";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import { Stop } from "@/lib/eta";

export interface RouteWithStops {
  _id: string;
  routeName: string;
  stops?: Stop[];
}

interface RouteStopsDialogProps {
  route: RouteWithStops | null;
  onClose: () => void;
  onSaved: (route: RouteWithStops) => void;
}

// Admin editor for a route's stops: click the map to add, then name and order them.
const RouteStopsDialog = ({ route, onClose, onSaved }: RouteStopsDialogProps) => {
  const { toast } = useToast();
  const [stops, setStops] = useState<Stop[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStops(route?.stops ? route.stops.map((s) => ({ ...s })) : []);
  }, [route]);

  const addStop = (position: { lat: number; lng: number }) => {
    setStops((prev) => [...prev, { name: `Stop ${prev.length + 1}`, ...position }]);
  };

  const renameStop = (index: number, name: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)));
  };

  const moveStop = (index: number, offset: -1 | 1) => {
    setStops((prev) => {
      const target = index + offset;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!route) return;
    if (stops.some((s) => !s.name.trim())) {
      toast({ title: "Every stop needs a name", variant: "destructive" });
      return;
    }
    const names = stops.map((s) => s.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      toast({ title: "Stop names must be different", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/admin/routes/${route._id}/stops`, {
        stops: stops.map((s) => ({ ...s, name: s.name.trim() }))
      });
      onSaved(response.data);
      toast({ title: "Stops saved" });
      onClose();
    } catch (error) {
      console.error("Could not save stops", error);
      toast({ title: "Could not save stops", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const center = stops.length ? stops[stops.length - 1] : undefined;

  return (
    <Dialog open={!!route} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stops for {route?.routeName}</DialogTitle>
          <DialogDescription>
            Click the map to add a stop, in the order the bus reaches them. Students pick their stop to see an ETA.
          </DialogDescription>
        </DialogHeader>

        <div className="h-[280px] rounded-md overflow-hidden border border-border">
          <MapView
            center={center}
            zoom={13}
            onMapClick={addStop}
            markers={stops.map((s, i) => ({ id: `stop-${i}`, position: s, title: `${i + 1}. ${s.name}`, kind: "stop" }))}
          />
        </div>

        <div className="space-y-2">
          {stops.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No stops yet. Click the map to add the first one.</p>
          )}
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 text-xs font-mono text-muted-foreground text-right">{index + 1}.</span>
              <Input
                value={stop.name}
                onChange={(e) => renameStop(index, e.target.value)}
                className="h-8 text-xs"
                aria-label={`Stop ${index + 1} name`}
              />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => moveStop(index, -1)} disabled={index === 0} aria-label="Move stop up">
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1} aria-label="Move stop down">
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => removeStop(index)} aria-label="Remove stop">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : `Save ${stops.length} stop(s)`}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RouteStopsDialog;
