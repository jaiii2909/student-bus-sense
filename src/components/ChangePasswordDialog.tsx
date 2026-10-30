import { useState } from "react";
import axios from "axios";
import { KeyRound, Lock, Loader2 } from "lucide-react";
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

interface ChangePasswordDialogProps {
  // "/api/student/password" or "/api/admin/password"
  endpoint: string;
  minLength: number;
  // gets the API response, e.g. a fresh student token
  onChanged?: (data: { token?: string }) => void;
}

// "Change password" button + dialog for the logged-in user.
type ErrorField = "current" | "new" | "confirm" | "form";

const ChangePasswordDialog = ({ endpoint, minLength, onChanged }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{ field: ErrorField; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // show the message under the field it belongs to and move focus there
  const fail = (field: ErrorField, message: string) => {
    setError({ field, message });
    if (field !== "form") document.getElementById(`${field}-password`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < minLength) {
      fail("new", `Use at least ${minLength} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      fail("confirm", "This doesn't match the new password. Type it again.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.post(endpoint, { currentPassword, newPassword });
      onChanged?.(response.data);
      toast({ title: "Password changed successfully" });
      reset();
      setOpen(false);
    } catch (err) {
      fail("form", apiErrorMessage(err, "Could not change the password. Check your current password and try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const errorFor = (field: ErrorField) =>
    error?.field === field ? (
      <p id={`${field}-password-error`} role="alert" className="text-xs font-medium text-destructive">
        {error.message}
      </p>
    ) : null;

  const fieldProps = (field: ErrorField) => ({
    id: `${field}-password`,
    className: "h-10 text-xs border-border",
    required: true,
    "aria-invalid": error?.field === field,
    "aria-describedby": error?.field === field ? `${field}-password-error` : undefined,
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 text-xs font-semibold border-border hover:bg-muted transition-colors"
        title="Change account password"
        aria-label="Change password"
      >
        <KeyRound className="w-3.5 h-3.5 sm:mr-1.5 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Password</span>
      </Button>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-bold">Update Account Password</DialogTitle>
            <DialogDescription className="text-xs">
              Must be at least {minLength} characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput
                {...fieldProps("current")}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errorFor("current")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                {...fieldProps("new")}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errorFor("new")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput
                {...fieldProps("confirm")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errorFor("confirm")}
            </div>
            {error?.field === "form" && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error.message}
              </p>
            )}
            <Button type="submit" disabled={isSaving} className="w-full h-10 text-xs font-bold mt-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" aria-hidden="true" />
                  Updating…
                </>
              ) : (
                "Save New Password"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChangePasswordDialog;
