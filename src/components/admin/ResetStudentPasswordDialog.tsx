import { useEffect, useState } from "react";
import axios from "axios";
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

interface ResetStudentPasswordDialogProps {
  student: { _id: string; studentId: string; name: string } | null;
  onClose: () => void;
}

const MIN_LENGTH = 6;

// Admin sets a new password for a student; the student's existing logins stop working.
const ResetStudentPasswordDialog = ({ student, onClose }: ResetStudentPasswordDialogProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewPassword("");
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (newPassword.length < MIN_LENGTH) {
      toast({ title: `Password must be at least ${MIN_LENGTH} characters`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await axios.put(`/api/admin/students/${student._id}/password`, { newPassword });
      toast({ title: "Password reset", description: `Share the new password with ${student.name}.` });
      onClose();
    } catch (error) {
      toast({ title: "Could not reset password", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {student ? `${student.name} (${student.studentId}) will be logged out on all devices.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" type="text" autoComplete="off" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Reset password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetStudentPasswordDialog;
