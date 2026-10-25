import { useState } from "react";
import axios from "axios";
import { CalendarClock, Download, MinusCircle, PlusCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import { downloadCsv, endOfDayIso, toDateInput } from "@/lib/csv";

interface SelectedStudent {
  _id: string;
  studentId: string;
  name: string;
  registeredRoutes: string[];
  accessValidUntil?: string | null;
}

type BulkAction = "addRoute" | "removeRoute" | "setValidUntil" | "delete";

interface StudentBulkActionsProps {
  selected: SelectedStudent[];
  routeNames: string[];
  onDone: () => void; // reload the list after a change
  onClear: () => void; // clear the selection
}

const TITLES: Record<BulkAction, string> = {
  addRoute: "Add a route",
  removeRoute: "Remove a route",
  setValidUntil: "Set pass end date",
  delete: "Delete students"
};

// Toolbar shown when students are selected in the directory.
const StudentBulkActions = ({ selected, routeNames, onDone, onClear }: StudentBulkActionsProps) => {
  const { toast } = useToast();
  const [action, setAction] = useState<BulkAction | null>(null);
  const [route, setRoute] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [noEndDate, setNoEndDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const count = selected.length;

  const open = (next: BulkAction) => {
    setRoute("");
    setValidUntil("");
    setNoEndDate(false);
    setAction(next);
  };

  const handleExport = () => {
    downloadCsv(`students-selected-${toDateInput(new Date().toISOString())}.csv`, [
      ["studentId", "name", "routes", "passValidUntil"],
      ...selected.map((s) => [s.studentId, s.name, s.registeredRoutes.join(";"), toDateInput(s.accessValidUntil)])
    ]);
  };

  const handleApply = async () => {
    if (!action) return;
    if ((action === "addRoute" || action === "removeRoute") && !route) {
      toast({ title: "Choose a route", variant: "destructive" });
      return;
    }
    if (action === "setValidUntil" && !noEndDate && !validUntil) {
      toast({ title: "Choose a date, or tick 'No end date'", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.post<{ affected: number }>("/api/admin/students/bulk", {
        ids: selected.map((s) => s._id),
        action,
        route: route || undefined,
        accessValidUntil: action === "setValidUntil" ? (noEndDate ? null : endOfDayIso(validUntil)) : undefined
      });
      const affected = response.data.affected;
      toast({
        title: action === "delete" ? `${affected} student(s) deleted` : `${affected} student(s) updated`,
        description: action !== "delete" && affected < count ? `${count - affected} already had this setting.` : undefined
      });
      setAction(null);
      onClear();
      onDone();
    } catch (error) {
      toast({ title: "Could not apply", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (count === 0) return null;

  return (
    <div className="px-4 py-2.5 border-b border-border bg-primary/5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold mr-1">{count} selected</span>
      <Button size="sm" variant="outline" onClick={() => open("addRoute")} className="h-7 text-xs gap-1">
        <PlusCircle className="w-3.5 h-3.5" /> Add route
      </Button>
      <Button size="sm" variant="outline" onClick={() => open("removeRoute")} className="h-7 text-xs gap-1">
        <MinusCircle className="w-3.5 h-3.5" /> Remove route
      </Button>
      <Button size="sm" variant="outline" onClick={() => open("setValidUntil")} className="h-7 text-xs gap-1">
        <CalendarClock className="w-3.5 h-3.5" /> Pass end date
      </Button>
      <Button size="sm" variant="outline" onClick={handleExport} className="h-7 text-xs gap-1">
        <Download className="w-3.5 h-3.5" /> Export
      </Button>
      <Button size="sm" variant="outline" onClick={() => open("delete")} className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="h-7 text-xs gap-1 ml-auto">
        <X className="w-3.5 h-3.5" /> Clear selection
      </Button>

      <Dialog open={!!action} onOpenChange={(value) => !value && setAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{action ? TITLES[action] : ""}</DialogTitle>
            <DialogDescription>
              {action === "delete"
                ? `Delete ${count} student(s)? They are logged out and can no longer sign in. This cannot be undone.`
                : `Applies to ${count} selected student(s).`}
            </DialogDescription>
          </DialogHeader>

          {(action === "addRoute" || action === "removeRoute") && (
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  {routeNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "setValidUntil" && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-valid-until">Pass valid until</Label>
                <Input id="bulk-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} disabled={noEndDate} className="h-9 text-xs" />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={noEndDate} onCheckedChange={(v) => setNoEndDate(v === true)} />
                No end date (pass never expires)
              </label>
            </div>
          )}

          <Button
            onClick={handleApply}
            disabled={isSaving}
            variant={action === "delete" ? "destructive" : "default"}
            className="w-full"
          >
            {isSaving ? "Applying..." : action === "delete" ? `Delete ${count} student(s)` : "Apply"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentBulkActions;
