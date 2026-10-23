import { useState } from "react";
import axios from "axios";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/utils";

interface ChangePasswordDialogProps {
  // "/api/student/password" or "/api/admin/password"
  endpoint: string;
  minLength: number;
  // gets the API response, e.g. a fresh student token
  onChanged?: (data: { token?: string }) => void;
}

// "Change password" button + dialog for the logged-in user.
const ChangePasswordDialog = ({ endpoint, minLength, onChanged }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < minLength) {
      toast({ title: `New password must be at least ${minLength} characters`, variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.post(endpoint, { currentPassword, newPassword });
      onChanged?.(response.data);
      toast({ title: "Password changed" });
      reset();
      setOpen(false);
    } catch (error) {
      toast({ title: "Could not change password", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-8 px-3 rounded-md text-xs font-semibold" title="Change password">
        <KeyRound className="w-3.5 h-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">Password</span>
      </Button>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Use at least {minLength} characters.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Change password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChangePasswordDialog;
