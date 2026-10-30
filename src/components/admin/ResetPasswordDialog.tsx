import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
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

interface ResetPasswordDialogProps {
  // who is being reset, e.g. { name: "Asha", detail: "UGI-2024-CS-001" }; null closes the dialog
  person: { name: string; detail: string } | null;
  // e.g. /api/admin/students/:id/password or /api/admin/drivers/:id/password
  endpoint: string | null;
  onClose: () => void;
}

const MIN_LENGTH = 6;

// Admin sets a new password for a student or driver; their existing logins stop working.
const ResetPasswordDialog = ({ person, endpoint, onClose }: ResetPasswordDialogProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewPassword("");
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person || !endpoint) return;
    if (newPassword.length < MIN_LENGTH) {
      toast({ title: `Password must be at least ${MIN_LENGTH} characters`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await axios.put(endpoint, { newPassword });
      toast({ title: "Password reset", description: `Share the new password with ${person.name}.` });
      onClose();
    } catch (error) {
      toast({ title: "Could not reset password", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!person} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {person ? `${person.name} (${person.detail}) will be logged out on all devices.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New password</Label>
            <PasswordInput id="reset-password" name="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? "Saving…" : "Reset Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
