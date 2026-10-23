import { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";
import ResetPasswordDialog from "./ResetPasswordDialog";

interface DriverAccount {
  id: string;
  name: string;
  username: string;
  active: boolean;
}

const EMPTY_FORM = { name: "", username: "", password: "" };

// Admin: driver logins. Once the first one exists, the shared driver password stops working.
const DriversPanel = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverAccount[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [resetDriver, setResetDriver] = useState<DriverAccount | null>(null);

  useEffect(() => {
    axios
      .get<DriverAccount[]>("/api/admin/drivers")
      .then((res) => setDrivers(res.data))
      .catch((error) => console.error("Could not load drivers", error));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await axios.post<DriverAccount>("/api/admin/drivers", form);
      setDrivers((prev) => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(EMPTY_FORM);
      toast({ title: "Driver added", description: `${response.data.name} can log in as "${response.data.username}".` });
    } catch (error) {
      toast({ title: "Could not add driver", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (driver: DriverAccount) => {
    try {
      const response = await axios.put<DriverAccount>(`/api/admin/drivers/${driver.id}`, { active: !driver.active });
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? response.data : d)));
    } catch (error) {
      toast({ title: "Could not update driver", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4 space-y-4">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Driver logins</h2>
        <p className="text-[11px] text-muted-foreground">
          {drivers.length === 0
            ? "Drivers currently use the shared driver password. Adding the first driver turns that off."
            : "Each driver logs in with their own username. Switch a driver off to block their login."}
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-2 items-end">
        <div className="space-y-1">
          <Label htmlFor="driver-name" className="text-xs">Name</Label>
          <Input id="driver-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="driver-username-new" className="text-xs">Username</Label>
          <Input id="driver-username-new" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. ramesh" className="h-9 text-xs" autoCapitalize="none" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="driver-password-new" className="text-xs">Password</Label>
          <Input id="driver-password-new" type="text" autoComplete="off" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min 6 characters" className="h-9 text-xs" required />
        </div>
        <Button type="submit" size="sm" disabled={isSaving} className="h-9 text-xs gap-1">
          <Plus className="w-3.5 h-3.5" />
          {isSaving ? "Adding..." : "Add driver"}
        </Button>
      </form>

      <div className="divide-y divide-border border border-border rounded-md">
        {drivers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No driver accounts yet</p>}
        {drivers.map((driver) => (
          <div key={driver.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{driver.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{driver.username}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] ${driver.active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                {driver.active ? "Active" : "Disabled"}
              </span>
              <Switch checked={driver.active} onCheckedChange={() => handleToggleActive(driver)} aria-label={`${driver.name} can log in`} />
              <Button variant="ghost" size="sm" onClick={() => setResetDriver(driver)} className="h-7 text-xs">
                Reset Password
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ResetPasswordDialog
        person={resetDriver ? { name: resetDriver.name, detail: resetDriver.username } : null}
        endpoint={resetDriver ? `/api/admin/drivers/${resetDriver.id}/password` : null}
        onClose={() => setResetDriver(null)}
      />
    </div>
  );
};

export default DriversPanel;
